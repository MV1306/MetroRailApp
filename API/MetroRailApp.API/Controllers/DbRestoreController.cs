using MetroRailApp.Core.Entities;
using MetroRailApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MetroRailApp.API.Controllers;

[ApiController]
[Route("api/admin/db-restore")]
[Authorize(Roles = "Admin")]
public class DbRestoreController(IConfiguration config, ILogger<DbRestoreController> logger) : ControllerBase
{
    /// <summary>
    /// Restores the Dev database from the Prod database (Prod → Dev).
    /// Streams progress as newline-delimited JSON. Admin only.
    /// </summary>
    [HttpPost]
    public async Task Restore(CancellationToken ct)
    {
        Response.ContentType = "application/x-ndjson";
        Response.StatusCode = 200;

        async Task Send(string status, string message, int? done = null, int? total = null)
        {
            var obj = new { status, message, done, total, ts = DateTime.UtcNow };
            await Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(obj) + "\n", ct);
            await Response.Body.FlushAsync(ct);
        }

        var prodConn = config.GetConnectionString("ProdConnection");
        var devConn  = config.GetConnectionString("DevConnection");

        if (string.IsNullOrWhiteSpace(prodConn) || string.IsNullOrWhiteSpace(devConn))
        {
            await Send("error", "ProdConnection or DevConnection is missing from configuration.");
            return;
        }

        var srcOpts = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(prodConn).Options;
        var dstOpts = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(devConn).Options;

        await using var src = new AppDbContext(srcOpts);
        await using var dst = new AppDbContext(dstOpts);

        try
        {
            // ── Apply pending migrations on dev ───────────────────────────
            await Send("info", "Applying pending migrations on dev...");
            await dst.Database.MigrateAsync(ct);

            // ── Clear destination ─────────────────────────────────────────
            await Send("info", "Disabling FK checks and truncating all dev tables...");
            await dst.Database.ExecuteSqlRawAsync("SET session_replication_role = replica", ct);
            foreach (var table in Tables.All)
                await dst.Database.ExecuteSqlRawAsync($"TRUNCATE TABLE \"{table}\" RESTART IDENTITY CASCADE", ct);
            await dst.Database.ExecuteSqlRawAsync("SET session_replication_role = DEFAULT", ct);
            await Send("info", "Dev tables cleared.");

            // ── Copy tables ───────────────────────────────────────────────
            var steps = Tables.Ordered;
            var idx = 0;

            async Task Copy<T>(string name, Func<Task<List<T>>> read, Func<List<T>, Task> write, bool hasIntPk = true) where T : class
            {
                idx++;
                var rows = await read();
                if (rows.Count == 0)
                {
                    await Send("skip", $"{name}: 0 rows, skipped.", idx, steps.Length);
                    return;
                }

                if (hasIntPk)
                {
                    await dst.Database.OpenConnectionAsync(ct);
                    await dst.Database.ExecuteSqlRawAsync("SET session_replication_role = replica", ct);
                }

                await write(rows);
                await dst.SaveChangesAsync(ct);

                if (hasIntPk)
                {
                    await dst.Database.ExecuteSqlRawAsync(
                        $"SELECT setval(pg_get_serial_sequence('\"{name}\"', 'Id'), COALESCE(MAX(\"Id\"), 0) + 1, false) FROM \"{name}\"", ct);
                    await dst.Database.ExecuteSqlRawAsync("SET session_replication_role = DEFAULT", ct);
                    await dst.Database.CloseConnectionAsync();
                }

                await Send("ok", $"{name}: {rows.Count} row{(rows.Count == 1 ? "" : "s")} copied.", idx, steps.Length);
                logger.LogInformation("DB Restore — {Table}: {Count} rows", name, rows.Count);
            }

            // Identity tables (string PKs)
            await Copy("AspNetRoles",
                () => src.Roles.AsNoTracking().ToListAsync(ct),
                rows => dst.Roles.AddRangeAsync(rows, ct), hasIntPk: false);

            await Copy("AspNetUsers",
                () => src.Users.AsNoTracking().ToListAsync(ct),
                rows => { foreach (var u in rows) { u.CreatedAt = Utc(u.CreatedAt); NullNav(u); } return dst.Users.AddRangeAsync(rows, ct); },
                hasIntPk: false);

            await Copy("AspNetUserRoles",
                () => src.UserRoles.AsNoTracking().ToListAsync(ct),
                rows => dst.UserRoles.AddRangeAsync(rows, ct), hasIntPk: false);

            await Copy("AspNetUserClaims",
                () => src.UserClaims.AsNoTracking().ToListAsync(ct),
                rows => dst.UserClaims.AddRangeAsync(rows, ct), hasIntPk: false);

            await Copy("AspNetUserLogins",
                () => src.UserLogins.AsNoTracking().ToListAsync(ct),
                rows => dst.UserLogins.AddRangeAsync(rows, ct), hasIntPk: false);

            await Copy("AspNetUserTokens",
                () => src.UserTokens.AsNoTracking().ToListAsync(ct),
                rows => dst.UserTokens.AddRangeAsync(rows, ct), hasIntPk: false);

            await Copy("AspNetRoleClaims",
                () => src.RoleClaims.AsNoTracking().ToListAsync(ct),
                rows => dst.RoleClaims.AddRangeAsync(rows, ct), hasIntPk: false);

            // Integer-PK tables in dependency order
            await Copy("FareRules",
                () => src.FareRules.AsNoTracking().ToListAsync(ct),
                rows => dst.FareRules.AddRangeAsync(rows, ct));

            await Copy("Lines",
                () => src.Lines.AsNoTracking().ToListAsync(ct),
                rows => { foreach (var r in rows) NullNav(r); return dst.Lines.AddRangeAsync(rows, ct); });

            await Copy("Stations",
                () => src.Stations.AsNoTracking().ToListAsync(ct),
                rows => {
                    foreach (var r in rows) { if (r.OpeningDate.HasValue) r.OpeningDate = Utc(r.OpeningDate.Value); NullNav(r); }
                    return dst.Stations.AddRangeAsync(rows, ct);
                });

            await Copy("LineStations",
                () => src.LineStations.AsNoTracking().ToListAsync(ct),
                rows => { foreach (var r in rows) NullNav(r); return dst.LineStations.AddRangeAsync(rows, ct); });

            await Copy("StationConnections",
                () => src.StationConnections.AsNoTracking().ToListAsync(ct),
                rows => { foreach (var r in rows) NullNav(r); return dst.StationConnections.AddRangeAsync(rows, ct); });

            await Copy("Interchanges",
                () => src.Interchanges.AsNoTracking().ToListAsync(ct),
                rows => { foreach (var r in rows) NullNav(r); return dst.Interchanges.AddRangeAsync(rows, ct); });

            await Copy("StationGates",
                () => src.StationGates.AsNoTracking().ToListAsync(ct),
                rows => { foreach (var r in rows) NullNav(r); return dst.StationGates.AddRangeAsync(rows, ct); });

            await Copy("FeederServices",
                () => src.FeederServices.AsNoTracking().ToListAsync(ct),
                rows => { foreach (var r in rows) NullNav(r); return dst.FeederServices.AddRangeAsync(rows, ct); });

            await Copy("Platforms",
                () => src.Platforms.AsNoTracking().ToListAsync(ct),
                rows => { foreach (var r in rows) NullNav(r); return dst.Platforms.AddRangeAsync(rows, ct); });

            await Copy("LineTimetables",
                () => src.LineTimetables.AsNoTracking().ToListAsync(ct),
                rows => { foreach (var r in rows) NullNav(r); return dst.LineTimetables.AddRangeAsync(rows, ct); });

            await Copy("TrainRuns",
                () => src.TrainRuns.AsNoTracking().ToListAsync(ct),
                rows => { foreach (var r in rows) { r.DepartureFromTerminal = Utc(r.DepartureFromTerminal); NullNav(r); } return dst.TrainRuns.AddRangeAsync(rows, ct); });

            await Copy("FavouriteRoutes",
                () => src.FavouriteRoutes.AsNoTracking().ToListAsync(ct),
                rows => { foreach (var r in rows) { r.CreatedAt = Utc(r.CreatedAt); NullNav(r); } return dst.FavouriteRoutes.AddRangeAsync(rows, ct); });

            await Copy("RecentSearches",
                () => src.RecentSearches.AsNoTracking().ToListAsync(ct),
                rows => { foreach (var r in rows) { r.SearchedAt = Utc(r.SearchedAt); NullNav(r); } return dst.RecentSearches.AddRangeAsync(rows, ct); });

            await Copy("Tickets",
                () => src.Tickets.AsNoTracking().ToListAsync(ct),
                rows => { foreach (var r in rows) { r.PurchasedAt = Utc(r.PurchasedAt); r.ValidUntil = Utc(r.ValidUntil); NullNav(r); } return dst.Tickets.AddRangeAsync(rows, ct); });

            await Send("done", $"Restore complete. {steps.Length} tables processed.", steps.Length, steps.Length);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "DB Restore failed");
            await Send("error", $"Restore failed: {ex.Message}");
        }
    }

    private static DateTime Utc(DateTime dt) =>
        dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);

    private static void NullNav(object entity)
    {
        foreach (var prop in entity.GetType().GetProperties()
            .Where(p => p.CanWrite
                && p.PropertyType.IsClass
                && p.PropertyType != typeof(string)
                && !(p.PropertyType.IsGenericType && p.PropertyType.GetGenericTypeDefinition() == typeof(List<>))))
            prop.SetValue(entity, null);
    }

    private static class Tables
    {
        public static readonly string[] All =
        [
            "Tickets", "RecentSearches", "FavouriteRoutes", "TrainRuns", "LineTimetables",
            "Platforms", "FeederServices", "StationGates", "Interchanges", "StationConnections",
            "LineStations", "Stations", "Lines", "FareRules",
            "AspNetUserTokens", "AspNetUserLogins", "AspNetUserClaims", "AspNetUserRoles",
            "AspNetRoleClaims", "AspNetUsers", "AspNetRoles"
        ];

        public static readonly string[] Ordered =
        [
            "AspNetRoles", "AspNetUsers", "AspNetUserRoles", "AspNetUserClaims",
            "AspNetUserLogins", "AspNetUserTokens", "AspNetRoleClaims",
            "FareRules", "Lines", "Stations", "LineStations", "StationConnections",
            "Interchanges", "StationGates", "FeederServices", "Platforms", "LineTimetables",
            "TrainRuns", "FavouriteRoutes", "RecentSearches", "Tickets"
        ];
    }
}
