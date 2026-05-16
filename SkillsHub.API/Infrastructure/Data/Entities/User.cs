namespace SkillsHub.API.Infrastructure.Data.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Employee"; // Employee | HR | Admin
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public EmployeeProfile? Profile { get; set; }
    public ICollection<Resume> Resumes { get; set; } = [];
}
