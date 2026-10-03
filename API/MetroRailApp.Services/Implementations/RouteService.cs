using MetroRailApp.Core.DTOs;
using MetroRailApp.Core.Entities;
using MetroRailApp.Core.Interfaces;
using MetroRailApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MetroRailApp.Services.Implementations;

public class RouteService(AppDbContext db) : IRouteService
{
    public async Task<List<RouteOptionDto>> FindRoutesAsync(RouteRequestDto request)
    {
        var connections = await db.StationConnections.ToListAsync();
        var stations = await db.Stations.ToListAsync();
        var lineStations = await db.LineStations.Include(ls => ls.Line).ToListAsync();
        var interchanges = await db.Interchanges.ToListAsync();
        var fareRules = await db.FareRules.OrderBy(f => f.MinDistanceKm).ToListAsync();

        var graph = BuildGraph(connections, interchanges);

        var byDistance = FindPath(graph, request.FromStationId, request.ToStationId, EdgeWeight.Distance);
        var byTime = FindPath(graph, request.FromStationId, request.ToStationId, EdgeWeight.Time);

        var results = new List<RouteOptionDto>();

        if (byTime != null)
            results.Add(BuildOption("Fastest", byTime, stations, lineStations, connections, fareRules));

        if (byDistance != null && (byTime == null || !byDistance.SequenceEqual(byTime)))
            results.Add(BuildOption("Shortest Distance", byDistance, stations, lineStations, connections, fareRules));

        if (results.Count == 0 && byTime != null)
            results.Add(BuildOption("Available Route", byTime, stations, lineStations, connections, fareRules));

        return results;
    }

    private static Dictionary<int, List<GraphEdge>> BuildGraph(List<StationConnection> connections, List<Interchange> interchanges)
    {
        var graph = new Dictionary<int, List<GraphEdge>>();

        void AddEdge(int from, int to, double dist, int time)
        {
            if (!graph.ContainsKey(from)) graph[from] = [];
            if (!graph.ContainsKey(to)) graph[to] = [];
            graph[from].Add(new GraphEdge(to, dist, time, false));
            graph[to].Add(new GraphEdge(from, dist, time, false));
        }

        foreach (var c in connections)
            AddEdge(c.FromStationId, c.ToStationId, c.DistanceKm, c.TravelTimeMinutes);

        foreach (var i in interchanges)
        {
            if (!graph.ContainsKey(i.StationId)) graph[i.StationId] = [];
            graph[i.StationId].Add(new GraphEdge(i.StationId, 0, i.TransferTimeMinutes, true));
        }

        return graph;
    }

    private static List<int>? FindPath(Dictionary<int, List<GraphEdge>> graph, int start, int end, EdgeWeight weightType)
    {
        var dist = new Dictionary<int, double> { [start] = 0 };
        var prev = new Dictionary<int, int>();
        var pq = new SortedSet<(double, int)>(Comparer<(double, int)>.Create((a, b) =>
            a.Item1 != b.Item1 ? a.Item1.CompareTo(b.Item1) : a.Item2.CompareTo(b.Item2)))
        { (0, start) };

        while (pq.Count > 0)
        {
            var (d, u) = pq.Min; pq.Remove(pq.Min);
            if (u == end) break;
            if (!graph.ContainsKey(u)) continue;
            foreach (var edge in graph[u])
            {
                var w = weightType == EdgeWeight.Distance ? edge.Distance : edge.TimeMinutes;
                var nd = d + w;
                if (!dist.ContainsKey(edge.To) || nd < dist[edge.To])
                {
                    dist[edge.To] = nd;
                    prev[edge.To] = u;
                    pq.Add((nd, edge.To));
                }
            }
        }

        if (!prev.ContainsKey(end) && start != end) return null;

        var path = new List<int>();
        for (var cur = end; cur != start; cur = prev[cur])
        {
            path.Add(cur);
            if (!prev.ContainsKey(cur)) return null;
        }
        path.Add(start);
        path.Reverse();
        return path;
    }

    private static RouteOptionDto BuildOption(
        string label, List<int> path,
        List<Station> stations,
        List<LineStation> lineStations,
        List<StationConnection> connections,
        List<FareRule> fareRules)
    {
        var stationMap = stations.ToDictionary(s => s.Id);
        // Build a quick lookup: (fromId, toId) -> connection
        var connMap = connections.ToDictionary(c => (c.FromStationId, c.ToStationId));
        var steps = new List<RouteStepDto>();
        double totalDist = 0;
        int totalTime = 0;
        int interchangeCount = 0;
        int? prevLineId = null;

        for (int i = 0; i < path.Count; i++)
        {
            var stationId = path[i];
            var station = stationMap[stationId];

            // pick the correct line for this station:
            // prefer continuing on the same line as the previous step (avoids premature interchange)
            // for the first step, prefer the line shared with the next station
            var stationLines = lineStations.Where(l => l.StationId == stationId).ToList();
            LineStation? ls;
            if (prevLineId.HasValue)
            {
                // stay on the same line as long as the next station is also on it
                int? nextId = i < path.Count - 1 ? path[i + 1] : (int?)null;
                bool nextIsOnSameLine = nextId.HasValue &&
                    lineStations.Any(l => l.StationId == nextId.Value && l.LineId == prevLineId.Value);
                bool currentIsOnPrevLine = stationLines.Any(l => l.LineId == prevLineId.Value);

                if (currentIsOnPrevLine && (nextIsOnSameLine || nextId == null))
                    ls = stationLines.First(l => l.LineId == prevLineId.Value);
                else if (currentIsOnPrevLine && !nextIsOnSameLine && nextId.HasValue)
                    // this is the interchange station — keep prev line here, next step switches
                    ls = stationLines.First(l => l.LineId == prevLineId.Value);
                else
                    ls = stationLines.FirstOrDefault();
            }
            else if (i < path.Count - 1)
            {
                var nextId = path[i + 1];
                var nextLineIds = lineStations.Where(l => l.StationId == nextId).Select(l => l.LineId).ToHashSet();
                ls = stationLines.FirstOrDefault(l => nextLineIds.Contains(l.LineId))
                  ?? stationLines.FirstOrDefault();
            }
            else
            {
                ls = stationLines.FirstOrDefault();
            }

            prevLineId = ls?.LineId;
            double? distFromPrev = null;
            int? timeFromPrev = null;

            if (i > 0)
            {
                var prevId = path[i - 1];
                var prevStepLineId = steps[i - 1] is { } prevStep
                    ? lineStations.FirstOrDefault(l => l.StationId == path[i-1] && l.Line.Name == prevStep.LineName)?.LineId
                    : null;
                if (prevStepLineId.HasValue && ls?.LineId != prevStepLineId.Value) interchangeCount++;

                // Look up connection in either direction
                if (connMap.TryGetValue((prevId, stationId), out var conn) ||
                    connMap.TryGetValue((stationId, prevId), out conn))
                {
                    distFromPrev = conn.DistanceKm;
                    timeFromPrev = conn.TravelTimeMinutes;
                    totalDist += conn.DistanceKm;
                    totalTime += conn.TravelTimeMinutes;
                }
            }

            steps.Add(new RouteStepDto(
                stationId, station.Name,
                ls?.Line.Name ?? "Unknown",
                ls?.Line.Color ?? "#000",
                distFromPrev, timeFromPrev));
        }

        var fare = GetFare(fareRules, totalDist);
        return new RouteOptionDto(label, steps, Math.Round(totalDist, 2), totalTime, interchangeCount, fare);
    }

    private static decimal GetFare(List<FareRule> rules, double distance)
    {
        var rule = rules.FirstOrDefault(r => distance >= r.MinDistanceKm && distance < r.MaxDistanceKm);
        return rule?.Fare ?? rules.LastOrDefault()?.Fare ?? 0;
    }
}

public class FavouriteRouteService(AppDbContext db) : IFavouriteRouteService
{
    public async Task<List<FavouriteRouteDto>> GetByUserAsync(string userId) =>
        await db.FavouriteRoutes.Include(f => f.FromStation).Include(f => f.ToStation)
            .Where(f => f.UserId == userId)
            .Select(f => new FavouriteRouteDto(f.Id, f.Label, f.FromStationId, f.FromStation.Name, f.ToStationId, f.ToStation.Name))
            .ToListAsync();

    public async Task<FavouriteRouteDto> CreateAsync(string userId, FavouriteRouteUpsertDto dto)
    {
        var f = new FavouriteRoute { UserId = userId, Label = dto.Label, FromStationId = dto.FromStationId, ToStationId = dto.ToStationId };
        db.FavouriteRoutes.Add(f);
        await db.SaveChangesAsync();
        await db.Entry(f).Reference(x => x.FromStation).LoadAsync();
        await db.Entry(f).Reference(x => x.ToStation).LoadAsync();
        return new FavouriteRouteDto(f.Id, f.Label, f.FromStationId, f.FromStation.Name, f.ToStationId, f.ToStation.Name);
    }

    public async Task<bool> DeleteAsync(string userId, int id)
    {
        var f = await db.FavouriteRoutes.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
        if (f == null) return false;
        db.FavouriteRoutes.Remove(f);
        await db.SaveChangesAsync();
        return true;
    }
}

public class DashboardService(AppDbContext db) : IDashboardService
{
    public async Task<DashboardStatsDto> GetStatsAsync() => new(
        await db.Lines.CountAsync(),
        await db.Stations.CountAsync(),
        await db.StationConnections.CountAsync(),
        await db.Interchanges.CountAsync(),
        await db.Stations.CountAsync(s => s.IsActive),
        await db.FareRules.CountAsync());
}

public enum EdgeWeight { Distance, Time }
public record GraphEdge(int To, double Distance, int TimeMinutes, bool IsInterchange);
