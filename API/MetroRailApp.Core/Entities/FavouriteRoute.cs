namespace MetroRailApp.Core.Entities;

public class FavouriteRoute
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int FromStationId { get; set; }
    public int ToStationId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public AppUser User { get; set; } = null!;
    public Station FromStation { get; set; } = null!;
    public Station ToStation { get; set; } = null!;
}
