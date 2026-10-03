namespace MetroRailApp.Core.Entities;

public enum TicketStatus { Active, Used, Expired }

public class Ticket
{
    public int Id { get; set; }
    public string TicketRef { get; set; } = Guid.NewGuid().ToString("N").ToUpper()[..10];
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;
    public int FromStationId { get; set; }
    public Station FromStation { get; set; } = null!;
    public int ToStationId { get; set; }
    public Station ToStation { get; set; } = null!;
    public decimal Fare { get; set; }
    public double DistanceKm { get; set; }
    public DateTime PurchasedAt { get; set; } = DateTime.UtcNow;
    public DateTime ValidUntil { get; set; }
    public int Passengers { get; set; } = 1;
    public TicketStatus Status { get; set; } = TicketStatus.Active;
}
