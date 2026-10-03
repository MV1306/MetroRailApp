using MetroRailApp.Core.DTOs;
using MetroRailApp.Core.Entities;
using MetroRailApp.Core.Interfaces;
using MetroRailApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MetroRailApp.Services.Implementations;

public class FareService(AppDbContext db) : IFareService
{
    public async Task<List<FareRuleDto>> GetAllAsync() =>
        await db.FareRules.OrderBy(f => f.MinDistanceKm)
            .Select(f => new FareRuleDto(f.Id, f.MinDistanceKm, f.MaxDistanceKm, f.Fare)).ToListAsync();

    public async Task<FareRuleDto> CreateAsync(FareRuleUpsertDto dto)
    {
        var f = new FareRule { MinDistanceKm = dto.MinDistanceKm, MaxDistanceKm = dto.MaxDistanceKm, Fare = dto.Fare };
        db.FareRules.Add(f);
        await db.SaveChangesAsync();
        return new FareRuleDto(f.Id, f.MinDistanceKm, f.MaxDistanceKm, f.Fare);
    }

    public async Task<FareRuleDto?> UpdateAsync(int id, FareRuleUpsertDto dto)
    {
        var f = await db.FareRules.FindAsync(id);
        if (f == null) return null;
        f.MinDistanceKm = dto.MinDistanceKm; f.MaxDistanceKm = dto.MaxDistanceKm; f.Fare = dto.Fare;
        await db.SaveChangesAsync();
        return new FareRuleDto(f.Id, f.MinDistanceKm, f.MaxDistanceKm, f.Fare);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var f = await db.FareRules.FindAsync(id);
        if (f == null) return false;
        db.FareRules.Remove(f);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<FareResponseDto> CalculateAsync(int fromStationId, int toStationId)
    {
        var connections = await db.StationConnections.ToListAsync();
        var distance = ComputeDistance(connections, fromStationId, toStationId);
        var fare = await GetFareForDistance(distance);
        return new FareResponseDto(Math.Round(distance, 2), fare);
    }

    private static double ComputeDistance(List<StationConnection> connections, int from, int to)
    {
        var graph = new Dictionary<int, List<(int, double)>>();
        foreach (var c in connections)
        {
            if (!graph.ContainsKey(c.FromStationId)) graph[c.FromStationId] = [];
            if (!graph.ContainsKey(c.ToStationId)) graph[c.ToStationId] = [];
            graph[c.FromStationId].Add((c.ToStationId, c.DistanceKm));
            graph[c.ToStationId].Add((c.FromStationId, c.DistanceKm));
        }
        return Dijkstra(graph, from, to);
    }

    private static double Dijkstra(Dictionary<int, List<(int, double)>> graph, int start, int end)
    {
        var dist = new Dictionary<int, double> { [start] = 0 };
        var pq = new SortedSet<(double, int)> { (0, start) };
        while (pq.Count > 0)
        {
            var (d, u) = pq.Min; pq.Remove(pq.Min);
            if (u == end) return d;
            if (!graph.ContainsKey(u)) continue;
            foreach (var (v, w) in graph[u])
            {
                var nd = d + w;
                if (!dist.ContainsKey(v) || nd < dist[v])
                {
                    dist[v] = nd;
                    pq.Add((nd, v));
                }
            }
        }
        return dist.GetValueOrDefault(end, double.MaxValue);
    }

    private async Task<decimal> GetFareForDistance(double distance)
    {
        var rule = await db.FareRules
            .Where(f => distance >= f.MinDistanceKm && distance < f.MaxDistanceKm)
            .FirstOrDefaultAsync();
        return rule?.Fare ?? (await db.FareRules.OrderByDescending(f => f.MaxDistanceKm).FirstOrDefaultAsync())?.Fare ?? 0;
    }
}

public class GateService(AppDbContext db) : IGateService
{
    public async Task<List<StationGateDto>> GetByStationAsync(int stationId) =>
        await db.StationGates.Where(g => g.StationId == stationId)
            .Select(g => new StationGateDto(g.Id, g.StationId, g.GateNumber, g.Latitude, g.Longitude, g.Description, g.Accessibles))
            .ToListAsync();

    public async Task<StationGateDto> CreateAsync(StationGateUpsertDto dto)
    {
        var g = new StationGate { StationId = dto.StationId, GateNumber = dto.GateNumber, Latitude = dto.Latitude, Longitude = dto.Longitude, Description = dto.Description, Accessibles = dto.Accessibles };
        db.StationGates.Add(g);
        await db.SaveChangesAsync();
        return new StationGateDto(g.Id, g.StationId, g.GateNumber, g.Latitude, g.Longitude, g.Description, g.Accessibles);
    }

    public async Task<StationGateDto?> UpdateAsync(int id, StationGateUpsertDto dto)
    {
        var g = await db.StationGates.FindAsync(id);
        if (g == null) return null;
        g.GateNumber = dto.GateNumber; g.Latitude = dto.Latitude; g.Longitude = dto.Longitude;
        g.Description = dto.Description; g.Accessibles = dto.Accessibles;
        await db.SaveChangesAsync();
        return new StationGateDto(g.Id, g.StationId, g.GateNumber, g.Latitude, g.Longitude, g.Description, g.Accessibles);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var g = await db.StationGates.FindAsync(id);
        if (g == null) return false;
        db.StationGates.Remove(g);
        await db.SaveChangesAsync();
        return true;
    }
}

public class FeederServiceImpl(AppDbContext db) : IFeederService
{
    public async Task<List<FeederServiceDto>> GetByStationAsync(int stationId) =>
        await db.FeederServices.Where(f => f.StationId == stationId)
            .Select(f => new FeederServiceDto(f.Id, f.StationId, f.Type, f.Description)).ToListAsync();

    public async Task<FeederServiceDto> CreateAsync(FeederServiceUpsertDto dto)
    {
        var f = new FeederService { StationId = dto.StationId, Type = dto.Type, Description = dto.Description };
        db.FeederServices.Add(f);
        await db.SaveChangesAsync();
        return new FeederServiceDto(f.Id, f.StationId, f.Type, f.Description);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var f = await db.FeederServices.FindAsync(id);
        if (f == null) return false;
        db.FeederServices.Remove(f);
        await db.SaveChangesAsync();
        return true;
    }
}

public class RecentSearchService(AppDbContext db) : IRecentSearchService
{
    private const int MaxRecent = 5;

    public async Task<List<RecentSearchDto>> GetByUserAsync(string userId) =>
        await db.RecentSearches
            .Include(r => r.FromStation).Include(r => r.ToStation)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.SearchedAt)
            .Take(MaxRecent)
            .Select(r => new RecentSearchDto(r.FromStationId, r.FromStation.Name, r.ToStationId, r.ToStation.Name, DateTime.SpecifyKind(r.SearchedAt, DateTimeKind.Utc)))
            .ToListAsync();

    public async Task SaveAsync(string userId, int fromStationId, int toStationId)
    {
        // upsert: update timestamp if same pair exists, else insert
        var existing = await db.RecentSearches
            .FirstOrDefaultAsync(r => r.UserId == userId && r.FromStationId == fromStationId && r.ToStationId == toStationId);

        if (existing is not null)
        {
            existing.SearchedAt = DateTime.UtcNow;
        }
        else
        {
            db.RecentSearches.Add(new RecentSearch
            {
                UserId = userId,
                FromStationId = fromStationId,
                ToStationId = toStationId,
            });

            // trim to MaxRecent per user
            var count = await db.RecentSearches.CountAsync(r => r.UserId == userId);
            if (count >= MaxRecent)
            {
                var oldest = await db.RecentSearches
                    .Where(r => r.UserId == userId)
                    .OrderBy(r => r.SearchedAt)
                    .FirstAsync();
                db.RecentSearches.Remove(oldest);
            }
        }

        await db.SaveChangesAsync();
    }
}

public class PlatformService(AppDbContext db) : IPlatformService
{
    private static PlatformDto ToDto(Platform p) => new(
        p.Id, p.StationId, p.Station.Name, p.LineId, p.Line.Name, p.Line.Color,
        p.PlatformNumber, p.TowardsDestination, p.IsActive);

    public async Task<List<PlatformDto>> GetByStationAsync(int stationId) =>
        await db.Platforms
            .Include(p => p.Station).Include(p => p.Line)
            .Where(p => p.StationId == stationId)
            .OrderBy(p => p.LineId).ThenBy(p => p.PlatformNumber)
            .Select(p => ToDto(p)).ToListAsync();

    public async Task<PlatformDto> CreateAsync(PlatformUpsertDto dto)
    {
        var p = new Platform { StationId = dto.StationId, LineId = dto.LineId, PlatformNumber = dto.PlatformNumber, TowardsDestination = dto.TowardsDestination, IsActive = dto.IsActive };
        db.Platforms.Add(p);
        await db.SaveChangesAsync();
        await db.Entry(p).Reference(x => x.Station).LoadAsync();
        await db.Entry(p).Reference(x => x.Line).LoadAsync();
        return ToDto(p);
    }

    public async Task<PlatformDto?> UpdateAsync(int id, PlatformUpsertDto dto)
    {
        var p = await db.Platforms.Include(x => x.Station).Include(x => x.Line).FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return null;
        p.LineId = dto.LineId; p.PlatformNumber = dto.PlatformNumber;
        p.TowardsDestination = dto.TowardsDestination; p.IsActive = dto.IsActive;
        await db.SaveChangesAsync();
        await db.Entry(p).Reference(x => x.Line).LoadAsync();
        return ToDto(p);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var p = await db.Platforms.FindAsync(id);
        if (p == null) return false;
        db.Platforms.Remove(p);
        await db.SaveChangesAsync();
        return true;
    }
}
