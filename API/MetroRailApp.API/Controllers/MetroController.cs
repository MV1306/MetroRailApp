using System.Security.Claims;
using MetroRailApp.Core.DTOs;
using MetroRailApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MetroRailApp.API.Controllers;

[ApiController]
[Route("api/metro")]
[EnableRateLimiting("api")]
public class MetroController(
    IStationService stationService,
    ILineService lineService,
    ILineStationService lineStationService,
    IRouteService routeService,
    IFareService fareService,
    IFavouriteRouteService favouriteRouteService,
    IRecentSearchService recentSearchService,
    ILiveTrainService liveTrainService) : ControllerBase
{
    [HttpGet("stations")]
    public async Task<IActionResult> GetStations([FromQuery] string? search) =>
        Ok(search != null ? await stationService.SearchAsync(search) : await stationService.GetAllAsync());

    [HttpGet("stations/{id}")]
    public async Task<IActionResult> GetStation(int id) => Ok(await stationService.GetDetailAsync(id));

    [HttpGet("lines")]
    public async Task<IActionResult> GetLines() => Ok(await lineService.GetAllAsync());

    [HttpGet("lines/{lineId}/stations")]
    public async Task<IActionResult> GetLineStations(int lineId) => Ok(await lineStationService.GetByLineAsync(lineId));

    [HttpPost("routes")]
    public async Task<IActionResult> FindRoutes(RouteRequestDto dto) => Ok(await routeService.FindRoutesAsync(dto));

    [HttpGet("fare")]
    public async Task<IActionResult> GetFare([FromQuery] int fromStationId, [FromQuery] int toStationId) =>
        Ok(await fareService.CalculateAsync(fromStationId, toStationId));

    [HttpGet("favourites")]
    [Authorize]
    public async Task<IActionResult> GetFavourites()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        return Ok(await favouriteRouteService.GetByUserAsync(userId));
    }

    [HttpPost("favourites")]
    [Authorize]
    public async Task<IActionResult> AddFavourite(FavouriteRouteUpsertDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        return Ok(await favouriteRouteService.CreateAsync(userId, dto));
    }

    [HttpDelete("favourites/{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteFavourite(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        return Ok(await favouriteRouteService.DeleteAsync(userId, id));
    }

    [HttpGet("live/stations/{stationId}")]
    public async Task<IActionResult> GetStationLive(int stationId, [FromQuery] int count = 5, [FromQuery] int? toStationId = null) =>
        Ok(await liveTrainService.GetNextDeparturesAsync(stationId, Math.Clamp(count, 1, 20), toStationId));

    [HttpGet("live/lines/{lineId}")]
    public async Task<IActionResult> GetLineLive(int lineId) =>
        Ok(await liveTrainService.GetActiveTrainsAsync(lineId));

    [HttpGet("recent-searches")]
    [Authorize]
    public async Task<IActionResult> GetRecentSearches()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        return Ok(await recentSearchService.GetByUserAsync(userId));
    }

    [HttpPost("recent-searches")]
    [Authorize]
    public async Task<IActionResult> SaveRecentSearch([FromBody] RecentSearchSaveDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        await recentSearchService.SaveAsync(userId, dto.FromStationId, dto.ToStationId);
        return Ok();
    }
}
