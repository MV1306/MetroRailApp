namespace MetroRailApp.Core.Entities;

public class Interchange
{
    public int Id { get; set; }
    public int StationId { get; set; }
    public int Line1Id { get; set; }
    public int Line2Id { get; set; }
    public int TransferTimeMinutes { get; set; }
    public Station Station { get; set; } = null!;
    public Line Line1 { get; set; } = null!;
    public Line Line2 { get; set; } = null!;
}
