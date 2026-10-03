using System.ComponentModel.DataAnnotations;

namespace MetroRailApp.Core.DTOs;

public record RegisterDto(
    [Required, MaxLength(100)] string FullName,
    [Required, EmailAddress, MaxLength(200)] string Email,
    [Required, MinLength(8), MaxLength(100)] string Password);

public record LoginDto(
    [Required, EmailAddress, MaxLength(200)] string Email,
    [Required, MaxLength(100)] string Password);

public record AuthResponseDto(string Token, string Email, string FullName, string Role);
