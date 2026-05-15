using Microsoft.EntityFrameworkCore;
using SkillsHub.API.Infrastructure.Data.Entities;

namespace SkillsHub.API.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<EmployeeProfile> EmployeeProfiles => Set<EmployeeProfile>();
    public DbSet<Resume> Resumes => Set<Resume>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<EmployeeSkill> EmployeeSkills => Set<EmployeeSkill>();
    public DbSet<WorkExperience> WorkExperiences => Set<WorkExperience>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Education> Educations => Set<Education>();
    public DbSet<ProfileEmbedding> ProfileEmbeddings => Set<ProfileEmbedding>();
    public DbSet<SearchHistory> SearchHistories => Set<SearchHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasDefaultValue("Employee");
        });

        modelBuilder.Entity<EmployeeProfile>(e =>
        {
            e.HasOne(p => p.User).WithOne(u => u.Profile)
             .HasForeignKey<EmployeeProfile>(p => p.UserId);
            e.HasIndex(p => p.Status);
        });

        modelBuilder.Entity<EmployeeSkill>(e =>
        {
            e.HasIndex(es => new { es.ProfileId, es.SkillId }).IsUnique();
            e.HasOne(es => es.Profile).WithMany(p => p.Skills).HasForeignKey(es => es.ProfileId);
            e.HasOne(es => es.Skill).WithMany(s => s.EmployeeSkills).HasForeignKey(es => es.SkillId);
        });

        modelBuilder.Entity<ProfileEmbedding>(e =>
        {
            e.HasOne(pe => pe.Profile).WithOne(p => p.Embedding)
             .HasForeignKey<ProfileEmbedding>(pe => pe.ProfileId);
        });

        modelBuilder.Entity<Skill>(e =>
        {
            e.HasIndex(s => s.Name).IsUnique();
        });

        // Seed default skills
        modelBuilder.Entity<Skill>().HasData(
            new Skill { Id = 1, Name = "C#", Category = "Backend" },
            new Skill { Id = 2, Name = "Python", Category = "Backend" },
            new Skill { Id = 3, Name = "JavaScript", Category = "Frontend" },
            new Skill { Id = 4, Name = "TypeScript", Category = "Frontend" },
            new Skill { Id = 5, Name = "React", Category = "Frontend", Aliases = "ReactJS,React.js" },
            new Skill { Id = 6, Name = "Angular", Category = "Frontend" },
            new Skill { Id = 7, Name = "Node.js", Category = "Backend", Aliases = "NodeJS,Node" },
            new Skill { Id = 8, Name = "SQL", Category = "Database" },
            new Skill { Id = 9, Name = "PostgreSQL", Category = "Database" },
            new Skill { Id = 10, Name = "MongoDB", Category = "Database" },
            new Skill { Id = 11, Name = "AWS", Category = "Cloud" },
            new Skill { Id = 12, Name = "Azure", Category = "Cloud" },
            new Skill { Id = 13, Name = "Docker", Category = "DevOps" },
            new Skill { Id = 14, Name = "Kubernetes", Category = "DevOps", Aliases = "K8s" },
            new Skill { Id = 15, Name = "Git", Category = "DevOps" },
            new Skill { Id = 16, Name = "Java", Category = "Backend" },
            new Skill { Id = 17, Name = "Go", Category = "Backend", Aliases = "Golang" },
            new Skill { Id = 18, Name = "Rust", Category = "Backend" },
            new Skill { Id = 19, Name = "Machine Learning", Category = "AI/ML", Aliases = "ML" },
            new Skill { Id = 20, Name = "Deep Learning", Category = "AI/ML" }
        );
    }
}
