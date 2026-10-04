using MetroRailApp.Core.DTOs;
using MetroRailApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace MetroRailApp.API.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var result = await authService.RegisterAsync(dto);
        return result == null ? BadRequest(new { error = "Registration failed. Email may already be in use." }) : Ok(result);
    }

    [HttpPost("register-admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RegisterAdmin(RegisterDto dto)
    {
        var result = await authService.RegisterAsync(dto, "Admin");
        return result == null ? BadRequest(new { error = "Registration failed." }) : Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var result = await authService.LoginAsync(dto);
        return result == null ? Unauthorized(new { error = "Invalid email or password." }) : Ok(result);
    }

    [HttpGet("mfa/status")]
    [Authorize]
    public async Task<IActionResult> MfaStatus()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var enabled = await authService.IsMfaEnabledAsync(userId);
        return Ok(new { enabled });
    }

    [HttpGet("mfa/setup")]
    [Authorize]
    public async Task<IActionResult> MfaSetup()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await authService.GetMfaSetupAsync(userId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost("mfa/enable")]
    [Authorize]
    public async Task<IActionResult> MfaEnable(MfaVerifyDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var ok = await authService.EnableMfaAsync(userId, dto.Code);
        return ok ? Ok() : BadRequest(new { error = "Invalid code." });
    }

    [HttpPost("mfa/disable")]
    [Authorize]
    public async Task<IActionResult> MfaDisable()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var ok = await authService.DisableMfaAsync(userId);
        return ok ? Ok() : BadRequest(new { error = "Failed to disable MFA." });
    }

    [HttpPost("mfa/verify")]
    public async Task<IActionResult> MfaVerify([FromBody] MfaVerifyDto dto, [FromQuery] string userId)
    {
        var result = await authService.VerifyMfaAsync(userId, dto.Code);
        return result == null ? Unauthorized(new { error = "Invalid code." }) : Ok(result);
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await authService.GetProfileAsync(userId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile(UpdateProfileDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await authService.UpdateProfileAsync(userId, dto);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var ok = await authService.ChangePasswordAsync(userId, dto);
        return ok ? Ok() : BadRequest(new { error = "Current password is incorrect." });
    }
}
