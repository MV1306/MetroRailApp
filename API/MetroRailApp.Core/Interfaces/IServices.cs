using MetroRailApp.Core.DTOs;

namespace MetroRailApp.Core.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto?> RegisterAsync(RegisterDto dto, string role = "User");
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
}

public interface ILineService
{
    Task<List<LineDto>> GetAllAsync();
    Task<LineDto?> GetByIdAsync(int id);
    Task<LineDto> CreateAsync(LineUpsertDto dto);
    Task<LineDto?> UpdateAsync(int id, LineUpsertDto dto);
    Task<bool> DeleteAsync(int id);
}

public interface IStationService
{
    Task<List<StationDto>> GetAllAsync();
    Task<StationDto?> GetByIdAsync(int id);
    Task<StationDetailDto?> GetDetailAsync(int id);
    Task<List<StationDto>> SearchAsync(string query);
    Task<StationDto> CreateAsync(StationUpsertDto dto);
    Task<StationDto?> UpdateAsync(int id, StationUpsertDto dto);
    Task<bool> DeleteAsync(int id);
}

public interface ILineStationService
{
    Task<List<LineStationDto>> GetByLineAsync(int lineId);
    Task<LineStationDto> CreateAsync(LineStationUpsertDto dto);
    Task<LineStationDto?> UpdateAsync(int id, LineStationUpsertDto dto);
    Task<bool> DeleteAsync(int id);
}

public interface IConnectionService
{
    Task<List<StationConnectionDto>> GetAllAsync();
    Task<StationConnectionDto> CreateAsync(StationConnectionUpsertDto dto);
    Task<StationConnectionDto?> UpdateAsync(int id, StationConnectionUpsertDto dto);
    Task<bool> DeleteAsync(int id);
}

public interface IInterchangeService
{
    Task<List<InterchangeDto>> GetAllAsync();
    Task<InterchangeDto> CreateAsync(InterchangeUpsertDto dto);
    Task<InterchangeDto?> UpdateAsync(int id, InterchangeUpsertDto dto);
    Task<bool> DeleteAsync(int id);
}

public interface IFareService
{
    Task<List<FareRuleDto>> GetAllAsync();
    Task<FareRuleDto> CreateAsync(FareRuleUpsertDto dto);
    Task<FareRuleDto?> UpdateAsync(int id, FareRuleUpsertDto dto);
    Task<bool> DeleteAsync(int id);
    Task<FareResponseDto> CalculateAsync(int fromStationId, int toStationId);
}

public interface IGateService
{
    Task<List<StationGateDto>> GetByStationAsync(int stationId);
    Task<StationGateDto> CreateAsync(StationGateUpsertDto dto);
    Task<StationGateDto?> UpdateAsync(int id, StationGateUpsertDto dto);
    Task<bool> DeleteAsync(int id);
}

public interface IFeederService
{
    Task<List<FeederServiceDto>> GetByStationAsync(int stationId);
    Task<FeederServiceDto> CreateAsync(FeederServiceUpsertDto dto);
    Task<bool> DeleteAsync(int id);
}

public interface IRouteService
{
    Task<List<RouteOptionDto>> FindRoutesAsync(RouteRequestDto request);
}

public interface IFavouriteRouteService
{
    Task<List<FavouriteRouteDto>> GetByUserAsync(string userId);
    Task<FavouriteRouteDto> CreateAsync(string userId, FavouriteRouteUpsertDto dto);
    Task<bool> DeleteAsync(string userId, int id);
}

public interface IRecentSearchService
{
    Task<List<RecentSearchDto>> GetByUserAsync(string userId);
    Task SaveAsync(string userId, int fromStationId, int toStationId);
}

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync();
}

public interface IPlatformService
{
    Task<List<PlatformDto>> GetByStationAsync(int stationId);
    Task<PlatformDto> CreateAsync(PlatformUpsertDto dto);
    Task<PlatformDto?> UpdateAsync(int id, PlatformUpsertDto dto);
    Task<bool> DeleteAsync(int id);
}

public interface ITimetableService
{
    Task<List<LineTimetableDto>> GetAllAsync();
    Task<List<LineTimetableDto>> GetByLineAsync(int lineId);
    Task<LineTimetableDto> CreateAsync(LineTimetableUpsertDto dto);
    Task<LineTimetableDto?> UpdateAsync(int id, LineTimetableUpsertDto dto);
    Task<bool> DeleteAsync(int id);
}

public interface ILiveTrainService
{
    Task<StationLiveDto> GetNextDeparturesAsync(int stationId, int count = 5, int? toStationId = null);
    Task<LineLiveDto> GetActiveTrainsAsync(int lineId);
}

public interface ITicketService
{
    Task<TicketDto> BookAsync(string userId, BookTicketDto dto);
    Task<List<TicketDto>> GetMyTicketsAsync(string userId);
    Task<TicketDto?> GetByRefAsync(string ticketRef);
    Task<TicketDto> ValidateAsync(string ticketRef);
}
