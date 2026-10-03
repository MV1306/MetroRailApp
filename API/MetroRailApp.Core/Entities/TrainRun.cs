namespace MetroRailApp.Core.Entities;

public class TrainRun
{
    public int Id { get; set; }
    public int LineId { get; set; }
    public TrainDirection Direction { get; set; }
    public DateTime DepartureFromTerminal { get; set; }
    public Line Line { get; set; } = null!;
}
