namespace SkillsHub.API.Features.HR.DTOs;

public record ProfileSummaryDto(
    Guid Id, Guid UserId, string Email, string FullName,
    string? CurrentTitle, string? Department,
    decimal? YearsOfExperience, string Status,
    int SkillCount, DateTime UpdatedAt
);

public record ApprovalRequest(string? Reason);

public record HRStatsResponse(
    int TotalProfiles, int PendingCount, int ApprovedCount,
    int TotalResumes, List<TopSkillDto> TopSkills
);

public record TopSkillDto(string SkillName, string? Category, int EmployeeCount);
