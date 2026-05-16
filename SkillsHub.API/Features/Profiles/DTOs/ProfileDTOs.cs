namespace SkillsHub.API.Features.Profiles.DTOs;

public record SkillDto(int Id, string Name, string? Category, int ProficiencyLevel, decimal? YearsExperience, bool IsEndorsed);
public record ExperienceDto(string CompanyName, string JobTitle, string? StartDate, string? EndDate, bool IsCurrent, string? Description, List<string> TechStack);
public record ProjectDto(string Name, string? Description, List<string> TechStack, string? GitHubUrl);
public record EducationDto(string Institution, string? Degree, string? FieldOfStudy, int? GraduationYear);
public record CertificationDto(string Name, string? IssuingOrganization, string? CredentialId, string? CredentialUrl, string? IssueDate, string? ExpiryDate);

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
    string? Location,
    string? Availability,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<SkillDto> Skills,
    List<ExperienceDto> Experience,
    List<ProjectDto> Projects,
    List<EducationDto> Education,
    List<CertificationDto> Certifications
);

public record ProfileSummaryResponse(
    Guid Id,
    string FullName,
    string? CurrentTitle,
    string? Department,
    decimal? YearsOfExperience,
    string? Summary,
    List<string> TopSkills
);

public record UpdateProfileRequest(
    string? FullName,
    string? CurrentTitle,
    string? Department,
    string? LinkedInUrl,
    string? Location,
    string? Availability
);

public record UpdateSkillsRequest(List<SkillEdit> Skills);
public record SkillEdit(string Name, string? Category, int Proficiency, decimal? Years);
