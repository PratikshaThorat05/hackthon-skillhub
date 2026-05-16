namespace SkillsHub.API.Infrastructure.Data.Entities;

public class Project
{
    public int Id { get; set; }
    public Guid ProfileId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? TechStack { get; set; } // JSON array string
    public string? GitHubUrl { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }

    public EmployeeProfile Profile { get; set; } = null!;
}
