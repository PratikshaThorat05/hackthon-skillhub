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

    public async Task<(bool Success, string Error, ResumeUploadResponse? Response)> UploadForEmployeeAsync(IFormFile file, string employeeEmail)
    {
        if (!AllowedTypes.Contains(file.ContentType))
            return (false, "Only PDF, DOCX, and TXT files are allowed", null);

        if (file.Length > 5 * 1024 * 1024)
            return (false, "File size must be under 5MB", null);

        // Get or create the employee user
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == employeeEmail);
        if (user is null)
        {
            user = new User
            {
                Email = employeeEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                Role = "Employee"
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }

        return await UploadAsync(file, user.Id);
    }

    public async Task<(bool Success, string Error, ResumeUploadResponse? Response)> UploadFromTextAsync(string profileText, Guid userId)
    {
        if (string.IsNullOrWhiteSpace(profileText) || profileText.Length < 50)
            return (false, "Profile text is too short. Please paste more content.", null);

        var previous = await db.Resumes.Where(r => r.UserId == userId && r.IsActive).ToListAsync();
        previous.ForEach(r => r.IsActive = false);

        var resume = new Resume
        {
            UserId = userId,
            FileName = "Pasted Profile",
            StoragePath = "_pasted_",
            FileSizeBytes = profileText.Length,
            ContentType = "text/plain"
        };
        db.Resumes.Add(resume);
        await db.SaveChangesAsync();

        _ = Task.Run(() => ProcessTextAsync(resume.Id, userId, profileText));

        return (true, string.Empty, new ResumeUploadResponse(resume.Id, "Pasted Profile", resume.ParseStatus, "Profile text received. AI is extracting your data..."));
    }

    public async Task<(bool Success, string Error, ResumeUploadResponse? Response)> UploadTextForEmployeeAsync(string profileText, string employeeEmail)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == employeeEmail);
        if (user is null)
        {
            user = new User { Email = employeeEmail, PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), Role = "Employee" };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }
        return await UploadFromTextAsync(profileText, user.Id);
    }

    private async Task ProcessTextAsync(Guid resumeId, Guid userId, string profileText)
    {
        using var serviceScope = scopeFactory.CreateScope();
        var scopedDb = serviceScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var scopedAi = serviceScope.ServiceProvider.GetRequiredService<IAIGatewayService>();
        try
        {
            var resume = await scopedDb.Resumes.FindAsync(resumeId);
            if (resume is null) return;
            resume.ParseStatus = "Processing";
            await scopedDb.SaveChangesAsync();

            var profile = await scopedDb.EmployeeProfiles
                .Include(p => p.Skills).Include(p => p.Experiences)
                .Include(p => p.Projects).Include(p => p.Educations).Include(p => p.Certifications)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile is null)
            {
                var user = await scopedDb.Users.FindAsync(userId);
                profile = new EmployeeProfile { UserId = userId, FullName = user?.Email ?? "Unknown" };
                scopedDb.EmployeeProfiles.Add(profile);
                await scopedDb.SaveChangesAsync();
            }

            var parseResult = await scopedAi.ParseResumeAsync(new ParseResumeRequest(profileText, profile.Id.ToString()));

            if (parseResult is null)
            {
                resume.ParseStatus = "Failed";
                resume.ParseError = "AI service unavailable";
                await scopedDb.SaveChangesAsync();
                return;
            }

            await ApplyParseResultAsync(profile, parseResult, scopedDb, scopedAi);
            resume.ParseStatus = "Done";
            resume.ParsedAt = DateTime.UtcNow;
            await scopedDb.SaveChangesAsync();
            logger.LogInformation("Pasted profile processed for user {UserId}", userId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing pasted profile {ResumeId}", resumeId);
            using var errScope = scopeFactory.CreateScope();
            var errDb = errScope.ServiceProvider.GetRequiredService<AppDbContext>();
            var resume = await errDb.Resumes.FindAsync(resumeId);
            if (resume is not null) { resume.ParseStatus = "Failed"; resume.ParseError = ex.Message; await errDb.SaveChangesAsync(); }
        }
    }

    public async Task<(bool Success, string Error, ResumeUploadResponse? Response)> UploadFromLinkedInAsync(string linkedInUrl, Guid userId)
    {
        if (string.IsNullOrWhiteSpace(linkedInUrl) || !linkedInUrl.Contains("linkedin.com"))
            return (false, "Please provide a valid LinkedIn profile URL (e.g. https://linkedin.com/in/username)", null);

        var previous = await db.Resumes.Where(r => r.UserId == userId && r.IsActive).ToListAsync();
        previous.ForEach(r => r.IsActive = false);

        var resume = new Resume
        {
            UserId = userId,
            FileName = "LinkedIn Profile",
            StoragePath = linkedInUrl,
            FileSizeBytes = 0,
            ContentType = "application/x-linkedin"
        };
        db.Resumes.Add(resume);
        await db.SaveChangesAsync();

        _ = Task.Run(() => ProcessLinkedInAsync(resume.Id, userId, linkedInUrl));

        return (true, string.Empty, new ResumeUploadResponse(resume.Id, "LinkedIn Profile", resume.ParseStatus, "LinkedIn profile import started. AI is extracting your data..."));
    }

    public async Task<(bool Success, string Error, ResumeUploadResponse? Response)> UploadLinkedInForEmployeeAsync(string linkedInUrl, string employeeEmail)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == employeeEmail);
        if (user is null)
        {
            user = new User { Email = employeeEmail, PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), Role = "Employee" };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }
        return await UploadFromLinkedInAsync(linkedInUrl, user.Id);
    }

    private async Task ProcessLinkedInAsync(Guid resumeId, Guid userId, string linkedInUrl)
    {
        using var serviceScope = scopeFactory.CreateScope();
        var scopedDb = serviceScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var scopedAi = serviceScope.ServiceProvider.GetRequiredService<IAIGatewayService>();
        try
        {
            var resume = await scopedDb.Resumes.FindAsync(resumeId);
            if (resume is null) return;
            resume.ParseStatus = "Processing";
            await scopedDb.SaveChangesAsync();

            var profile = await scopedDb.EmployeeProfiles
                .Include(p => p.Skills).Include(p => p.Experiences)
                .Include(p => p.Projects).Include(p => p.Educations).Include(p => p.Certifications)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile is null)
            {
                var user = await scopedDb.Users.FindAsync(userId);
                profile = new EmployeeProfile { UserId = userId, FullName = user?.Email ?? "Unknown" };
                scopedDb.EmployeeProfiles.Add(profile);
                await scopedDb.SaveChangesAsync();
            }

            var (parseResult, parseError) = await scopedAi.ParseLinkedInAsync(new Infrastructure.AI.Models.LinkedInParseRequest(linkedInUrl));

            if (parseResult is null)
            {
                resume.ParseStatus = "Failed";
                resume.ParseError = parseError ?? "LinkedIn parsing failed";
                await scopedDb.SaveChangesAsync();
                return;
            }

            await ApplyParseResultAsync(profile, parseResult, scopedDb, scopedAi);

            resume.ParseStatus = "Done";
            resume.ParsedAt = DateTime.UtcNow;
            await scopedDb.SaveChangesAsync();
            logger.LogInformation("LinkedIn profile {Url} processed for user {UserId}", linkedInUrl, userId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing LinkedIn profile {ResumeId}", resumeId);
            using var errScope = scopeFactory.CreateScope();
            var errDb = errScope.ServiceProvider.GetRequiredService<AppDbContext>();
            var resume = await errDb.Resumes.FindAsync(resumeId);
            if (resume is not null) { resume.ParseStatus = "Failed"; resume.ParseError = ex.Message; await errDb.SaveChangesAsync(); }
        }
    }

    public async Task<(bool Success, string Error, ResumeUploadResponse? Response)> UploadFromGitHubAsync(string gitHubUrl, Guid userId)
    {
        if (string.IsNullOrWhiteSpace(gitHubUrl) || !gitHubUrl.Contains("github"))
            return (false, "Please provide a valid GitHub profile URL (e.g. https://github.com/username)", null);

        var previous = await db.Resumes.Where(r => r.UserId == userId && r.IsActive).ToListAsync();
        previous.ForEach(r => r.IsActive = false);

        var resume = new Resume
        {
            UserId = userId,
            FileName = "GitHub Profile",
            StoragePath = gitHubUrl,
            FileSizeBytes = 0,
            ContentType = "application/x-github"
        };
        db.Resumes.Add(resume);
        await db.SaveChangesAsync();

        _ = Task.Run(() => ProcessGitHubAsync(resume.Id, userId, gitHubUrl));

        return (true, string.Empty, new ResumeUploadResponse(resume.Id, "GitHub Profile", resume.ParseStatus, "GitHub profile import started. AI is inferring your skills..."));
    }

    public async Task<(bool Success, string Error, ResumeUploadResponse? Response)> UploadGitHubForEmployeeAsync(string gitHubUrl, string employeeEmail)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == employeeEmail);
        if (user is null)
        {
            user = new User { Email = employeeEmail, PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), Role = "Employee" };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }
        return await UploadFromGitHubAsync(gitHubUrl, user.Id);
    }

    private async Task ProcessGitHubAsync(Guid resumeId, Guid userId, string gitHubUrl)
    {
        using var serviceScope = scopeFactory.CreateScope();
        var scopedDb = serviceScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var scopedAi = serviceScope.ServiceProvider.GetRequiredService<IAIGatewayService>();
        try
        {
            var resume = await scopedDb.Resumes.FindAsync(resumeId);
            if (resume is null) return;
            resume.ParseStatus = "Processing";
            await scopedDb.SaveChangesAsync();

            var profile = await scopedDb.EmployeeProfiles
                .Include(p => p.Skills).Include(p => p.Experiences)
                .Include(p => p.Projects).Include(p => p.Educations).Include(p => p.Certifications)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile is null)
            {
                var user = await scopedDb.Users.FindAsync(userId);
                profile = new EmployeeProfile { UserId = userId, FullName = user?.Email ?? "Unknown" };
                scopedDb.EmployeeProfiles.Add(profile);
                await scopedDb.SaveChangesAsync();
            }

            var (parseResult, parseError) = await scopedAi.ParseGitHubAsync(new Infrastructure.AI.Models.GitHubParseRequest(gitHubUrl));

            if (parseResult is null)
            {
                resume.ParseStatus = "Failed";
                resume.ParseError = parseError ?? "GitHub parsing failed";
                await scopedDb.SaveChangesAsync();
                return;
            }

            await ApplyParseResultAsync(profile, parseResult, scopedDb, scopedAi);
            resume.ParseStatus = "Done";
            resume.ParsedAt = DateTime.UtcNow;
            await scopedDb.SaveChangesAsync();
            logger.LogInformation("GitHub profile {Url} processed for user {UserId}", gitHubUrl, userId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing GitHub profile {ResumeId}", resumeId);
            using var errScope = scopeFactory.CreateScope();
            var errDb = errScope.ServiceProvider.GetRequiredService<AppDbContext>();
            var resume = await errDb.Resumes.FindAsync(resumeId);
            if (resume is not null) { resume.ParseStatus = "Failed"; resume.ParseError = ex.Message; await errDb.SaveChangesAsync(); }
        }
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
                .Include(p => p.Projects).Include(p => p.Educations).Include(p => p.Certifications)
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

            await ApplyParseResultAsync(profile, parseResult, db, ai);

            resume.ParseStatus = "Done";
            resume.ParsedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

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

    private static async Task ApplyParseResultAsync(EmployeeProfile profile, ParseResumeResponse parseResult, AppDbContext db, IAIGatewayService ai)
    {
        profile.Summary = parseResult.Summary;
        profile.YearsOfExperience = parseResult.TotalYearsExperience;

        db.EmployeeSkills.RemoveRange(profile.Skills);
        foreach (var s in parseResult.Skills)
        {
            var skill = await db.Skills.FirstOrDefaultAsync(sk => sk.Name == s.Name)
                ?? new Skill { Name = s.Name, Category = s.Category };
            if (skill.Id == 0) { db.Skills.Add(skill); await db.SaveChangesAsync(); }
            db.EmployeeSkills.Add(new EmployeeSkill { ProfileId = profile.Id, SkillId = skill.Id, ProficiencyLevel = s.Proficiency, YearsExperience = s.Years });
        }

        db.WorkExperiences.RemoveRange(profile.Experiences);
        int order = 0;
        foreach (var exp in parseResult.Experience)
            db.WorkExperiences.Add(new WorkExperience { ProfileId = profile.Id, CompanyName = exp.Company, JobTitle = exp.Title, StartDate = ParseDate(exp.StartDate), EndDate = ParseDate(exp.EndDate), IsCurrent = exp.IsCurrent, Description = exp.Description, TechStack = JsonSerializer.Serialize(exp.TechStack), DisplayOrder = order++ });

        db.Projects.RemoveRange(profile.Projects);
        foreach (var proj in parseResult.Projects)
            db.Projects.Add(new Project { ProfileId = profile.Id, Name = proj.Name, Description = proj.Description, TechStack = JsonSerializer.Serialize(proj.TechStack), GitHubUrl = proj.GitHubUrl });

        db.Educations.RemoveRange(profile.Educations);
        foreach (var edu in parseResult.Education)
            db.Educations.Add(new Education { ProfileId = profile.Id, Institution = edu.Institution, Degree = edu.Degree, FieldOfStudy = edu.FieldOfStudy, GraduationYear = edu.GraduationYear });

        db.Certifications.RemoveRange(profile.Certifications);
        foreach (var cert in parseResult.Certifications)
            db.Certifications.Add(new Certification { ProfileId = profile.Id, Name = cert.Name, IssuingOrganization = cert.IssuingOrganization, CredentialId = cert.CredentialId, CredentialUrl = cert.CredentialUrl, IssueDate = ParseDate(cert.IssueDate), ExpiryDate = ParseDate(cert.ExpiryDate) });

        profile.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var embeddingText = BuildEmbeddingText(parseResult);
        var embedResult = await ai.EmbedProfileAsync(new EmbedProfileRequest(profile.Id.ToString(), embeddingText));
        if (embedResult is not null)
        {
            var existing = await db.ProfileEmbeddings.FirstOrDefaultAsync(pe => pe.ProfileId == profile.Id);
            if (existing is null)
                db.ProfileEmbeddings.Add(new ProfileEmbedding { ProfileId = profile.Id, EmbeddingVector = JsonSerializer.Serialize(embedResult.Vector), ModelName = embedResult.Model, EmbeddingText = embeddingText });
            else { existing.EmbeddingVector = JsonSerializer.Serialize(embedResult.Vector); existing.ModelName = embedResult.Model; existing.EmbeddingText = embeddingText; existing.GeneratedAt = DateTime.UtcNow; }
            await db.SaveChangesAsync();
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
        var projects = string.Join(", ", r.Projects.Select(p => p.Name));
        var certs = string.Join(", ", r.Certifications.Select(c => c.IssuingOrganization is not null ? $"{c.Name} ({c.IssuingOrganization})" : c.Name));
        var sb = new System.Text.StringBuilder();
        sb.Append(r.Summary);
        sb.Append($" Skills: {skills}.");
        if (!string.IsNullOrEmpty(companies)) sb.Append($" Experience: {companies}.");
        if (!string.IsNullOrEmpty(projects)) sb.Append($" Projects: {projects}.");
        if (!string.IsNullOrEmpty(certs)) sb.Append($" Certifications: {certs}.");
        sb.Append($" Total experience: {r.TotalYearsExperience} years.");
        return sb.ToString();
    }
}
