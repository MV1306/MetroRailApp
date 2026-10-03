using MetroRailApp.Core.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace MetroRailApp.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<AppUser>(options)
{
    public DbSet<Line> Lines => Set<Line>();
    public DbSet<Station> Stations => Set<Station>();
    public DbSet<LineStation> LineStations => Set<LineStation>();
    public DbSet<StationConnection> StationConnections => Set<StationConnection>();
    public DbSet<Interchange> Interchanges => Set<Interchange>();
    public DbSet<FareRule> FareRules => Set<FareRule>();
    public DbSet<StationGate> StationGates => Set<StationGate>();
    public DbSet<FeederService> FeederServices => Set<FeederService>();
    public DbSet<FavouriteRoute> FavouriteRoutes => Set<FavouriteRoute>();
    public DbSet<Platform> Platforms => Set<Platform>();
    public DbSet<LineTimetable> LineTimetables => Set<LineTimetable>();
    public DbSet<TrainRun> TrainRuns => Set<TrainRun>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<RecentSearch> RecentSearches => Set<RecentSearch>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<StationConnection>()
            .HasOne(c => c.FromStation)
            .WithMany(s => s.ConnectionsFrom)
            .HasForeignKey(c => c.FromStationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<StationConnection>()
            .HasOne(c => c.ToStation)
            .WithMany(s => s.ConnectionsTo)
            .HasForeignKey(c => c.ToStationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Interchange>()
            .HasOne(i => i.Line1)
            .WithMany()
            .HasForeignKey(i => i.Line1Id)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Interchange>()
            .HasOne(i => i.Line2)
            .WithMany()
            .HasForeignKey(i => i.Line2Id)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<FavouriteRoute>()
            .HasOne(f => f.FromStation)
            .WithMany()
            .HasForeignKey(f => f.FromStationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<FavouriteRoute>()
            .HasOne(f => f.ToStation)
            .WithMany()
            .HasForeignKey(f => f.ToStationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<FareRule>()
            .Property(f => f.Fare)
            .HasColumnType("decimal(10,2)");

        builder.Entity<Ticket>()
            .Property(t => t.Fare)
            .HasColumnType("decimal(10,2)");

        builder.Entity<Ticket>()
            .HasOne(t => t.FromStation)
            .WithMany()
            .HasForeignKey(t => t.FromStationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Ticket>()
            .HasOne(t => t.ToStation)
            .WithMany()
            .HasForeignKey(t => t.ToStationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<RecentSearch>()
            .HasOne(r => r.FromStation)
            .WithMany()
            .HasForeignKey(r => r.FromStationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<RecentSearch>()
            .HasOne(r => r.ToStation)
            .WithMany()
            .HasForeignKey(r => r.ToStationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<StationGate>()
            .Property(g => g.Accessibles)
            .HasColumnType("nvarchar(max)")
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => string.IsNullOrWhiteSpace(v) ? new List<string>() : System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>())
            .Metadata.SetValueComparer(new Microsoft.EntityFrameworkCore.ChangeTracking.ValueComparer<List<string>>(
                (a, b) => a != null && b != null && a.SequenceEqual(b),
                v => v.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
                v => v.ToList()));

        builder.Entity<LineTimetable>()
            .Property(t => t.PeakWindows)
            .HasColumnType("nvarchar(max)")
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => string.IsNullOrWhiteSpace(v) ? new List<MetroRailApp.Core.Entities.PeakWindow>() : System.Text.Json.JsonSerializer.Deserialize<List<MetroRailApp.Core.Entities.PeakWindow>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<MetroRailApp.Core.Entities.PeakWindow>())
            .Metadata.SetValueComparer(new Microsoft.EntityFrameworkCore.ChangeTracking.ValueComparer<List<MetroRailApp.Core.Entities.PeakWindow>>(
                (a, b) => a != null && b != null && a.Count == b.Count,
                v => v.Count,
                v => v.ToList()));
    }
}
