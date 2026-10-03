namespace MetroRailApp.Core.Entities;

public class LineStation
{
    public int Id { get; set; }
    public int LineId { get; set; }
    public int StationId { get; set; }
    public int SequenceNo { get; set; }
    public Line Line { get; set; } = null!;
    public Station Station { get; set; } = null!;
}
