namespace MetroRailApp.Core.Entities;

public class StationGate
{
    public int Id { get; set; }
    public int StationId { get; set; }
    public string GateNumber { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? Description { get; set; }
    public List<string> Accessibles { get; set; } = [];
    public Station Station { get; set; } = null!;
}
