using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillsHub.API.Common.Models;
using SkillsHub.API.Features.Auth.DTOs;
using System.Security.Claims;

namespace SkillsHub.API.Features.Auth;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Register([FromBody] RegisterRequest req)
    {
        var (success, error, response) = await authService.RegisterAsync(req);
        if (!success) return BadRequest(ApiResponse<LoginResponse>.Fail(error));
        return Ok(ApiResponse<LoginResponse>.Ok(response!, "Registration successful"));
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest req)
    {
        var (success, error, response) = await authService.LoginAsync(req);
        if (!success) return Unauthorized(ApiResponse<LoginResponse>.Fail(error));
        return Ok(ApiResponse<LoginResponse>.Ok(response!));
    }

    [Authorize]
    [HttpGet("me")]
    public ActionResult<ApiResponse<UserInfoResponse>> Me()
    {
        var userId = User.FindFirstValue("userId")!;
        var email = User.FindFirstValue(ClaimTypes.Email)!;
        var role = User.FindFirstValue(ClaimTypes.Role)!;
        var response = new UserInfoResponse(Guid.Parse(userId), email, role, true);
        return Ok(ApiResponse<UserInfoResponse>.Ok(response));
    }
}
