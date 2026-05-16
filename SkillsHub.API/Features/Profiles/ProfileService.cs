using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SkillsHub.API.Features.Profiles.DTOs;
using SkillsHub.API.Infrastructure.Data;
using SkillsHub.API.Infrastructure.Data.Entities;

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
            .Include(p => p.Certifications)
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
            .Include(p => p.Certifications)
            .FirstOrDefaultAsync(p => p.Id == profileId);

        return profile is null ? null : MapToDto(profile);
    }

    public async Task<List<ProfileSummaryResponse>> GetDirectoryAsync()
    {
        return await db.EmployeeProfiles
            .Include(p => p.Skills).ThenInclude(s => s.Skill)
            .Where(p => p.Status == "Approved")
            .OrderBy(p => p.FullName)
            .Select(p => new ProfileSummaryResponse(
                p.Id, p.FullName, p.CurrentTitle, p.Department, p.YearsOfExperience, p.Summary,
                p.Skills.OrderByDescending(s => s.ProficiencyLevel).Take(5).Select(s => s.Skill.Name).ToList()
            ))
            .ToListAsync();
    }

    public async Task<ProfileResponse?> UpdateAsync(Guid userId, UpdateProfileRequest req)
    {
        var profile = await db.EmployeeProfiles.Include(p => p.User).FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile is null) return null;

        if (req.FullName is not null) profile.FullName = req.FullName;
        if (req.CurrentTitle is not null) profile.CurrentTitle = req.CurrentTitle;
        if (req.Department is not null) profile.Department = req.Department;
        if (req.LinkedInUrl is not null) profile.LinkedInUrl = req.LinkedInUrl;
        if (req.Location is not null) profile.Location = req.Location;
        if (req.Availability is not null) profile.Availability = req.Availability;
        profile.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return await GetByUserIdAsync(userId);
    }

    public async Task<ProfileResponse?> UpdateByIdAsync(Guid profileId, UpdateProfileRequest req)
    {
        var profile = await db.EmployeeProfiles.Include(p => p.User).FirstOrDefaultAsync(p => p.Id == profileId);
        if (profile is null) return null;

        if (req.FullName is not null) profile.FullName = req.FullName;
        if (req.CurrentTitle is not null) profile.CurrentTitle = req.CurrentTitle;
        if (req.Department is not null) profile.Department = req.Department;
        if (req.LinkedInUrl is not null) profile.LinkedInUrl = req.LinkedInUrl;
        if (req.Location is not null) profile.Location = req.Location;
        if (req.Availability is not null) profile.Availability = req.Availability;
        profile.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return await GetByIdAsync(profileId);
    }

    public async Task<ProfileResponse?> UpdateSkillsAsync(Guid userId, List<SkillEdit> skills)
    {
        var profile = await db.EmployeeProfiles
            .Include(p => p.Skills).ThenInclude(s => s.Skill)
            .FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile is null) return null;
        await ApplySkillEditsAsync(profile, skills);
        return await GetByUserIdAsync(userId);
    }

    public async Task<ProfileResponse?> UpdateSkillsByIdAsync(Guid profileId, List<SkillEdit> skills)
    {
        var profile = await db.EmployeeProfiles
            .Include(p => p.Skills).ThenInclude(s => s.Skill)
            .FirstOrDefaultAsync(p => p.Id == profileId);
        if (profile is null) return null;
        await ApplySkillEditsAsync(profile, skills);
        return await GetByIdAsync(profileId);
    }

    private async Task ApplySkillEditsAsync(EmployeeProfile profile, List<SkillEdit> skills)
    {
        db.EmployeeSkills.RemoveRange(profile.Skills);
        await db.SaveChangesAsync();
        foreach (var s in skills)
        {
            var skillEntity = await db.Skills.FirstOrDefaultAsync(sk => sk.Name == s.Name)
                ?? new Skill { Name = s.Name, Category = s.Category };
            if (skillEntity.Id == 0) { db.Skills.Add(skillEntity); await db.SaveChangesAsync(); }
            db.EmployeeSkills.Add(new EmployeeSkill
            {
                ProfileId = profile.Id,
                SkillId = skillEntity.Id,
                ProficiencyLevel = Math.Clamp(s.Proficiency, 1, 5),
                YearsExperience = s.Years
            });
        }
        profile.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    public static ProfileResponse MapToDto(Infrastructure.Data.Entities.EmployeeProfile p) => new(
        p.Id, p.UserId, p.User.Email, p.FullName, p.CurrentTitle, p.Department,
        p.YearsOfExperience, p.Summary, p.LinkedInUrl, p.Location, p.Availability, p.Status, p.CreatedAt, p.UpdatedAt,
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
        p.Educations.Select(e => new EducationDto(e.Institution, e.Degree, e.FieldOfStudy, e.GraduationYear)).ToList(),
        p.Certifications.Select(c => new CertificationDto(
            c.Name, c.IssuingOrganization, c.CredentialId, c.CredentialUrl,
            c.IssueDate?.ToString("yyyy-MM"), c.ExpiryDate?.ToString("yyyy-MM")
        )).ToList()
    );
}
