namespace MetroRailApp.Core.Entities;

public class Station
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? Address { get; set; }
    public DateTime? OpeningDate { get; set; }
    public bool IsActive { get; set; } = true;

    // Facilities
    public bool HasParking { get; set; }
    public bool HasLift { get; set; }
    public bool HasEscalator { get; set; }
    public bool HasToilet { get; set; }
    public bool IsAccessible { get; set; }
    public string? NearbyLandmarks { get; set; }

    public ICollection<LineStation> LineStations { get; set; } = [];
    public ICollection<StationConnection> ConnectionsFrom { get; set; } = [];
    public ICollection<StationConnection> ConnectionsTo { get; set; } = [];
    public ICollection<StationGate> Gates { get; set; } = [];
    public ICollection<FeederService> FeederServices { get; set; } = [];
}
