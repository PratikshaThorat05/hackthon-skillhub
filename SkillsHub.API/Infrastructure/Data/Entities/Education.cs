namespace SkillsHub.API.Infrastructure.Data.Entities;

public class Education
{
    public int Id { get; set; }
    public Guid ProfileId { get; set; }
    public string Institution { get; set; } = string.Empty;
    public string? Degree { get; set; }
    public string? FieldOfStudy { get; set; }
    public int? GraduationYear { get; set; }

    public EmployeeProfile Profile { get; set; } = null!;
}
