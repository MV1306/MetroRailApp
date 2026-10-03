using MetroRailApp.Core.DTOs;
using MetroRailApp.Core.Entities;
using MetroRailApp.Core.Interfaces;
using MetroRailApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MetroRailApp.Services.Implementations;

public class LineStationService(AppDbContext db) : ILineStationService
{
    public async Task<List<LineStationDto>> GetByLineAsync(int lineId) =>
        await db.LineStations.Include(ls => ls.Line).Include(ls => ls.Station)
            .Where(ls => ls.LineId == lineId).OrderBy(ls => ls.SequenceNo)
            .Select(ls => new LineStationDto(ls.Id, ls.LineId, ls.Line.Name, ls.StationId, ls.Station.Name, ls.SequenceNo))
            .ToListAsync();

    public async Task<LineStationDto> CreateAsync(LineStationUpsertDto dto)
    {
        var ls = new LineStation { LineId = dto.LineId, StationId = dto.StationId, SequenceNo = dto.SequenceNo };
        db.LineStations.Add(ls);
        await db.SaveChangesAsync();
        await db.Entry(ls).Reference(x => x.Line).LoadAsync();
        await db.Entry(ls).Reference(x => x.Station).LoadAsync();
        await AutoCreateConnectionAsync(dto.LineId, dto.StationId, dto.SequenceNo);
        return new LineStationDto(ls.Id, ls.LineId, ls.Line.Name, ls.StationId, ls.Station.Name, ls.SequenceNo);
    }

    public async Task<LineStationDto?> UpdateAsync(int id, LineStationUpsertDto dto)
    {
        var ls = await db.LineStations.Include(x => x.Line).Include(x => x.Station).FirstOrDefaultAsync(x => x.Id == id);
        if (ls == null) return null;
        ls.LineId = dto.LineId; ls.StationId = dto.StationId; ls.SequenceNo = dto.SequenceNo;
        await db.SaveChangesAsync();
        await AutoCreateConnectionAsync(dto.LineId, dto.StationId, dto.SequenceNo);
        return new LineStationDto(ls.Id, ls.LineId, ls.Line.Name, ls.StationId, ls.Station.Name, ls.SequenceNo);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var ls = await db.LineStations.FindAsync(id);
        if (ls == null) return false;
        db.LineStations.Remove(ls);
        await db.SaveChangesAsync();
        return true;
    }

    private async Task AutoCreateConnectionAsync(int lineId, int stationId, int sequenceNo)
    {
        // Find the adjacent station (sequenceNo - 1) on the same line
        var prevLineStation = await db.LineStations
            .Include(x => x.Station)
            .FirstOrDefaultAsync(x => x.LineId == lineId && x.SequenceNo == sequenceNo - 1);

        if (prevLineStation == null) return;

        var currentStation = await db.Stations.FindAsync(stationId);
        if (currentStation == null) return;

        var distance = Math.Round(Haversine(prevLineStation.Station.Latitude, prevLineStation.Station.Longitude,
            currentStation.Latitude, currentStation.Longitude), 2);

        // Estimate travel time: assume avg speed of 40 km/h
        var travelTime = (int)Math.Ceiling(distance / 40.0 * 60);

        // Check if connection already exists in either direction
        var exists = await db.StationConnections.AnyAsync(c =>
            (c.FromStationId == prevLineStation.StationId && c.ToStationId == stationId) ||
            (c.FromStationId == stationId && c.ToStationId == prevLineStation.StationId));

        if (!exists)
        {
            db.StationConnections.Add(new StationConnection
            {
                FromStationId = prevLineStation.StationId,
                ToStationId = stationId,
                DistanceKm = distance,
                TravelTimeMinutes = travelTime
            });
            await db.SaveChangesAsync();
        }
    }

    private static double Haversine(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.Pow(Math.Sin(dLat / 2), 2) +
                Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                Math.Pow(Math.Sin(dLon / 2), 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}

public class ConnectionService(AppDbContext db) : IConnectionService
{
    public async Task<List<StationConnectionDto>> GetAllAsync() =>
        await db.StationConnections.Include(c => c.FromStation).Include(c => c.ToStation)
            .Select(c => new StationConnectionDto(c.Id, c.FromStationId, c.FromStation.Name, c.ToStationId, c.ToStation.Name, c.DistanceKm, c.TravelTimeMinutes))
            .ToListAsync();

    public async Task<StationConnectionDto> CreateAsync(StationConnectionUpsertDto dto)
    {
        var c = new StationConnection { FromStationId = dto.FromStationId, ToStationId = dto.ToStationId, DistanceKm = dto.DistanceKm, TravelTimeMinutes = dto.TravelTimeMinutes };
        db.StationConnections.Add(c);
        await db.SaveChangesAsync();
        await db.Entry(c).Reference(x => x.FromStation).LoadAsync();
        await db.Entry(c).Reference(x => x.ToStation).LoadAsync();
        return new StationConnectionDto(c.Id, c.FromStationId, c.FromStation.Name, c.ToStationId, c.ToStation.Name, c.DistanceKm, c.TravelTimeMinutes);
    }

    public async Task<StationConnectionDto?> UpdateAsync(int id, StationConnectionUpsertDto dto)
    {
        var c = await db.StationConnections.Include(x => x.FromStation).Include(x => x.ToStation).FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return null;
        c.FromStationId = dto.FromStationId; c.ToStationId = dto.ToStationId;
        c.DistanceKm = dto.DistanceKm; c.TravelTimeMinutes = dto.TravelTimeMinutes;
        await db.SaveChangesAsync();
        return new StationConnectionDto(c.Id, c.FromStationId, c.FromStation.Name, c.ToStationId, c.ToStation.Name, c.DistanceKm, c.TravelTimeMinutes);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var c = await db.StationConnections.FindAsync(id);
        if (c == null) return false;
        db.StationConnections.Remove(c);
        await db.SaveChangesAsync();
        return true;
    }
}

public class InterchangeService(AppDbContext db) : IInterchangeService
{
    public async Task<List<InterchangeDto>> GetAllAsync() =>
        await db.Interchanges.Include(i => i.Station).Include(i => i.Line1).Include(i => i.Line2)
            .Select(i => new InterchangeDto(i.Id, i.StationId, i.Station.Name, i.Line1Id, i.Line1.Name, i.Line2Id, i.Line2.Name, i.TransferTimeMinutes))
            .ToListAsync();

    public async Task<InterchangeDto> CreateAsync(InterchangeUpsertDto dto)
    {
        var i = new Interchange { StationId = dto.StationId, Line1Id = dto.Line1Id, Line2Id = dto.Line2Id, TransferTimeMinutes = dto.TransferTimeMinutes };
        db.Interchanges.Add(i);
        await db.SaveChangesAsync();
        await db.Entry(i).Reference(x => x.Station).LoadAsync();
        await db.Entry(i).Reference(x => x.Line1).LoadAsync();
        await db.Entry(i).Reference(x => x.Line2).LoadAsync();
        return new InterchangeDto(i.Id, i.StationId, i.Station.Name, i.Line1Id, i.Line1.Name, i.Line2Id, i.Line2.Name, i.TransferTimeMinutes);
    }

    public async Task<InterchangeDto?> UpdateAsync(int id, InterchangeUpsertDto dto)
    {
        var i = await db.Interchanges.Include(x => x.Station).Include(x => x.Line1).Include(x => x.Line2).FirstOrDefaultAsync(x => x.Id == id);
        if (i == null) return null;
        i.StationId = dto.StationId; i.Line1Id = dto.Line1Id; i.Line2Id = dto.Line2Id; i.TransferTimeMinutes = dto.TransferTimeMinutes;
        await db.SaveChangesAsync();
        return new InterchangeDto(i.Id, i.StationId, i.Station.Name, i.Line1Id, i.Line1.Name, i.Line2Id, i.Line2.Name, i.TransferTimeMinutes);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var i = await db.Interchanges.FindAsync(id);
        if (i == null) return false;
        db.Interchanges.Remove(i);
        await db.SaveChangesAsync();
        return true;
    }
}
