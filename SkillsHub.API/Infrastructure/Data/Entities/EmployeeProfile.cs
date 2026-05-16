namespace SkillsHub.API.Infrastructure.Data.Entities;

public class EmployeeProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? CurrentTitle { get; set; }
    public string? Department { get; set; }
    public decimal? YearsOfExperience { get; set; }
    public string? Summary { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? Location { get; set; }
    public string? Availability { get; set; } // Available | Busy | OnLeave
    public string Status { get; set; } = "Pending"; // Pending | Approved | Rejected
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<EmployeeSkill> Skills { get; set; } = [];
    public ICollection<WorkExperience> Experiences { get; set; } = [];
    public ICollection<Project> Projects { get; set; } = [];
    public ICollection<Education> Educations { get; set; } = [];
    public ICollection<Certification> Certifications { get; set; } = [];
    public ProfileEmbedding? Embedding { get; set; }
}
