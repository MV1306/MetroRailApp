namespace MetroRailApp.Core.Entities;

public class Line
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<LineStation> LineStations { get; set; } = [];
    public ICollection<Interchange> Interchanges { get; set; } = [];
}
