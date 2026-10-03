namespace MetroRailApp.Core.Entities;

public enum DayType { Weekday, Weekend }
public enum TrainDirection { Forward, Backward }

public class PeakWindow
{
    public string Start { get; set; } = string.Empty;
    public string End { get; set; } = string.Empty;
}

public class LineTimetable
{
    public int Id { get; set; }
    public int LineId { get; set; }
    public TrainDirection Direction { get; set; }
    public DayType DayType { get; set; }

    public string FirstDeparture { get; set; } = string.Empty;
    public string LastDeparture { get; set; } = string.Empty;

    // multiple peak windows stored as JSON, e.g. [{Start:"08:00",End:"11:00"},{Start:"17:00",End:"20:00"}]
    public List<PeakWindow> PeakWindows { get; set; } = [];

    public int PeakFrequencyMinutes { get; set; }
    public int OffPeakFrequencyMinutes { get; set; }

    public Line Line { get; set; } = null!;
}
