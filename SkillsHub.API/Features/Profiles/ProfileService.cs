using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SkillsHub.API.Features.Profiles.DTOs;
using SkillsHub.API.Infrastructure.Data;

namespace SkillsHub.API.Features.Profiles;

public class ProfileService(AppDbContext db)
{
    public async Task<ProfileResponse?> GetByUserIdAsync(Guid userId)
    {
        var profile = await db.EmployeeProfiles
            .Include(p => p.User)
            .Include(p => p.Skills).ThenInclude(s => s.Skill)
            .Include(p => p.Experiences)
            .Include(p => p.Projects)
            .Include(p => p.Educations)
            .FirstOrDefaultAsync(p => p.UserId == userId);

        return profile is null ? null : MapToDto(profile);
    }

    public async Task<ProfileResponse?> GetByIdAsync(Guid profileId)
    {
        var profile = await db.EmployeeProfiles
            .Include(p => p.User)
            .Include(p => p.Skills).ThenInclude(s => s.Skill)
            .Include(p => p.Experiences)
            .Include(p => p.Projects)
            .Include(p => p.Educations)
            .FirstOrDefaultAsync(p => p.Id == profileId);

        return profile is null ? null : MapToDto(profile);
    }

    public async Task<ProfileResponse?> UpdateAsync(Guid userId, UpdateProfileRequest req)
    {
        var profile = await db.EmployeeProfiles.Include(p => p.User).FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile is null) return null;

        if (req.FullName is not null) profile.FullName = req.FullName;
        if (req.CurrentTitle is not null) profile.CurrentTitle = req.CurrentTitle;
        if (req.Department is not null) profile.Department = req.Department;
        if (req.LinkedInUrl is not null) profile.LinkedInUrl = req.LinkedInUrl;
        profile.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return await GetByUserIdAsync(userId);
    }

    public static ProfileResponse MapToDto(Infrastructure.Data.Entities.EmployeeProfile p) => new(
        p.Id, p.UserId, p.User.Email, p.FullName, p.CurrentTitle, p.Department,
        p.YearsOfExperience, p.Summary, p.LinkedInUrl, p.Status, p.CreatedAt, p.UpdatedAt,
        p.Skills.Select(s => new SkillDto(s.SkillId, s.Skill.Name, s.Skill.Category, s.ProficiencyLevel, s.YearsExperience, s.IsEndorsed)).ToList(),
        p.Experiences.OrderBy(e => e.DisplayOrder).Select(e => new ExperienceDto(
            e.CompanyName, e.JobTitle,
            e.StartDate?.ToString("yyyy-MM"), e.EndDate?.ToString("yyyy-MM"),
            e.IsCurrent, e.Description,
            string.IsNullOrEmpty(e.TechStack) ? [] : JsonSerializer.Deserialize<List<string>>(e.TechStack) ?? []
        )).ToList(),
        p.Projects.Select(proj => new ProjectDto(
            proj.Name, proj.Description,
            string.IsNullOrEmpty(proj.TechStack) ? [] : JsonSerializer.Deserialize<List<string>>(proj.TechStack) ?? [],
            proj.GitHubUrl
        )).ToList(),
        p.Educations.Select(e => new EducationDto(e.Institution, e.Degree, e.FieldOfStudy, e.GraduationYear)).ToList()
    );
}
