namespace SkillsHub.API.Infrastructure.Data.Entities;

public class Skill
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Aliases { get; set; }

    public ICollection<EmployeeSkill> EmployeeSkills { get; set; } = [];
}

public class EmployeeSkill
{
    public int Id { get; set; }
    public Guid ProfileId { get; set; }
    public int SkillId { get; set; }
    public int ProficiencyLevel { get; set; } = 3; // 1-5
    public decimal? YearsExperience { get; set; }
    public bool IsEndorsed { get; set; } = false;
    public string Source { get; set; } = "AI"; // AI | Self | HR

    public EmployeeProfile Profile { get; set; } = null!;
    public Skill Skill { get; set; } = null!;
}
