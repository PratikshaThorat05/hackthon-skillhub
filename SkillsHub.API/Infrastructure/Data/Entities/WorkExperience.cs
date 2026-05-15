namespace SkillsHub.API.Infrastructure.Data.Entities;

public class WorkExperience
{
    public int Id { get; set; }
    public Guid ProfileId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsCurrent { get; set; } = false;
    public string? Description { get; set; }
    public string? TechStack { get; set; } // JSON array string
    public int DisplayOrder { get; set; } = 0;

    public EmployeeProfile Profile { get; set; } = null!;
}
