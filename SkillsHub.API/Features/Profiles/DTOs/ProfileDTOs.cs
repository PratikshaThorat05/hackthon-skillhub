namespace SkillsHub.API.Features.Profiles.DTOs;

public record SkillDto(int Id, string Name, string? Category, int ProficiencyLevel, decimal? YearsExperience, bool IsEndorsed);
public record ExperienceDto(string CompanyName, string JobTitle, string? StartDate, string? EndDate, bool IsCurrent, string? Description, List<string> TechStack);
public record ProjectDto(string Name, string? Description, List<string> TechStack, string? GitHubUrl);
public record EducationDto(string Institution, string? Degree, string? FieldOfStudy, int? GraduationYear);

public record ProfileResponse(
    Guid Id,
    Guid UserId,
    string Email,
    string FullName,
    string? CurrentTitle,
    string? Department,
    decimal? YearsOfExperience,
    string? Summary,
    string? LinkedInUrl,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<SkillDto> Skills,
    List<ExperienceDto> Experience,
    List<ProjectDto> Projects,
    List<EducationDto> Education
);

public record UpdateProfileRequest(
    string? FullName,
    string? CurrentTitle,
    string? Department,
    string? LinkedInUrl
);
