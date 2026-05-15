namespace SkillsHub.API.Infrastructure.Data.Entities;

public class Certification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProfileId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? IssuingOrganization { get; set; }
    public string? CredentialId { get; set; }
    public string? CredentialUrl { get; set; }
    public DateOnly? IssueDate { get; set; }
    public DateOnly? ExpiryDate { get; set; }

    public EmployeeProfile Profile { get; set; } = null!;
}
