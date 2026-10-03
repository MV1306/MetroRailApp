using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MetroRailApp.Core.DTOs;
using MetroRailApp.Core.Entities;
using MetroRailApp.Core.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace MetroRailApp.Services.Implementations;

public class AuthService(UserManager<AppUser> userManager, IConfiguration config) : IAuthService
{
    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto, string role = "User")
    {
        var user = new AppUser { FullName = dto.FullName, Email = dto.Email, UserName = dto.Email };
        var result = await userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded) return null;
        await userManager.AddToRoleAsync(user, role);
        return new AuthResponseDto(GenerateToken(user, role), user.Email!, user.FullName, role);
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);
        if (user == null || !await userManager.CheckPasswordAsync(user, dto.Password)) return null;
        var roles = await userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "User";
        return new AuthResponseDto(GenerateToken(user, role), user.Email!, user.FullName, role);
    }

    private string GenerateToken(AppUser user, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Role, role)
        };
        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
