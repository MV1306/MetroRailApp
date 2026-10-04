using MetroRailApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using MetroRailApp.Core.Entities;
using Microsoft.Extensions.Configuration;

// ── Configuration ────────────────────────────────────────────────────────────
var config = new ConfigurationBuilder()
    .SetBasePath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "MetroRailApp.API"))
    .AddJsonFile("appsettings.json", optional: false)
    .Build();

var mode = args.FirstOrDefault()?.ToLower() ?? "migrate";

if (mode == "restore")
{
    await RunRestore(config);
}
else
{
    await RunMigrate(config, args);
}

// ═════════════════════════════════════════════════════════════════════════════
// RESTORE: Prod PostgreSQL  →  Dev PostgreSQL
// ═════════════════════════════════════════════════════════════════════════════
async Task RunRestore(IConfiguration cfg)
{
    var prodConn = cfg.GetConnectionString("ProdConnection")
        ?? throw new InvalidOperationException("ProdConnection not found in appsettings.json.");
    var devConn = cfg.GetConnectionString("DevConnection")
        ?? throw new InvalidOperationException("DevConnection not found in appsettings.json.");

    Console.WriteLine("╔══════════════════════════════════════════════════════╗");
    Console.WriteLine("║        DB RESTORE: Prod  →  Dev (PostgreSQL)        ║");
    Console.WriteLine("╚══════════════════════════════════════════════════════╝");
    Console.WriteLine($"  Source : {MaskPassword(prodConn)}");
    Console.WriteLine($"  Target : {MaskPassword(devConn)}");
    Console.WriteLine();

    Console.Write("  ⚠  This will WIPE the dev database and replace it with prod data.\n");
    Console.Write("     Type YES to continue: ");
    var confirm = Console.ReadLine()?.Trim();
    if (confirm != "YES")
    {
        Console.WriteLine("  Aborted.");
        return;
    }
    Console.WriteLine();

    var srcOpts = new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(prodConn).Options;
    var dstOpts = new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(devConn).Options;

    await using var src = new AppDbContext(srcOpts);
    await using var dst = new AppDbContext(dstOpts);

    // Ensure dev schema is up to date before wiping
    Console.WriteLine("  Applying pending migrations on dev...");
    await dst.Database.MigrateAsync();

    await ClearDestination(dst);
    await CopyAllTables(src, dst);

    Console.WriteLine("\n✅ Restore complete! Dev database now mirrors production.");
}

// ═════════════════════════════════════════════════════════════════════════════
// MIGRATE: SQL Server  →  Target PostgreSQL  (original behaviour)
// ═════════════════════════════════════════════════════════════════════════════
async Task RunMigrate(IConfiguration cfg, string[] cliArgs)
{
    const string sqlServerConn = "Server=localhost;Database=MetroRailDbNew;Trusted_Connection=True;TrustServerCertificate=True;";

    var targetEnv = cliArgs.Skip(1).FirstOrDefault() ?? cfg["Environment"] ?? "D";
    var connKey = targetEnv == "P" ? "ProdConnection" : "DevConnection";
    var postgresConn = cfg.GetConnectionString(connKey)
        ?? throw new InvalidOperationException($"Connection string '{connKey}' not found in appsettings.json.");

    Console.WriteLine("╔══════════════════════════════════════════════════════╗");
    Console.WriteLine("║      DB MIGRATE: SQL Server  →  PostgreSQL          ║");
    Console.WriteLine("╚══════════════════════════════════════════════════════╝");
    Console.WriteLine($"  Target environment : {targetEnv}");
    Console.WriteLine($"  Target connection  : {MaskPassword(postgresConn)}");
    Console.WriteLine();

    var sqlOpts = new DbContextOptionsBuilder<AppDbContext>().UseSqlServer(sqlServerConn).Options;
    var pgOpts  = new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(postgresConn).Options;

    await using var src = new AppDbContext(sqlOpts);
    await using var dst = new AppDbContext(pgOpts);

    await ClearDestination(dst);
    await CopyAllTables(src, dst);

    Console.WriteLine("\n✅ Migration complete!");
}

// ═════════════════════════════════════════════════════════════════════════════
// Shared helpers
// ═════════════════════════════════════════════════════════════════════════════

async Task ClearDestination(AppDbContext dst)
{
    Console.WriteLine("  Clearing destination tables...");
    await dst.Database.ExecuteSqlRawAsync("SET session_replication_role = replica");
    foreach (var table in new[]
    {
        "Tickets", "RecentSearches", "FavouriteRoutes", "TrainRuns", "LineTimetables",
        "Platforms", "FeederServices", "StationGates", "Interchanges", "StationConnections",
        "LineStations", "Stations", "Lines", "FareRules",
        "AspNetUserTokens", "AspNetUserLogins", "AspNetUserClaims", "AspNetUserRoles",
        "AspNetRoleClaims", "AspNetUsers", "AspNetRoles"
    })
        await dst.Database.ExecuteSqlRawAsync($"TRUNCATE TABLE \"{table}\" RESTART IDENTITY CASCADE");
    await dst.Database.ExecuteSqlRawAsync("SET session_replication_role = DEFAULT");
    Console.WriteLine("  Done clearing.\n");
}

async Task CopyAllTables(AppDbContext src, AppDbContext dst)
{
    // ── 1. Identity tables (string PKs, no sequences) ────────────────────────
    await Migrate("AspNetRoles",
        () => src.Roles.AsNoTracking().ToListAsync(),
        rows => dst.Roles.AddRangeAsync(rows));

    await Migrate("AspNetUsers",
        () => src.Users.AsNoTracking().ToListAsync(),
        rows => {
            foreach (var u in rows) { u.CreatedAt = ToUtc(u.CreatedAt); ClearNav(u); }
            return dst.Users.AddRangeAsync(rows);
        });

    await Migrate("AspNetUserRoles",
        () => src.UserRoles.AsNoTracking().ToListAsync(),
        rows => dst.UserRoles.AddRangeAsync(rows));

    await Migrate("AspNetUserClaims",
        () => src.UserClaims.AsNoTracking().ToListAsync(),
        rows => dst.UserClaims.AddRangeAsync(rows));

    await Migrate("AspNetUserLogins",
        () => src.UserLogins.AsNoTracking().ToListAsync(),
        rows => dst.UserLogins.AddRangeAsync(rows));

    await Migrate("AspNetUserTokens",
        () => src.UserTokens.AsNoTracking().ToListAsync(),
        rows => dst.UserTokens.AddRangeAsync(rows));

    await Migrate("AspNetRoleClaims",
        () => src.RoleClaims.AsNoTracking().ToListAsync(),
        rows => dst.RoleClaims.AddRangeAsync(rows));

    // ── 2. Independent tables ─────────────────────────────────────────────────
    await MigrateWithIdentity("FareRules",
        () => src.FareRules.AsNoTracking().ToListAsync(),
        rows => dst.FareRules.AddRangeAsync(rows));

    await MigrateWithIdentity("Lines",
        () => src.Lines.AsNoTracking().ToListAsync(),
        rows => { foreach (var l in rows) ClearNav(l); return dst.Lines.AddRangeAsync(rows); });

    await MigrateWithIdentity("Stations",
        () => src.Stations.AsNoTracking().ToListAsync(),
        rows => {
            foreach (var s in rows) { if (s.OpeningDate.HasValue) s.OpeningDate = ToUtc(s.OpeningDate.Value); ClearNav(s); }
            return dst.Stations.AddRangeAsync(rows);
        });

    // ── 3. Tables depending on Lines + Stations ───────────────────────────────
    await MigrateWithIdentity("LineStations",
        () => src.LineStations.AsNoTracking().ToListAsync(),
        rows => { foreach (var r in rows) ClearNav(r); return dst.LineStations.AddRangeAsync(rows); });

    await MigrateWithIdentity("StationConnections",
        () => src.StationConnections.AsNoTracking().ToListAsync(),
        rows => { foreach (var r in rows) ClearNav(r); return dst.StationConnections.AddRangeAsync(rows); });

    await MigrateWithIdentity("Interchanges",
        () => src.Interchanges.AsNoTracking().ToListAsync(),
        rows => { foreach (var r in rows) ClearNav(r); return dst.Interchanges.AddRangeAsync(rows); });

    await MigrateWithIdentity("StationGates",
        () => src.StationGates.AsNoTracking().ToListAsync(),
        rows => { foreach (var r in rows) ClearNav(r); return dst.StationGates.AddRangeAsync(rows); });

    await MigrateWithIdentity("FeederServices",
        () => src.FeederServices.AsNoTracking().ToListAsync(),
        rows => { foreach (var r in rows) ClearNav(r); return dst.FeederServices.AddRangeAsync(rows); });

    await MigrateWithIdentity("Platforms",
        () => src.Platforms.AsNoTracking().ToListAsync(),
        rows => { foreach (var r in rows) ClearNav(r); return dst.Platforms.AddRangeAsync(rows); });

    await MigrateWithIdentity("LineTimetables",
        () => src.LineTimetables.AsNoTracking().ToListAsync(),
        rows => { foreach (var r in rows) ClearNav(r); return dst.LineTimetables.AddRangeAsync(rows); });

    await MigrateWithIdentity("TrainRuns",
        () => src.TrainRuns.AsNoTracking().ToListAsync(),
        rows => {
            foreach (var t in rows) { t.DepartureFromTerminal = ToUtc(t.DepartureFromTerminal); ClearNav(t); }
            return dst.TrainRuns.AddRangeAsync(rows);
        });

    // ── 4. Tables depending on Users + Stations ───────────────────────────────
    await MigrateWithIdentity("FavouriteRoutes",
        () => src.FavouriteRoutes.AsNoTracking().ToListAsync(),
        rows => {
            foreach (var r in rows) { r.CreatedAt = ToUtc(r.CreatedAt); ClearNav(r); }
            return dst.FavouriteRoutes.AddRangeAsync(rows);
        });

    await MigrateWithIdentity("RecentSearches",
        () => src.RecentSearches.AsNoTracking().ToListAsync(),
        rows => {
            foreach (var r in rows) { r.SearchedAt = ToUtc(r.SearchedAt); ClearNav(r); }
            return dst.RecentSearches.AddRangeAsync(rows);
        });

    await MigrateWithIdentity("Tickets",
        () => src.Tickets.AsNoTracking().ToListAsync(),
        rows => {
            foreach (var t in rows) { t.PurchasedAt = ToUtc(t.PurchasedAt); t.ValidUntil = ToUtc(t.ValidUntil); ClearNav(t); }
            return dst.Tickets.AddRangeAsync(rows);
        });

    // ── Local helpers ─────────────────────────────────────────────────────────
    async Task Migrate<T>(string name, Func<Task<List<T>>> read, Func<List<T>, Task> write) where T : class
    {
        Console.Write($"  {name,-30}");
        var rows = await read();
        if (rows.Count == 0) { Console.WriteLine("0 rows, skipped."); return; }
        await write(rows);
        await dst.SaveChangesAsync();
        Console.WriteLine($"{rows.Count} rows  ✓");
    }

    async Task MigrateWithIdentity<T>(string name, Func<Task<List<T>>> read, Func<List<T>, Task> write) where T : class
    {
        Console.Write($"  {name,-30}");
        var rows = await read();
        if (rows.Count == 0) { Console.WriteLine("0 rows, skipped."); return; }

        await dst.Database.OpenConnectionAsync();
        await dst.Database.ExecuteSqlRawAsync("SET session_replication_role = replica");

        await write(rows);
        await dst.SaveChangesAsync();

        await dst.Database.ExecuteSqlRawAsync(
            $"SELECT setval(pg_get_serial_sequence('\"{name}\"', 'Id'), COALESCE(MAX(\"Id\"), 0) + 1, false) FROM \"{name}\"");

        await dst.Database.ExecuteSqlRawAsync("SET session_replication_role = DEFAULT");
        await dst.Database.CloseConnectionAsync();

        Console.WriteLine($"{rows.Count} rows  ✓");
    }
}

// ── Utility ───────────────────────────────────────────────────────────────────

static DateTime ToUtc(DateTime dt) =>
    dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);

static void ClearNav(object entity)
{
    foreach (var prop in entity.GetType().GetProperties()
        .Where(p => p.CanWrite
            && p.PropertyType.IsClass
            && p.PropertyType != typeof(string)
            && !(p.PropertyType.IsGenericType
                 && p.PropertyType.GetGenericTypeDefinition() == typeof(List<>))))
    {
        prop.SetValue(entity, null);
    }
}

static string MaskPassword(string connStr)
{
    // Replace Password=<value> with Password=***
    return System.Text.RegularExpressions.Regex.Replace(
        connStr, @"Password=[^;]+", "Password=***", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
}
