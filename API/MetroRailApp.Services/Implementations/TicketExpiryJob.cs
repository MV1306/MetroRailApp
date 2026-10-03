using MetroRailApp.Core.Entities;
using MetroRailApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MetroRailApp.Services.Implementations;

public class TicketExpiryJob(IServiceScopeFactory scopeFactory, ILogger<TicketExpiryJob> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);

            try
            {
                using var scope = scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var expired = await db.Tickets
                    .Where(t => t.Status == TicketStatus.Active && t.ValidUntil < DateTime.UtcNow)
                    .ExecuteUpdateAsync(s => s.SetProperty(t => t.Status, TicketStatus.Expired), stoppingToken);

                if (expired > 0)
                    logger.LogInformation("TicketExpiryJob: expired {Count} ticket(s).", expired);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                logger.LogError(ex, "TicketExpiryJob failed.");
            }
        }
    }
}
