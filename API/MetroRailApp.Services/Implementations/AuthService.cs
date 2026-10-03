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

    public async Task<LoginResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);
        if (user == null || !await userManager.CheckPasswordAsync(user, dto.Password)) return null;

        if (user.TwoFactorEnabled)
            return new LoginResponseDto(null, null, null, null, true, user.Id);

        var roles = await userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "User";
        return new LoginResponseDto(GenerateToken(user, role), user.Email!, user.FullName, role, false, null);
    }

    public async Task<bool> IsMfaEnabledAsync(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        return user?.TwoFactorEnabled ?? false;
    }

    public async Task<MfaSetupResponseDto?> GetMfaSetupAsync(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user == null) return null;
        // Only reset the key if MFA is not yet enabled
        if (!user.TwoFactorEnabled)
            await userManager.ResetAuthenticatorKeyAsync(user);
        var key = await userManager.GetAuthenticatorKeyAsync(user);
        var uri = $"otpauth://totp/ChennaiMetro:{user.Email}?secret={key}&issuer=ChennaiMetro&digits=6";
        return new MfaSetupResponseDto(key!, uri);
    }

    public async Task<bool> EnableMfaAsync(string userId, string code)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user == null) return false;
        var valid = await userManager.VerifyTwoFactorTokenAsync(user, userManager.Options.Tokens.AuthenticatorTokenProvider, code);
        if (!valid) return false;
        await userManager.SetTwoFactorEnabledAsync(user, true);
        return true;
    }

    public async Task<AuthResponseDto?> VerifyMfaAsync(string userId, string code)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user == null) return null;
        var valid = await userManager.VerifyTwoFactorTokenAsync(user, userManager.Options.Tokens.AuthenticatorTokenProvider, code);
        if (!valid) return null;
        var roles = await userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "User";
        return new AuthResponseDto(GenerateToken(user, role), user.Email!, user.FullName, role);
    }

    public async Task<bool> DisableMfaAsync(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user == null) return false;
        await userManager.SetTwoFactorEnabledAsync(user, false);
        await userManager.ResetAuthenticatorKeyAsync(user);
        return true;
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
