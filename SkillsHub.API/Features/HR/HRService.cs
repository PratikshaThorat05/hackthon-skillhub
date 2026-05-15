using Microsoft.EntityFrameworkCore;
using SkillsHub.API.Features.HR.DTOs;
using SkillsHub.API.Infrastructure.Data;

namespace SkillsHub.API.Features.HR;

public class HRService(AppDbContext db)
{
    public async Task<(List<ProfileSummaryDto> Items, int Total)> GetProfilesAsync(string? status, int page, int pageSize)
    {
        var query = db.EmployeeProfiles
            .Include(p => p.User)
            .Include(p => p.Skills)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(p => p.Status == status);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProfileSummaryDto(
                p.Id, p.UserId, p.User.Email, p.FullName,
                p.CurrentTitle, p.Department, p.YearsOfExperience,
                p.Status, p.Skills.Count, p.UpdatedAt))
            .ToListAsync();

        return (items, total);
    }

    public async Task<(bool Success, string Error)> ApproveAsync(Guid profileId, Guid hrUserId)
    {
        var profile = await db.EmployeeProfiles.FindAsync(profileId);
        if (profile is null) return (false, "Profile not found");
        profile.Status = "Approved";
        profile.ApprovedBy = hrUserId;
        profile.ApprovedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return (true, string.Empty);
    }

    public async Task<(bool Success, string Error)> RejectAsync(Guid profileId, Guid hrUserId)
    {
        var profile = await db.EmployeeProfiles.FindAsync(profileId);
        if (profile is null) return (false, "Profile not found");
        profile.Status = "Rejected";
        profile.ApprovedBy = hrUserId;
        profile.ApprovedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return (true, string.Empty);
    }

    public async Task<HRStatsResponse> GetStatsAsync()
    {
        var total = await db.EmployeeProfiles.CountAsync();
        var pending = await db.EmployeeProfiles.CountAsync(p => p.Status == "Pending");
        var approved = await db.EmployeeProfiles.CountAsync(p => p.Status == "Approved");
        var resumes = await db.Resumes.CountAsync();

        var topSkills = await db.EmployeeSkills
            .Include(es => es.Skill)
            .GroupBy(es => new { es.SkillId, es.Skill.Name, es.Skill.Category })
            .OrderByDescending(g => g.Count())
            .Take(10)
            .Select(g => new TopSkillDto(g.Key.Name, g.Key.Category, g.Count()))
            .ToListAsync();

        return new HRStatsResponse(total, pending, approved, resumes, topSkills);
    }
}
