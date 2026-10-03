using MetroRailApp.Core.DTOs;
using MetroRailApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MetroRailApp.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController(
    ILineService lineService,
    IStationService stationService,
    ILineStationService lineStationService,
    IConnectionService connectionService,
    IInterchangeService interchangeService,
    IFareService fareService,
    IGateService gateService,
    IFeederService feederService,
    IDashboardService dashboardService,
    IPlatformService platformService,
    ITimetableService timetableService) : ControllerBase
{
    // Dashboard
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard() => Ok(await dashboardService.GetStatsAsync());

    // Lines
    [HttpGet("lines")] public async Task<IActionResult> GetLines() => Ok(await lineService.GetAllAsync());
    [HttpGet("lines/{id}")] public async Task<IActionResult> GetLine(int id) => Ok(await lineService.GetByIdAsync(id));
    [HttpPost("lines")] public async Task<IActionResult> CreateLine(LineUpsertDto dto) => Ok(await lineService.CreateAsync(dto));
    [HttpPut("lines/{id}")] public async Task<IActionResult> UpdateLine(int id, LineUpsertDto dto) => Ok(await lineService.UpdateAsync(id, dto));
    [HttpDelete("lines/{id}")] public async Task<IActionResult> DeleteLine(int id) => Ok(await lineService.DeleteAsync(id));

    // Stations
    [HttpGet("stations")] public async Task<IActionResult> GetStations() => Ok(await stationService.GetAllAsync());
    [HttpGet("stations/{id}")] public async Task<IActionResult> GetStation(int id) => Ok(await stationService.GetByIdAsync(id));
    [HttpPost("stations")] public async Task<IActionResult> CreateStation(StationUpsertDto dto) => Ok(await stationService.CreateAsync(dto));
    [HttpPut("stations/{id}")] public async Task<IActionResult> UpdateStation(int id, StationUpsertDto dto) => Ok(await stationService.UpdateAsync(id, dto));
    [HttpDelete("stations/{id}")] public async Task<IActionResult> DeleteStation(int id) => Ok(await stationService.DeleteAsync(id));

    // Line-Station Mapping
    [HttpGet("line-stations/{lineId}")] public async Task<IActionResult> GetLineStations(int lineId) => Ok(await lineStationService.GetByLineAsync(lineId));
    [HttpPost("line-stations")] public async Task<IActionResult> CreateLineStation(LineStationUpsertDto dto) => Ok(await lineStationService.CreateAsync(dto));
    [HttpPut("line-stations/{id}")] public async Task<IActionResult> UpdateLineStation(int id, LineStationUpsertDto dto) => Ok(await lineStationService.UpdateAsync(id, dto));
    [HttpDelete("line-stations/{id}")] public async Task<IActionResult> DeleteLineStation(int id) => Ok(await lineStationService.DeleteAsync(id));

    // Connections
    [HttpGet("connections")] public async Task<IActionResult> GetConnections() => Ok(await connectionService.GetAllAsync());
    [HttpPost("connections")] public async Task<IActionResult> CreateConnection(StationConnectionUpsertDto dto) => Ok(await connectionService.CreateAsync(dto));
    [HttpPut("connections/{id}")] public async Task<IActionResult> UpdateConnection(int id, StationConnectionUpsertDto dto) => Ok(await connectionService.UpdateAsync(id, dto));
    [HttpDelete("connections/{id}")] public async Task<IActionResult> DeleteConnection(int id) => Ok(await connectionService.DeleteAsync(id));

    // Interchanges
    [HttpGet("interchanges")] public async Task<IActionResult> GetInterchanges() => Ok(await interchangeService.GetAllAsync());
    [HttpPost("interchanges")] public async Task<IActionResult> CreateInterchange(InterchangeUpsertDto dto) => Ok(await interchangeService.CreateAsync(dto));
    [HttpPut("interchanges/{id}")] public async Task<IActionResult> UpdateInterchange(int id, InterchangeUpsertDto dto) => Ok(await interchangeService.UpdateAsync(id, dto));
    [HttpDelete("interchanges/{id}")] public async Task<IActionResult> DeleteInterchange(int id) => Ok(await interchangeService.DeleteAsync(id));

    // Fares
    [HttpGet("fares")] public async Task<IActionResult> GetFares() => Ok(await fareService.GetAllAsync());
    [HttpPost("fares")] public async Task<IActionResult> CreateFare(FareRuleUpsertDto dto) => Ok(await fareService.CreateAsync(dto));
    [HttpPut("fares/{id}")] public async Task<IActionResult> UpdateFare(int id, FareRuleUpsertDto dto) => Ok(await fareService.UpdateAsync(id, dto));
    [HttpDelete("fares/{id}")] public async Task<IActionResult> DeleteFare(int id) => Ok(await fareService.DeleteAsync(id));

    // Gates
    [HttpGet("gates/{stationId}")] public async Task<IActionResult> GetGates(int stationId) => Ok(await gateService.GetByStationAsync(stationId));
    [HttpPost("gates")] public async Task<IActionResult> CreateGate(StationGateUpsertDto dto) => Ok(await gateService.CreateAsync(dto));
    [HttpPut("gates/{id}")] public async Task<IActionResult> UpdateGate(int id, StationGateUpsertDto dto) => Ok(await gateService.UpdateAsync(id, dto));
    [HttpDelete("gates/{id}")] public async Task<IActionResult> DeleteGate(int id) => Ok(await gateService.DeleteAsync(id));

    // Feeder Services
    [HttpGet("feeders/{stationId}")] public async Task<IActionResult> GetFeeders(int stationId) => Ok(await feederService.GetByStationAsync(stationId));
    [HttpPost("feeders")] public async Task<IActionResult> CreateFeeder(FeederServiceUpsertDto dto) => Ok(await feederService.CreateAsync(dto));
    [HttpDelete("feeders/{id}")] public async Task<IActionResult> DeleteFeeder(int id) => Ok(await feederService.DeleteAsync(id));

    // Platforms
    [HttpGet("platforms/{stationId}")] public async Task<IActionResult> GetPlatforms(int stationId) => Ok(await platformService.GetByStationAsync(stationId));
    [HttpPost("platforms")] public async Task<IActionResult> CreatePlatform(PlatformUpsertDto dto) => Ok(await platformService.CreateAsync(dto));
    [HttpPut("platforms/{id}")] public async Task<IActionResult> UpdatePlatform(int id, PlatformUpsertDto dto) => Ok(await platformService.UpdateAsync(id, dto));
    [HttpDelete("platforms/{id}")] public async Task<IActionResult> DeletePlatform(int id) => Ok(await platformService.DeleteAsync(id));

    // Timetables
    [HttpGet("timetables")] public async Task<IActionResult> GetTimetables() => Ok(await timetableService.GetAllAsync());
    [HttpGet("timetables/line/{lineId}")] public async Task<IActionResult> GetTimetablesByLine(int lineId) => Ok(await timetableService.GetByLineAsync(lineId));
    [HttpPost("timetables")] public async Task<IActionResult> CreateTimetable(LineTimetableUpsertDto dto) => Ok(await timetableService.CreateAsync(dto));
    [HttpPut("timetables/{id}")] public async Task<IActionResult> UpdateTimetable(int id, LineTimetableUpsertDto dto) => Ok(await timetableService.UpdateAsync(id, dto));
    [HttpDelete("timetables/{id}")] public async Task<IActionResult> DeleteTimetable(int id) => Ok(await timetableService.DeleteAsync(id));
}
