using System.ComponentModel.DataAnnotations;

namespace SkillsHub.API.Features.Auth.DTOs;

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    string Role = "Employee"
);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record LoginResponse(
    string Token,
    string Email,
    string Role,
    Guid UserId,
    DateTime ExpiresAt
);

public record UserInfoResponse(
    Guid Id,
    string Email,
    string Role,
    bool IsActive
);
