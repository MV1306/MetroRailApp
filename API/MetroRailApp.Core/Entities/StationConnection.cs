namespace MetroRailApp.Core.Entities;

public class StationConnection
{
    public int Id { get; set; }
    public int FromStationId { get; set; }
    public int ToStationId { get; set; }
    public double DistanceKm { get; set; }
    public int TravelTimeMinutes { get; set; }
    public Station FromStation { get; set; } = null!;
    public Station ToStation { get; set; } = null!;
}
