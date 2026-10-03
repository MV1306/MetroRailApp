using MetroRailApp.Core.DTOs;
using MetroRailApp.Core.Entities;
using MetroRailApp.Core.Interfaces;
using MetroRailApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MetroRailApp.Services.Implementations;

public class TimetableService(AppDbContext db) : ITimetableService
{
    private static LineTimetableDto ToDto(LineTimetable t) => new(
        t.Id, t.LineId, t.Line.Name, t.Line.Color,
        t.Direction.ToString(), t.DayType.ToString(),
        t.FirstDeparture, t.LastDeparture,
        t.PeakWindows.Select(p => new PeakWindowDto(p.Start, p.End)).ToList(),
        t.PeakFrequencyMinutes, t.OffPeakFrequencyMinutes);

    public async Task<List<LineTimetableDto>> GetAllAsync() =>
        await db.LineTimetables.Include(t => t.Line)
            .OrderBy(t => t.LineId).ThenBy(t => t.DayType).ThenBy(t => t.Direction)
            .Select(t => ToDto(t)).ToListAsync();

    public async Task<List<LineTimetableDto>> GetByLineAsync(int lineId) =>
        await db.LineTimetables.Include(t => t.Line)
            .Where(t => t.LineId == lineId)
            .Select(t => ToDto(t)).ToListAsync();

    public async Task<LineTimetableDto> CreateAsync(LineTimetableUpsertDto dto)
    {
        var t = new LineTimetable
        {
            LineId = dto.LineId,
            Direction = Enum.Parse<TrainDirection>(dto.Direction),
            DayType = Enum.Parse<DayType>(dto.DayType),
            FirstDeparture = dto.FirstDeparture, LastDeparture = dto.LastDeparture,
            PeakWindows = dto.PeakWindows.Select(p => new PeakWindow { Start = p.Start, End = p.End }).ToList(),
            PeakFrequencyMinutes = dto.PeakFrequencyMinutes,
            OffPeakFrequencyMinutes = dto.OffPeakFrequencyMinutes
        };
        db.LineTimetables.Add(t);
        await db.SaveChangesAsync();
        await db.Entry(t).Reference(x => x.Line).LoadAsync();
        return ToDto(t);
    }

    public async Task<LineTimetableDto?> UpdateAsync(int id, LineTimetableUpsertDto dto)
    {
        var t = await db.LineTimetables.Include(x => x.Line).FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return null;
        t.LineId = dto.LineId;
        t.Direction = Enum.Parse<TrainDirection>(dto.Direction);
        t.DayType = Enum.Parse<DayType>(dto.DayType);
        t.FirstDeparture = dto.FirstDeparture; t.LastDeparture = dto.LastDeparture;
        t.PeakWindows = dto.PeakWindows.Select(p => new PeakWindow { Start = p.Start, End = p.End }).ToList();
        t.PeakFrequencyMinutes = dto.PeakFrequencyMinutes;
        t.OffPeakFrequencyMinutes = dto.OffPeakFrequencyMinutes;
        await db.SaveChangesAsync();
        await db.Entry(t).Reference(x => x.Line).LoadAsync();
        return ToDto(t);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var t = await db.LineTimetables.FindAsync(id);
        if (t == null) return false;
        db.LineTimetables.Remove(t);
        await db.SaveChangesAsync();
        return true;
    }
}

public class LiveTrainService(AppDbContext db) : ILiveTrainService
{
    // Parse "HH:mm" into today's DateTime (UTC)
    private static DateTime Today(string hhmm)
    {
        var parts = hhmm.Split(':');
        var now = DateTime.UtcNow;
        return DateTime.SpecifyKind(new DateTime(now.Year, now.Month, now.Day, int.Parse(parts[0]), int.Parse(parts[1]), 0), DateTimeKind.Utc);
    }

    // Generate all departure times from terminal for a timetable entry
    private static List<DateTime> GenerateDepartures(LineTimetable t)
    {
        var departures = new List<DateTime>();
        var first = ToDay(t.FirstDeparture);
        var last = ToDay(t.LastDeparture);
        var peakWindows = t.PeakWindows
            .Select(p => (Start: ToDay(p.Start), End: ToDay(p.End)))
            .ToList();
        var current = first;

        while (current <= last)
        {
            departures.Add(current);
            var isPeak = peakWindows.Any(w => current >= w.Start && current < w.End);
            current = current.AddMinutes(isPeak ? t.PeakFrequencyMinutes : t.OffPeakFrequencyMinutes);
        }
        return departures;
    }

    private static DateTime ToDay(string hhmm)
    {
        var parts = hhmm.Split(':');
        var now = DateTime.UtcNow;
        return DateTime.SpecifyKind(new DateTime(now.Year, now.Month, now.Day, int.Parse(parts[0]), int.Parse(parts[1]), 0), DateTimeKind.Utc);
    }

    // Build ordered station list with cumulative travel times from terminal
    private static List<(int StationId, string StationName, int CumulativeMinutes)> BuildStationTimeline(
        List<LineStation> lineStations, List<StationConnection> connections, bool forward)
    {
        var ordered = lineStations.OrderBy(ls => ls.SequenceNo).ToList();
        if (!forward) ordered = ordered.AsEnumerable().Reverse().ToList();

        var connMap = connections.ToDictionary(c => (c.FromStationId, c.ToStationId));
        var timeline = new List<(int, string, int)>();
        int cumulative = 0;

        for (int i = 0; i < ordered.Count; i++)
        {
            timeline.Add((ordered[i].StationId, ordered[i].Station.Name, cumulative));
            if (i < ordered.Count - 1)
            {
                var fromId = ordered[i].StationId;
                var toId = ordered[i + 1].StationId;
                int travelTime = connMap.TryGetValue((fromId, toId), out var c1) ? c1.TravelTimeMinutes
                               : connMap.TryGetValue((toId, fromId), out var c2) ? c2.TravelTimeMinutes
                               : 3; // fallback
                cumulative += travelTime;
            }
        }
        return timeline;
    }

    public async Task<StationLiveDto> GetNextDeparturesAsync(int stationId, int count = 5, int? toStationId = null)
    {
        var now = DateTime.UtcNow;
        var dayType = now.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday
            ? DayType.Weekend : DayType.Weekday;

        var station = await db.Stations.FindAsync(stationId);
        if (station == null) return new StationLiveDto(stationId, "", []);

        var lineStationEntries = await db.LineStations
            .Include(ls => ls.Line)
            .Include(ls => ls.Station)
            .Where(ls => ls.StationId == stationId)
            .ToListAsync();

        var lineIds = lineStationEntries.Select(ls => ls.LineId).Distinct().ToList();

        var timetables = await db.LineTimetables
            .Where(t => lineIds.Contains(t.LineId) && t.DayType == dayType)
            .ToListAsync();

        var allLineStations = await db.LineStations
            .Include(ls => ls.Station)
            .Where(ls => lineIds.Contains(ls.LineId))
            .ToListAsync();

        var connections = await db.StationConnections.ToListAsync();

        var platforms = await db.Platforms
            .Where(p => p.StationId == stationId && lineIds.Contains(p.LineId))
            .ToListAsync();

        // pre-compute direction per line if toStationId provided
        Dictionary<int, TrainDirection?> lineDirections = [];
        if (toStationId.HasValue)
        {
            foreach (var lineId in lineIds)
            {
                var ordered = allLineStations
                    .Where(ls => ls.LineId == lineId)
                    .OrderBy(ls => ls.SequenceNo)
                    .ToList();
                var fromSeq = ordered.FirstOrDefault(ls => ls.StationId == stationId)?.SequenceNo;
                var toSeq   = ordered.FirstOrDefault(ls => ls.StationId == toStationId.Value)?.SequenceNo;
                if (fromSeq.HasValue && toSeq.HasValue)
                    lineDirections[lineId] = toSeq > fromSeq ? TrainDirection.Forward : TrainDirection.Backward;
                else
                    lineDirections[lineId] = null; // toStation not on this line — allow both
            }
        }

        var departures = new List<NextDepartureDto>();

        foreach (var timetable in timetables)
        {
            // skip wrong direction if we know the required direction
            if (lineDirections.TryGetValue(timetable.LineId, out var requiredDir)
                && requiredDir.HasValue
                && timetable.Direction != requiredDir.Value)
                continue;

            var forward = timetable.Direction == TrainDirection.Forward;
            var lineStations = allLineStations.Where(ls => ls.LineId == timetable.LineId).ToList();
            var timeline = BuildStationTimeline(lineStations, connections, forward);

            var stationEntry = timeline.FirstOrDefault(t => t.StationId == stationId);
            if (stationEntry == default) continue;

            var terminalStation = timeline.Last();
            var platform = platforms.FirstOrDefault(p =>
                p.LineId == timetable.LineId &&
                p.TowardsDestination == terminalStation.StationName);
            platform ??= platforms.FirstOrDefault(p => p.LineId == timetable.LineId);

            foreach (var dep in GenerateDepartures(timetable))
            {
                var arrivalAtStation = dep.AddMinutes(stationEntry.CumulativeMinutes);
                var minutesFromNow = (int)Math.Round((arrivalAtStation - now).TotalMinutes);
                if (minutesFromNow < 0 || minutesFromNow > 90) continue;

                departures.Add(new NextDepartureDto(
                    timetable.Line?.Name ?? "",
                    timetable.Line?.Color ?? "#000",
                    timetable.Direction.ToString(),
                    terminalStation.StationName,
                    minutesFromNow,
                    arrivalAtStation.ToString("HH:mm"),
                    platform?.PlatformNumber ?? "—"
                ));
            }
        }

        var sorted = departures.OrderBy(d => d.DepartureInMinutes).Take(count).ToList();
        return new StationLiveDto(stationId, station.Name, sorted);
    }

    public async Task<LineLiveDto> GetActiveTrainsAsync(int lineId)
    {
        var now = DateTime.UtcNow;
        var dayType = now.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday
            ? DayType.Weekend : DayType.Weekday;

        var line = await db.Lines.FindAsync(lineId);
        if (line == null) return new LineLiveDto("", "", []);

        var timetables = await db.LineTimetables
            .Where(t => t.LineId == lineId && t.DayType == dayType)
            .ToListAsync();

        var lineStations = await db.LineStations
            .Include(ls => ls.Station)
            .Where(ls => ls.LineId == lineId)
            .ToListAsync();

        var connections = await db.StationConnections.ToListAsync();
        var activeTrains = new List<LiveTrainDto>();
        int runId = 1;

        foreach (var timetable in timetables)
        {
            var forward = timetable.Direction == TrainDirection.Forward;
            var timeline = BuildStationTimeline(lineStations, connections, forward);
            if (timeline.Count == 0) continue;

            var totalMinutes = timeline.Last().CumulativeMinutes;

            foreach (var dep in GenerateDepartures(timetable))
            {
                var elapsed = (now - dep).TotalMinutes;
                if (elapsed < 0 || elapsed > totalMinutes) continue;

                // find which segment the train is in
                int segIdx = 0;
                for (int i = 0; i < timeline.Count - 1; i++)
                {
                    if (elapsed >= timeline[i].CumulativeMinutes && elapsed < timeline[i + 1].CumulativeMinutes)
                    { segIdx = i; break; }
                }

                var curr = timeline[segIdx];
                bool hasNext = segIdx + 1 < timeline.Count;
                var next = hasNext ? timeline[segIdx + 1] : (StationId: 0, StationName: "", CumulativeMinutes: 0);

                int segDuration = hasNext ? next.CumulativeMinutes - curr.CumulativeMinutes : 1;
                int segElapsed = (int)(elapsed - curr.CumulativeMinutes);
                int progress = segDuration > 0 ? Math.Min(100, (int)(segElapsed * 100.0 / segDuration)) : 100;

                activeTrains.Add(new LiveTrainDto(
                    runId++, line.Name, line.Color,
                    timetable.Direction.ToString(),
                    timeline.Last().StationName,
                    curr.StationId, curr.StationName,
                    hasNext ? next.StationId : null,
                    hasNext ? next.StationName : null,
                    progress,
                    dep.ToString("HH:mm")
                ));
            }
        }

        return new LineLiveDto(line.Name, line.Color, activeTrains);
    }
}
