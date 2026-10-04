using MetroRailApp.Core.Entities;
using MetroRailApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MetroRailApp.Services.Implementations;

public class TrainRunGeneratorService(IServiceScopeFactory scopeFactory, ILogger<TrainRunGeneratorService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // generate immediately on startup for today
        await GenerateForToday(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            // wait until next midnight UTC
            var now = DateTime.UtcNow;
            var nextMidnight = now.Date.AddDays(1);
            var delay = nextMidnight - now;
            await Task.Delay(delay, stoppingToken);
            await GenerateForToday(stoppingToken);
        }
    }

    private async Task GenerateForToday(CancellationToken ct)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var today = DateTime.UtcNow.Date;
            var dayType = today.DayOfWeek switch
            {
                DayOfWeek.Saturday => DayType.Saturday,
                DayOfWeek.Sunday => DayType.SundayAndHoliday,
                _ => DayType.Weekday
            };

            // remove stale runs (older than today)
            var stale = await db.TrainRuns.Where(r => r.DepartureFromTerminal.Date < today).ToListAsync(ct);
            db.TrainRuns.RemoveRange(stale);

            // skip if already generated for today
            var alreadyExists = await db.TrainRuns.AnyAsync(r => r.DepartureFromTerminal.Date == today, ct);
            if (alreadyExists) { await db.SaveChangesAsync(ct); return; }

            var timetables = await db.LineTimetables
                .Where(t => t.DayType == dayType)
                .ToListAsync(ct);

            var runs = new List<TrainRun>();

            foreach (var t in timetables)
            {
                var first = ToDateTimeUtc(today, t.FirstDeparture);
                var last = ToDateTimeUtc(today, t.LastDeparture);
                var peakWindows = t.PeakWindows
                    .Select(p => (Start: ToDateTimeUtc(today, p.Start), End: ToDateTimeUtc(today, p.End)))
                    .ToList();
                var current = first;

                while (current <= last)
                {
                    runs.Add(new TrainRun
                    {
                        LineId = t.LineId,
                        Direction = t.Direction,
                        DepartureFromTerminal = current
                    });
                    var isPeak = peakWindows.Any(w => current >= w.Start && current < w.End);
                    current = current.AddMinutes(isPeak ? t.PeakFrequencyMinutes : t.OffPeakFrequencyMinutes);
                }
            }

            db.TrainRuns.AddRange(runs);
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Generated {Count} train runs for {Date}", runs.Count, today.ToShortDateString());
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to generate train runs");
        }
    }

    private static DateTime ToDateTimeUtc(DateTime date, string hhmm)
    {
        var parts = hhmm.Split(':');
        return DateTime.SpecifyKind(
            new DateTime(date.Year, date.Month, date.Day, int.Parse(parts[0]), int.Parse(parts[1]), 0),
            DateTimeKind.Utc);
    }
}
