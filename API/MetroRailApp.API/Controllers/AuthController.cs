using MetroRailApp.Core.DTOs;
using MetroRailApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

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
}
