namespace MetroRailApp.Core.Entities;

public class RecentSearch
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;
    public int FromStationId { get; set; }
    public Station FromStation { get; set; } = null!;
    public int ToStationId { get; set; }
    public Station ToStation { get; set; } = null!;
    public DateTime SearchedAt { get; set; } = DateTime.UtcNow;
}
