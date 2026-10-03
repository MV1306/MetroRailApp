namespace MetroRailApp.Core.Entities;

public class FareRule
{
    public int Id { get; set; }
    public double MinDistanceKm { get; set; }
    public double MaxDistanceKm { get; set; }
    public decimal Fare { get; set; }
}
