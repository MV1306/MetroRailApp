using System.ComponentModel.DataAnnotations;

namespace MetroRailApp.Core.DTOs;

public record LineDto(int Id, string Code, string Name, string Color, bool IsActive);
public record LineUpsertDto(
    [Required, MaxLength(20)] string Code,
    [Required, MaxLength(100)] string Name,
    [Required, RegularExpression("^#[0-9a-fA-F]{6}$", ErrorMessage = "Color must be a valid hex color")] string Color,
    bool IsActive);

public record StationDto(
    int Id, string Name, string Code, double Latitude, double Longitude,
    string? Address, bool IsActive, bool HasParking, bool HasLift,
    bool HasEscalator, bool HasToilet, bool IsAccessible, string? NearbyLandmarks,
    DateTime? OpeningDate);

public record StationUpsertDto(
    [Required, MaxLength(200)] string Name,
    [Required, MaxLength(20)] string Code,
    [Range(-90, 90)] double Latitude,
    [Range(-180, 180)] double Longitude,
    [MaxLength(500)] string? Address,
    bool IsActive, bool HasParking, bool HasLift,
    bool HasEscalator, bool HasToilet, bool IsAccessible,
    [MaxLength(500)] string? NearbyLandmarks,
    DateTime? OpeningDate);

public record LineStationDto(int Id, int LineId, string LineName, int StationId, string StationName, int SequenceNo);
public record LineStationUpsertDto(
    [Range(1, int.MaxValue)] int LineId,
    [Range(1, int.MaxValue)] int StationId,
    [Range(1, 999)] int SequenceNo);

public record StationConnectionDto(int Id, int FromStationId, string FromStationName, int ToStationId, string ToStationName, double DistanceKm, int TravelTimeMinutes);
public record StationConnectionUpsertDto(
    [Range(1, int.MaxValue)] int FromStationId,
    [Range(1, int.MaxValue)] int ToStationId,
    [Range(0.01, 200)] double DistanceKm,
    [Range(1, 300)] int TravelTimeMinutes);

public record InterchangeDto(int Id, int StationId, string StationName, int Line1Id, string Line1Name, int Line2Id, string Line2Name, int TransferTimeMinutes);
public record InterchangeUpsertDto(
    [Range(1, int.MaxValue)] int StationId,
    [Range(1, int.MaxValue)] int Line1Id,
    [Range(1, int.MaxValue)] int Line2Id,
    [Range(1, 60)] int TransferTimeMinutes);

public record FareRuleDto(int Id, double MinDistanceKm, double MaxDistanceKm, decimal Fare);
public record FareRuleUpsertDto(
    [Range(0, 500)] double MinDistanceKm,
    [Range(0.01, 500)] double MaxDistanceKm,
    [Range(1, 10000)] decimal Fare);

public record StationGateDto(int Id, int StationId, string GateNumber, double Latitude, double Longitude, string? Description, List<string> Accessibles);
public record StationGateUpsertDto(
    [Range(1, int.MaxValue)] int StationId,
    [Required, MaxLength(20)] string GateNumber,
    [Range(-90, 90)] double Latitude,
    [Range(-180, 180)] double Longitude,
    [MaxLength(500)] string? Description,
    List<string> Accessibles);

public record FeederServiceDto(int Id, int StationId, string Type, string Description);
public record FeederServiceUpsertDto(
    [Range(1, int.MaxValue)] int StationId,
    [Required, MaxLength(50)] string Type,
    [Required, MaxLength(500)] string Description);

public record FavouriteRouteDto(int Id, string Label, int FromStationId, string FromStationName, int ToStationId, string ToStationName);
public record FavouriteRouteUpsertDto(
    [Required, MaxLength(100)] string Label,
    [Range(1, int.MaxValue)] int FromStationId,
    [Range(1, int.MaxValue)] int ToStationId);

public record RecentSearchDto(int FromStationId, string FromStationName, int ToStationId, string ToStationName, DateTime SearchedAt);
public record RecentSearchSaveDto([Range(1, int.MaxValue)] int FromStationId, [Range(1, int.MaxValue)] int ToStationId);

public record PlatformDto(int Id, int StationId, string StationName, int LineId, string LineName, string LineColor, string PlatformNumber, string TowardsDestination, bool IsActive);
public record PlatformUpsertDto(
    [Range(1, int.MaxValue)] int StationId,
    [Range(1, int.MaxValue)] int LineId,
    [Required, MaxLength(20)] string PlatformNumber,
    [Required, MaxLength(200)] string TowardsDestination,
    bool IsActive);

public record PeakWindowDto(
    [Required, RegularExpression(@"^\d{2}:\d{2}$")] string Start,
    [Required, RegularExpression(@"^\d{2}:\d{2}$")] string End);

public record LineTimetableDto(
    int Id, int LineId, string LineName, string LineColor,
    string Direction, string DayType,
    string FirstDeparture, string LastDeparture,
    List<PeakWindowDto> PeakWindows,
    int PeakFrequencyMinutes, int OffPeakFrequencyMinutes);

public record LineTimetableUpsertDto(
    [Range(1, int.MaxValue)] int LineId,
    [Required] string Direction,
    [Required] string DayType,
    [Required, RegularExpression(@"^\d{2}:\d{2}$")] string FirstDeparture,
    [Required, RegularExpression(@"^\d{2}:\d{2}$")] string LastDeparture,
    [Required, MinLength(1)] List<PeakWindowDto> PeakWindows,
    [Range(1, 60)] int PeakFrequencyMinutes,
    [Range(1, 60)] int OffPeakFrequencyMinutes);

public record NextDepartureDto(
    string LineName, string LineColor, string Direction,
    string TowardsTerminal, int DepartureInMinutes, string DepartureTime,
    string PlatformNumber);

public record LiveTrainDto(
    int RunId, string LineName, string LineColor, string Direction,
    string TowardsTerminal, int CurrentStationId, string CurrentStationName,
    int? NextStationId, string? NextStationName,
    int ProgressPercent, string DepartureFromTerminal);

public record StationLiveDto(int StationId, string StationName, List<NextDepartureDto> NextDepartures);
public record LineLiveDto(string LineName, string LineColor, List<LiveTrainDto> ActiveTrains);

public record BookTicketDto(
    [Range(1, int.MaxValue)] int FromStationId,
    [Range(1, int.MaxValue)] int ToStationId,
    [Range(1, 6)] int Passengers = 1);

public record TicketDto(
    int Id, string TicketRef, string FromStationName, string ToStationName,
    decimal Fare, double DistanceKm, int Passengers, decimal TotalFare,
    DateTime PurchasedAt, DateTime ValidUntil, string Status);

public record JourneyStatsDto(
    int TotalTrips,
    double TotalDistanceKm,
    decimal TotalSpent,
    int ActiveTickets,
    string? MostVisitedStation);
