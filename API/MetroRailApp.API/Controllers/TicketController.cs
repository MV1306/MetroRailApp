using System.Security.Claims;
using MetroRailApp.Core.DTOs;
using MetroRailApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MetroRailApp.API.Controllers;

[ApiController]
[Route("api/tickets")]
[Authorize]
[EnableRateLimiting("api")]
public class TicketController(ITicketService ticketService) : ControllerBase
{
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpPost]
    public async Task<IActionResult> Book(BookTicketDto dto)
    {
        try { return Ok(await ticketService.BookAsync(UserId, dto)); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet]
    public async Task<IActionResult> GetMyTickets() =>
        Ok(await ticketService.GetMyTicketsAsync(UserId));

    [HttpGet("{ticketRef}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetByRef(string ticketRef)
    {
        var ticket = await ticketService.GetByRefAsync(ticketRef);
        return ticket is null ? NotFound(new { error = "Ticket not found." }) : Ok(ticket);
    }

    [HttpPost("{ticketRef}/validate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Validate(string ticketRef)
    {
        try { return Ok(await ticketService.ValidateAsync(ticketRef)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }
}
