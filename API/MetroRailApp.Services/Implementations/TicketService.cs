using MetroRailApp.Core.DTOs;
using MetroRailApp.Core.Entities;
using MetroRailApp.Core.Interfaces;
using MetroRailApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MetroRailApp.Services.Implementations;

public class TicketService(AppDbContext db, IFareService fareService) : ITicketService
{
    public async Task<TicketDto> BookAsync(string userId, BookTicketDto dto)
    {
        var fareResult = await fareService.CalculateAsync(dto.FromStationId, dto.ToStationId);
        var now = DateTime.UtcNow;

        var ticket = new Ticket
        {
            UserId = userId,
            FromStationId = dto.FromStationId,
            ToStationId = dto.ToStationId,
            Fare = fareResult.Fare,
            DistanceKm = fareResult.DistanceKm,
            Passengers = dto.Passengers,
            PurchasedAt = now,
            ValidUntil = now.AddHours(2),
            Status = TicketStatus.Active,
        };

        db.Tickets.Add(ticket);
        await db.SaveChangesAsync();

        await db.Entry(ticket).Reference(t => t.FromStation).LoadAsync();
        await db.Entry(ticket).Reference(t => t.ToStation).LoadAsync();

        return ToDto(ticket);
    }

    public async Task<List<TicketDto>> GetMyTicketsAsync(string userId)
    {
        var now = DateTime.UtcNow;

        // expire stale active tickets before returning
        var stale = await db.Tickets
            .Where(t => t.UserId == userId && t.Status == TicketStatus.Active && t.ValidUntil < now)
            .ToListAsync();

        foreach (var t in stale) t.Status = TicketStatus.Expired;
        if (stale.Count > 0) await db.SaveChangesAsync();

        return await db.Tickets
            .Include(t => t.FromStation)
            .Include(t => t.ToStation)
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.PurchasedAt)
            .Select(t => ToDto(t))
            .ToListAsync();
    }

    public async Task<TicketDto?> GetByRefAsync(string ticketRef)
    {
        var ticket = await db.Tickets
            .Include(t => t.FromStation)
            .Include(t => t.ToStation)
            .FirstOrDefaultAsync(t => t.TicketRef == ticketRef);
        return ticket is null ? null : ToDto(ticket);
    }

    public async Task<TicketDto> ValidateAsync(string ticketRef)
    {
        var ticket = await db.Tickets
            .Include(t => t.FromStation)
            .Include(t => t.ToStation)
            .FirstOrDefaultAsync(t => t.TicketRef == ticketRef)
            ?? throw new KeyNotFoundException("Ticket not found.");

        if (ticket.Status == TicketStatus.Used)
            throw new InvalidOperationException("Ticket has already been used.");

        if (ticket.Status == TicketStatus.Expired || ticket.ValidUntil < DateTime.UtcNow)
        {
            ticket.Status = TicketStatus.Expired;
            await db.SaveChangesAsync();
            throw new InvalidOperationException("Ticket has expired.");
        }

        ticket.Status = TicketStatus.Used;
        await db.SaveChangesAsync();
        return ToDto(ticket);
    }

    private static TicketDto ToDto(Ticket t) => new(
        t.Id, t.TicketRef,
        t.FromStation.Name, t.ToStation.Name,
        t.Fare, t.DistanceKm, t.Passengers, t.Fare * t.Passengers,
        DateTime.SpecifyKind(t.PurchasedAt, DateTimeKind.Utc),
        DateTime.SpecifyKind(t.ValidUntil, DateTimeKind.Utc),
        t.Status.ToString());
}
