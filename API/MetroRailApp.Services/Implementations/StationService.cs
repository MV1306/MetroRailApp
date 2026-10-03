using MetroRailApp.Core.DTOs;
using MetroRailApp.Core.Entities;
using MetroRailApp.Core.Interfaces;
using MetroRailApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MetroRailApp.Services.Implementations;

public class StationService(AppDbContext db) : IStationService
{
    private static StationDto ToDto(Station s) => new(
        s.Id, s.Name, s.Code, s.Latitude, s.Longitude, s.Address, s.IsActive,
        s.HasParking, s.HasLift, s.HasEscalator, s.HasToilet, s.IsAccessible,
        s.NearbyLandmarks, s.OpeningDate);

    public async Task<List<StationDto>> GetAllAsync() =>
        await db.Stations.Select(s => ToDto(s)).ToListAsync();

    public async Task<StationDto?> GetByIdAsync(int id) =>
        await db.Stations.Where(s => s.Id == id).Select(s => ToDto(s)).FirstOrDefaultAsync();

    public async Task<StationDetailDto?> GetDetailAsync(int id)
    {
        var station = await db.Stations
            .Include(s => s.LineStations).ThenInclude(ls => ls.Line)
            .Include(s => s.Gates)
            .Include(s => s.FeederServices)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (station == null) return null;

        var lines = station.LineStations.Select(ls => new LineDto(ls.Line.Id, ls.Line.Code, ls.Line.Name, ls.Line.Color, ls.Line.IsActive)).ToList();
        var gates = station.Gates.Select(g => new StationGateDto(g.Id, g.StationId, g.GateNumber, g.Latitude, g.Longitude, g.Description, g.Accessibles)).ToList();
        var feeders = station.FeederServices.Select(f => new FeederServiceDto(f.Id, f.StationId, f.Type, f.Description)).ToList();
        return new StationDetailDto(ToDto(station), lines, gates, feeders);
    }

    public async Task<List<StationDto>> SearchAsync(string query) =>
        await db.Stations.Where(s => s.Name.Contains(query) || s.Code.Contains(query))
            .Select(s => ToDto(s)).ToListAsync();

    public async Task<StationDto> CreateAsync(StationUpsertDto dto)
    {
        var s = new Station
        {
            Name = dto.Name, Code = dto.Code, Latitude = dto.Latitude, Longitude = dto.Longitude,
            Address = dto.Address, IsActive = dto.IsActive, HasParking = dto.HasParking,
            HasLift = dto.HasLift, HasEscalator = dto.HasEscalator, HasToilet = dto.HasToilet,
            IsAccessible = dto.IsAccessible, NearbyLandmarks = dto.NearbyLandmarks, OpeningDate = dto.OpeningDate
        };
        db.Stations.Add(s);
        await db.SaveChangesAsync();
        return ToDto(s);
    }

    public async Task<StationDto?> UpdateAsync(int id, StationUpsertDto dto)
    {
        var s = await db.Stations.FindAsync(id);
        if (s == null) return null;
        s.Name = dto.Name; s.Code = dto.Code; s.Latitude = dto.Latitude; s.Longitude = dto.Longitude;
        s.Address = dto.Address; s.IsActive = dto.IsActive; s.HasParking = dto.HasParking;
        s.HasLift = dto.HasLift; s.HasEscalator = dto.HasEscalator; s.HasToilet = dto.HasToilet;
        s.IsAccessible = dto.IsAccessible; s.NearbyLandmarks = dto.NearbyLandmarks; s.OpeningDate = dto.OpeningDate;
        await db.SaveChangesAsync();
        return ToDto(s);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var s = await db.Stations.FindAsync(id);
        if (s == null) return false;
        db.Stations.Remove(s);
        await db.SaveChangesAsync();
        return true;
    }
}
