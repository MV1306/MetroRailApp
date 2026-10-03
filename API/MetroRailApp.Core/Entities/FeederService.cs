namespace MetroRailApp.Core.Entities;

public class FeederService
{
    public int Id { get; set; }
    public int StationId { get; set; }
    public string Type { get; set; } = string.Empty; // Bus, Auto, Taxi, Parking
    public string Description { get; set; } = string.Empty;
    public Station Station { get; set; } = null!;
}
