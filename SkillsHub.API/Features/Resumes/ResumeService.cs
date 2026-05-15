using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SkillsHub.API.Features.Resumes.DTOs;
using SkillsHub.API.Infrastructure.AI;
using SkillsHub.API.Infrastructure.AI.Models;
using SkillsHub.API.Infrastructure.Data;
using SkillsHub.API.Infrastructure.Data.Entities;
using SkillsHub.API.Infrastructure.Storage;

namespace SkillsHub.API.Features.Resumes;

public class ResumeService(
    AppDbContext db,
    LocalFileStorageService storage,
    IAIGatewayService ai,
    IServiceScopeFactory scopeFactory,
    ILogger<ResumeService> logger)
{
    private static readonly string[] AllowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];

    public async Task<(bool Success, string Error, ResumeUploadResponse? Response)> UploadAsync(IFormFile file, Guid userId)
    {
        if (!AllowedTypes.Contains(file.ContentType))
            return (false, "Only PDF, DOCX, and TXT files are allowed", null);

        if (file.Length > 5 * 1024 * 1024)
            return (false, "File size must be under 5MB", null);

        // Mark previous resumes as inactive
        var previous = await db.Resumes.Where(r => r.UserId == userId && r.IsActive).ToListAsync();
        previous.ForEach(r => r.IsActive = false);

        var path = await storage.SaveAsync(file, userId);
        var resume = new Resume
        {
            UserId = userId,
            FileName = file.FileName,
            StoragePath = path,
            FileSizeBytes = file.Length,
            ContentType = file.ContentType
        };

        db.Resumes.Add(resume);
        await db.SaveChangesAsync();

        // Fire-and-forget background processing
        _ = Task.Run(() => ProcessResumeAsync(resume.Id, userId));

        return (true, string.Empty, new ResumeUploadResponse(resume.Id, resume.FileName, resume.ParseStatus, "Resume uploaded. Processing started."));
    }

    public async Task<ResumeStatusResponse?> GetStatusAsync(Guid userId)
    {
        var resume = await db.Resumes
            .Where(r => r.UserId == userId && r.IsActive)
            .OrderByDescending(r => r.UploadedAt)
            .FirstOrDefaultAsync();

        if (resume is null) return null;

        return new ResumeStatusResponse(resume.Id, resume.FileName, resume.ParseStatus, resume.UploadedAt, resume.ParsedAt, resume.ParseError);
    }

    private async Task ProcessResumeAsync(Guid resumeId, Guid userId)
    {
        using var logScope = logger.BeginScope("Processing resume {ResumeId}", resumeId);
        using var serviceScope = scopeFactory.CreateScope();
        var db = serviceScope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            var resume = await db.Resumes.FindAsync(resumeId);
            if (resume is null) return;

            resume.ParseStatus = "Processing";
            await db.SaveChangesAsync();

            // Read file bytes and send to AI (AI service handles PDF/DOCX extraction)
            var bytes = storage.ReadBytes(resume.StoragePath);
            if (bytes is null)
            {
                resume.ParseStatus = "Failed";
                resume.ParseError = "File not found on disk";
                await db.SaveChangesAsync();
                return;
            }

            // Get or create profile
            var profile = await db.EmployeeProfiles.Include(p => p.Skills).Include(p => p.Experiences)
                .Include(p => p.Projects).Include(p => p.Educations)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile is null)
            {
                var user = await db.Users.FindAsync(userId);
                profile = new EmployeeProfile { UserId = userId, FullName = user?.Email ?? "Unknown" };
                db.EmployeeProfiles.Add(profile);
                await db.SaveChangesAsync();
            }

            // Call AI parse service — send raw text placeholder (AI reads the file)
            var parseResult = await ai.ParseResumeAsync(new ParseResumeRequest(
                Convert.ToBase64String(bytes),
                profile.Id.ToString()
            ));

            if (parseResult is null)
            {
                resume.ParseStatus = "Failed";
                resume.ParseError = "AI service unavailable";
                await db.SaveChangesAsync();
                return;
            }

            // Update profile from AI results
            profile.Summary = parseResult.Summary;
            profile.YearsOfExperience = parseResult.TotalYearsExperience;

            // Upsert skills
            db.EmployeeSkills.RemoveRange(profile.Skills);
            foreach (var s in parseResult.Skills)
            {
                var skill = await db.Skills.FirstOrDefaultAsync(sk => sk.Name == s.Name)
                    ?? new Skill { Name = s.Name, Category = s.Category };
                if (skill.Id == 0) { db.Skills.Add(skill); await db.SaveChangesAsync(); }

                db.EmployeeSkills.Add(new EmployeeSkill
                {
                    ProfileId = profile.Id,
                    SkillId = skill.Id,
                    ProficiencyLevel = s.Proficiency,
                    YearsExperience = s.Years
                });
            }

            // Replace experience
            db.WorkExperiences.RemoveRange(profile.Experiences);
            int order = 0;
            foreach (var exp in parseResult.Experience)
            {
                db.WorkExperiences.Add(new WorkExperience
                {
                    ProfileId = profile.Id,
                    CompanyName = exp.Company,
                    JobTitle = exp.Title,
                    StartDate = ParseDate(exp.StartDate),
                    EndDate = ParseDate(exp.EndDate),
                    IsCurrent = exp.IsCurrent,
                    Description = exp.Description,
                    TechStack = JsonSerializer.Serialize(exp.TechStack),
                    DisplayOrder = order++
                });
            }

            // Replace projects
            db.Projects.RemoveRange(profile.Projects);
            foreach (var proj in parseResult.Projects)
            {
                db.Projects.Add(new Project
                {
                    ProfileId = profile.Id,
                    Name = proj.Name,
                    Description = proj.Description,
                    TechStack = JsonSerializer.Serialize(proj.TechStack),
                    GitHubUrl = proj.GitHubUrl
                });
            }

            // Replace education
            db.Educations.RemoveRange(profile.Educations);
            foreach (var edu in parseResult.Education)
            {
                db.Educations.Add(new Education
                {
                    ProfileId = profile.Id,
                    Institution = edu.Institution,
                    Degree = edu.Degree,
                    FieldOfStudy = edu.FieldOfStudy,
                    GraduationYear = edu.GraduationYear
                });
            }

            profile.UpdatedAt = DateTime.UtcNow;
            resume.ParseStatus = "Done";
            resume.ParsedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            // Generate embedding
            var embeddingText = BuildEmbeddingText(parseResult);
            var embedResult = await ai.EmbedProfileAsync(new EmbedProfileRequest(profile.Id.ToString(), embeddingText));

            if (embedResult is not null)
            {
                var existing = await db.ProfileEmbeddings.FirstOrDefaultAsync(pe => pe.ProfileId == profile.Id);
                if (existing is null)
                {
                    db.ProfileEmbeddings.Add(new ProfileEmbedding
                    {
                        ProfileId = profile.Id,
                        EmbeddingVector = JsonSerializer.Serialize(embedResult.Vector),
                        ModelName = embedResult.Model,
                        EmbeddingText = embeddingText
                    });
                }
                else
                {
                    existing.EmbeddingVector = JsonSerializer.Serialize(embedResult.Vector);
                    existing.ModelName = embedResult.Model;
                    existing.EmbeddingText = embeddingText;
                    existing.GeneratedAt = DateTime.UtcNow;
                }
                await db.SaveChangesAsync();
            }

            logger.LogInformation("Resume {ResumeId} processed successfully", resumeId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing resume {ResumeId}", resumeId);
            var resume = await db.Resumes.FindAsync(resumeId);
            if (resume is not null)
            {
                resume.ParseStatus = "Failed";
                resume.ParseError = ex.Message;
                await db.SaveChangesAsync();
            }
        }
    }

    private static DateOnly? ParseDate(string? s)
    {
        if (s is null) return null;
        foreach (var fmt in new[] { "yyyy-MM", "yyyy-MM-dd", "yyyy" })
            if (DateOnly.TryParseExact(s, fmt, null, System.Globalization.DateTimeStyles.None, out var d)) return d;
        return null;
    }

    private static string BuildEmbeddingText(ParseResumeResponse r)
    {
        var skills = string.Join(", ", r.Skills.Select(s => s.Name));
        var companies = string.Join(", ", r.Experience.Select(e => $"{e.Title} at {e.Company}"));
        return $"{r.Summary} Skills: {skills}. Experience: {companies}. Years: {r.TotalYearsExperience}.";
    }
}
