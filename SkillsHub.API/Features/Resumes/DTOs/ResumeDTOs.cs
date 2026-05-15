namespace SkillsHub.API.Features.Resumes.DTOs;

public record ResumeUploadResponse(
    Guid ResumeId,
    string FileName,
    string Status,
    string Message
);

public record ResumeStatusResponse(
    Guid ResumeId,
    string FileName,
    string ParseStatus,
    DateTime UploadedAt,
    DateTime? ParsedAt,
    string? ParseError
);
