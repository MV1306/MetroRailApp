using Microsoft.AspNetCore.Identity;

namespace MetroRailApp.Core.Entities;

public class AppUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<FavouriteRoute> FavouriteRoutes { get; set; } = [];
}
