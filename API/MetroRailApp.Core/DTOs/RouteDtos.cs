namespace MetroRailApp.Core.DTOs;

public record RouteRequestDto(int FromStationId, int ToStationId);

public record RouteOptionDto(
    string Label,
    List<RouteStepDto> Steps,
    double TotalDistanceKm,
    int TotalTimeMinutes,
    int Interchanges,
    decimal Fare);

public record RouteStepDto(
    int StationId,
    string StationName,
    string LineName,
    string LineColor,
    double? DistanceFromPrevKm,
    int? TimeFromPrevMinutes);

public record FareResponseDto(double DistanceKm, decimal Fare);

public record DashboardStatsDto(
    int TotalLines,
    int TotalStations,
    int TotalConnections,
    int TotalInterchanges,
    int ActiveStations,
    int TotalFareRules);

public record StationDetailDto(
    StationDto Station,
    List<LineDto> Lines,
    List<StationGateDto> Gates,
    List<FeederServiceDto> FeederServices);
