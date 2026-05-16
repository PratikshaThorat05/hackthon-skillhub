namespace SkillsHub.API.Features.Resumes.DTOs;

public record LinkedInUploadRequest(string LinkedInUrl);
public record LinkedInHRUploadRequest(string EmployeeEmail, string LinkedInUrl);
public record GitHubUploadRequest(string GitHubUrl);
public record GitHubHRUploadRequest(string EmployeeEmail, string GitHubUrl);
public record ProfileTextUploadRequest(string ProfileText);
public record ProfileTextHRUploadRequest(string EmployeeEmail, string ProfileText);

public record ResumeUploadResponse(
    Guid ResumeId,
    string FileName,
    string Status,
    string Message
);

public class BulkUploadResult
{
    public string Email { get; set; } = "";
    public string FileName { get; set; } = "";
    public bool Success { get; set; }
    public string? Error { get; set; }
}

public record ResumeStatusResponse(
    Guid ResumeId,
    string FileName,
    string ParseStatus,
    DateTime UploadedAt,
    DateTime? ParsedAt,
    string? ParseError
);
