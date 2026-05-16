using Microsoft.EntityFrameworkCore;
using SkillsHub.API.Features.Auth.DTOs;
using SkillsHub.API.Infrastructure.Data;
using SkillsHub.API.Infrastructure.Data.Entities;

namespace SkillsHub.API.Features.Auth;

public class AuthService(AppDbContext db, JwtTokenService jwt)
{
    public async Task<(bool Success, string Error, LoginResponse? Response)> RegisterAsync(RegisterRequest req)
    {
        if (await db.Users.AnyAsync(u => u.Email == req.Email))
            return (false, "Email already registered", null);

        var validRoles = new[] { "Employee", "HR", "Admin" };
        if (!validRoles.Contains(req.Role))
            return (false, "Invalid role. Must be Employee, HR, or Admin", null);

        var user = new User
        {
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = req.Role
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var (token, expires) = jwt.GenerateToken(user);
        return (true, string.Empty, new LoginResponse(token, user.Email, user.Role, user.Id, expires));
    }

    public async Task<(bool Success, string Error, LoginResponse? Response)> LoginAsync(LoginRequest req)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email && u.IsActive);
        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return (false, "Invalid email or password", null);

        var (token, expires) = jwt.GenerateToken(user);
        return (true, string.Empty, new LoginResponse(token, user.Email, user.Role, user.Id, expires));
    }
}
