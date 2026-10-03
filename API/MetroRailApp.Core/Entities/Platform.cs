namespace MetroRailApp.Core.Entities;

public class Platform
{
    public int Id { get; set; }
    public int StationId { get; set; }
    public int LineId { get; set; }
    public string PlatformNumber { get; set; } = string.Empty;
    public string TowardsDestination { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public Station Station { get; set; } = null!;
    public Line Line { get; set; } = null!;
}
