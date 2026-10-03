using MetroRailApp.Core.DTOs;
using MetroRailApp.Core.Interfaces;
using MetroRailApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MetroRailApp.Services.Implementations;

public class LineService(AppDbContext db) : ILineService
{
    public async Task<List<LineDto>> GetAllAsync() =>
        await db.Lines.Select(l => new LineDto(l.Id, l.Code, l.Name, l.Color, l.IsActive)).ToListAsync();

    public async Task<LineDto?> GetByIdAsync(int id) =>
        await db.Lines.Where(l => l.Id == id).Select(l => new LineDto(l.Id, l.Code, l.Name, l.Color, l.IsActive)).FirstOrDefaultAsync();

    public async Task<LineDto> CreateAsync(LineUpsertDto dto)
    {
        var line = new Core.Entities.Line { Code = dto.Code, Name = dto.Name, Color = dto.Color, IsActive = dto.IsActive };
        db.Lines.Add(line);
        await db.SaveChangesAsync();
        return new LineDto(line.Id, line.Code, line.Name, line.Color, line.IsActive);
    }

    public async Task<LineDto?> UpdateAsync(int id, LineUpsertDto dto)
    {
        var line = await db.Lines.FindAsync(id);
        if (line == null) return null;
        line.Code = dto.Code; line.Name = dto.Name; line.Color = dto.Color; line.IsActive = dto.IsActive;
        await db.SaveChangesAsync();
        return new LineDto(line.Id, line.Code, line.Name, line.Color, line.IsActive);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var line = await db.Lines.FindAsync(id);
        if (line == null) return false;
        db.Lines.Remove(line);
        await db.SaveChangesAsync();
        return true;
    }
}
