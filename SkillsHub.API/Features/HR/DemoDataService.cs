using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SkillsHub.API.Infrastructure.AI;
using SkillsHub.API.Infrastructure.AI.Models;
using SkillsHub.API.Infrastructure.Data;
using SkillsHub.API.Infrastructure.Data.Entities;

namespace SkillsHub.API.Features.HR;

public class DemoDataService(AppDbContext db, IAIGatewayService ai, ILogger<DemoDataService> logger)
{
    private static readonly List<DemoProfile> _demos =
    [
        new("Sarah Chen", "Senior React Developer", "Engineering", 6m,
            "Senior frontend engineer with 6 years of React and TypeScript experience. Strong background in building scalable SPAs and design systems.",
            [("React", "Frontend", 5, 6m), ("TypeScript", "Frontend", 5, 5m), ("JavaScript", "Frontend", 5, 6m), ("Redux", "Frontend", 4, 4m), ("CSS/SCSS", "Frontend", 4, 6m), ("Node.js", "Backend", 3, 3m), ("GraphQL", "Backend", 4, 3m), ("AWS", "Cloud", 3, 2m)],
            [("TechCorp", "Senior React Developer", "2021-03", null, true, "Led frontend architecture for SaaS platform serving 50k users.", ["React", "TypeScript", "GraphQL"]),
             ("StartupXYZ", "React Developer", "2018-06", "2021-02", false, "Built customer-facing dashboard from scratch.", ["React", "Redux", "Node.js"])],
            [("AWS Certified Developer", "Amazon Web Services", "2023-01", "2026-01"), ("Meta Frontend Developer Certification", "Meta", "2022-06", null)]),

        new("Marcus Johnson", "DevOps Engineer", "Infrastructure", 8m,
            "DevOps engineer specializing in Kubernetes orchestration and CI/CD pipeline automation. Expert in AWS and GCP cloud infrastructure.",
            [("Kubernetes", "DevOps", 5, 6m), ("Docker", "DevOps", 5, 7m), ("AWS", "Cloud", 5, 6m), ("Terraform", "DevOps", 4, 4m), ("Python", "Backend", 4, 5m), ("Go", "Backend", 3, 2m), ("Jenkins", "DevOps", 4, 5m), ("Prometheus", "DevOps", 4, 3m)],
            [("CloudNative Inc", "Senior DevOps Engineer", "2019-08", null, true, "Managed 200+ microservices Kubernetes cluster on AWS EKS.", ["Kubernetes", "Terraform", "AWS"]),
             ("BigEnterprise", "DevOps Engineer", "2016-01", "2019-07", false, "Automated CI/CD pipelines reducing deployment time by 70%.", ["Jenkins", "Docker", "Python"])],
            [("Certified Kubernetes Administrator", "CNCF", "2022-03", "2025-03"), ("AWS Solutions Architect Professional", "Amazon Web Services", "2021-09", "2024-09")]),

        new("Priya Sharma", "Full Stack Developer", "Product", 4m,
            "Full stack developer with expertise in Python Django backend and React frontend. Passionate about building clean APIs and user-centric web applications.",
            [("Python", "Backend", 4, 4m), ("Django", "Backend", 4, 4m), ("React", "Frontend", 4, 3m), ("PostgreSQL", "Database", 4, 4m), ("Docker", "DevOps", 3, 2m), ("REST APIs", "Backend", 5, 4m), ("Redis", "Database", 3, 2m)],
            [("FinTech Solutions", "Full Stack Developer", "2021-06", null, true, "Built payment processing platform handling $2M daily transactions.", ["Python", "Django", "PostgreSQL", "React"]),
             ("Agency", "Junior Developer", "2020-01", "2021-05", false, "Developed client web applications.", ["Python", "JavaScript"])],
            [("Django REST Framework Certified", "Django Software Foundation", "2022-01", null)]),

        new("Alex Rivera", "Machine Learning Engineer", "AI/ML", 5m,
            "ML engineer with strong background in deep learning, NLP, and computer vision. Experience deploying models to production at scale.",
            [("Python", "Backend", 5, 5m), ("Machine Learning", "AI/ML", 5, 5m), ("Deep Learning", "AI/ML", 4, 3m), ("PyTorch", "AI/ML", 4, 3m), ("TensorFlow", "AI/ML", 4, 4m), ("NLP", "AI/ML", 4, 3m), ("AWS", "Cloud", 3, 2m), ("SQL", "Database", 3, 3m)],
            [("AI Startup", "ML Engineer", "2020-09", null, true, "Developed NLP pipeline for customer sentiment analysis with 94% accuracy.", ["Python", "PyTorch", "AWS"]),
             ("ResearchLab", "Data Scientist", "2019-01", "2020-08", false, "Published 2 papers on transformer fine-tuning.", ["Python", "TensorFlow"])],
            [("Google Professional ML Engineer", "Google Cloud", "2022-11", "2024-11"), ("AWS Machine Learning Specialty", "Amazon Web Services", "2023-02", "2026-02")]),

        new("Emily Watson", "Backend Engineer", "Engineering", 7m,
            "Experienced Java/Spring backend engineer with expertise in microservices architecture and high-performance distributed systems.",
            [("Java", "Backend", 5, 7m), ("Spring Boot", "Backend", 5, 6m), ("Microservices", "Backend", 5, 5m), ("Kafka", "Backend", 4, 4m), ("PostgreSQL", "Database", 4, 5m), ("Docker", "DevOps", 4, 4m), ("Kubernetes", "DevOps", 3, 3m), ("AWS", "Cloud", 3, 2m)],
            [("Enterprise Tech", "Senior Backend Engineer", "2018-04", null, true, "Designed event-driven microservices handling 1M+ events/day.", ["Java", "Kafka", "Kubernetes"]),
             ("Banking Corp", "Software Engineer", "2017-01", "2018-03", false, "Core banking transaction processing system.", ["Java", "Spring Boot", "Oracle"])],
            [("Oracle Certified Professional Java SE", "Oracle", "2020-05", null), ("Spring Professional Certification", "VMware", "2021-03", null)]),

        new("David Kim", "Data Engineer", "Analytics", 5m,
            "Data engineer specializing in building large-scale ETL pipelines and data warehouses. Expert in Spark, Airflow, and cloud data platforms.",
            [("Python", "Backend", 4, 5m), ("Apache Spark", "Data", 5, 4m), ("Airflow", "Data", 4, 3m), ("SQL", "Database", 5, 5m), ("dbt", "Data", 4, 2m), ("Snowflake", "Database", 4, 3m), ("AWS", "Cloud", 4, 3m), ("Scala", "Backend", 3, 2m)],
            [("DataPlatform Inc", "Senior Data Engineer", "2021-02", null, true, "Built petabyte-scale data lake on AWS reducing query time by 60%.", ["Spark", "Airflow", "Snowflake"]),
             ("Analytics Co", "Data Engineer", "2019-06", "2021-01", false, "Developed ETL pipelines for marketing analytics platform.", ["Python", "SQL", "AWS"])],
            [("Databricks Certified Associate Developer", "Databricks", "2022-07", "2024-07"), ("Snowflake SnowPro Core", "Snowflake", "2023-01", null)]),

        new("Olivia Martinez", "iOS Developer", "Mobile", 4m,
            "iOS developer with expertise in Swift, SwiftUI, and native iOS frameworks. Published 3 apps with 100k+ combined downloads.",
            [("Swift", "Mobile", 5, 4m), ("SwiftUI", "Mobile", 4, 3m), ("Xcode", "Mobile", 5, 4m), ("iOS SDK", "Mobile", 5, 4m), ("REST APIs", "Backend", 4, 4m), ("Core Data", "Database", 4, 3m), ("Firebase", "Backend", 3, 2m)],
            [("MobileFirst Studio", "iOS Developer", "2021-03", null, true, "Lead developer for fitness app with 50k monthly active users.", ["Swift", "SwiftUI", "Firebase"]),
             ("Freelance", "iOS Developer", "2020-01", "2021-02", false, "Developed custom iOS apps for SMB clients.", ["Swift", "Core Data"])],
            [("Apple Certified iOS Developer", "Apple", "2022-09", null)]),

        new("Raj Patel", "Cloud Architect", "Infrastructure", 10m,
            "Cloud architect with 10 years of experience designing and migrating enterprise workloads to AWS and Azure. Certified in both platforms.",
            [("AWS", "Cloud", 5, 8m), ("Azure", "Cloud", 5, 6m), ("Terraform", "DevOps", 5, 5m), ("Kubernetes", "DevOps", 4, 4m), ("Python", "Backend", 4, 6m), ("Networking", "Infrastructure", 5, 10m), ("Security", "Infrastructure", 4, 5m)],
            [("Consulting Firm", "Cloud Architect", "2017-01", null, true, "Led cloud migration of 200+ applications saving $5M annually.", ["AWS", "Azure", "Terraform"]),
             ("IT Services", "Senior Cloud Engineer", "2014-06", "2016-12", false, "Built multi-region AWS infrastructure for e-commerce platform.", ["AWS", "Python"])],
            [("AWS Solutions Architect Professional", "Amazon Web Services", "2023-04", "2026-04"), ("Microsoft Azure Solutions Architect Expert", "Microsoft", "2022-08", "2024-08"), ("Certified Kubernetes Administrator", "CNCF", "2021-05", "2024-05")]),

        new("Zoe Thompson", "Security Engineer", "Security", 6m,
            "Application security engineer specializing in penetration testing, secure code review, and DevSecOps practices.",
            [("Python", "Backend", 4, 5m), ("Security Testing", "Security", 5, 6m), ("OWASP", "Security", 5, 6m), ("Burp Suite", "Security", 5, 5m), ("AWS", "Cloud", 3, 3m), ("Docker", "DevOps", 3, 3m), ("Go", "Backend", 3, 2m)],
            [("CyberSec Corp", "Senior Security Engineer", "2020-07", null, true, "Conducted 50+ penetration tests for Fortune 500 clients.", ["Python", "Burp Suite", "AWS"]),
             ("Tech Company", "Security Analyst", "2018-03", "2020-06", false, "Implemented SIEM solution and incident response playbooks.", ["Python", "OWASP"])],
            [("OSCP - Offensive Security Certified Professional", "Offensive Security", "2021-06", null), ("CEH - Certified Ethical Hacker", "EC-Council", "2020-01", "2023-01")]),

        new("Liam Foster", "Android Developer", "Mobile", 5m,
            "Android developer with strong Kotlin and Jetpack Compose skills. Experience building high-quality native apps for fintech and e-commerce.",
            [("Kotlin", "Mobile", 5, 5m), ("Android SDK", "Mobile", 5, 5m), ("Jetpack Compose", "Mobile", 4, 3m), ("Java", "Backend", 3, 4m), ("REST APIs", "Backend", 4, 5m), ("Firebase", "Backend", 4, 3m), ("Room DB", "Database", 4, 4m)],
            [("Fintech App Co", "Senior Android Developer", "2020-09", null, true, "Built Android app for digital wallet serving 200k users.", ["Kotlin", "Jetpack Compose", "Firebase"]),
             ("E-commerce Platform", "Android Developer", "2019-01", "2020-08", false, "Developed shopping app with 50k+ downloads.", ["Kotlin", "Android SDK"])],
            [("Google Associate Android Developer", "Google", "2021-03", "2024-03")])
    ];

    public async Task<int> SeedDemoProfilesAsync()
    {
        int created = 0;
        foreach (var demo in _demos)
        {
            // Skip if demo user already exists
            if (await db.Users.AnyAsync(u => u.Email == $"{demo.Name.ToLower().Replace(" ", ".")}@demo.skillshub.com"))
                continue;

            var user = new User
            {
                Email = $"{demo.Name.ToLower().Replace(" ", ".")}@demo.skillshub.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo@1234"),
                Role = "Employee"
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();

            var profile = new EmployeeProfile
            {
                UserId = user.Id,
                FullName = demo.Name,
                CurrentTitle = demo.Title,
                Department = demo.Department,
                YearsOfExperience = demo.YearsExp,
                Summary = demo.Summary,
                Status = "Approved"
            };
            db.EmployeeProfiles.Add(profile);
            await db.SaveChangesAsync();

            // Add skills
            foreach (var (name, category, level, years) in demo.Skills)
            {
                var skill = await db.Skills.FirstOrDefaultAsync(s => s.Name == name)
                    ?? new Skill { Name = name, Category = category };
                if (skill.Id == 0) { db.Skills.Add(skill); await db.SaveChangesAsync(); }
                db.EmployeeSkills.Add(new EmployeeSkill { ProfileId = profile.Id, SkillId = skill.Id, ProficiencyLevel = level, YearsExperience = years });
            }

            // Add experience
            int order = 0;
            foreach (var (company, title, start, end, isCurrent, desc, tech) in demo.Experience)
            {
                db.WorkExperiences.Add(new WorkExperience
                {
                    ProfileId = profile.Id,
                    CompanyName = company, JobTitle = title,
                    StartDate = ParseDate(start), EndDate = ParseDate(end),
                    IsCurrent = isCurrent, Description = desc,
                    TechStack = JsonSerializer.Serialize(tech),
                    DisplayOrder = order++
                });
            }

            // Add certifications
            foreach (var (certName, org, issueDate, expiryDate) in demo.Certifications)
            {
                db.Certifications.Add(new Certification
                {
                    ProfileId = profile.Id,
                    Name = certName,
                    IssuingOrganization = org,
                    IssueDate = ParseDate(issueDate),
                    ExpiryDate = ParseDate(expiryDate)
                });
            }

            await db.SaveChangesAsync();

            // Generate embedding
            try
            {
                var skills = string.Join(", ", demo.Skills.Select(s => s.Name));
                var exp = string.Join(", ", demo.Experience.Select(e => $"{e.Title} at {e.Company}"));
                var certs = string.Join(", ", demo.Certifications.Select(c => $"{c.Name} ({c.Org})"));
                var embText = $"{demo.Summary} Skills: {skills}. Experience: {exp}. Certifications: {certs}. Total experience: {demo.YearsExp} years.";

                var embedResult = await ai.EmbedProfileAsync(new EmbedProfileRequest(profile.Id.ToString(), embText));
                if (embedResult is not null)
                {
                    db.ProfileEmbeddings.Add(new ProfileEmbedding
                    {
                        ProfileId = profile.Id,
                        EmbeddingVector = JsonSerializer.Serialize(embedResult.Vector),
                        ModelName = embedResult.Model,
                        EmbeddingText = embText
                    });
                    await db.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to generate embedding for demo profile {Name}", demo.Name);
            }

            created++;
        }
        return created;
    }

    private static DateOnly? ParseDate(string? s)
    {
        if (s is null) return null;
        foreach (var fmt in new[] { "yyyy-MM", "yyyy-MM-dd", "yyyy" })
            if (DateOnly.TryParseExact(s, fmt, null, System.Globalization.DateTimeStyles.None, out var d)) return d;
        return null;
    }

    private record DemoProfile(
        string Name, string Title, string Department, decimal YearsExp, string Summary,
        List<(string Name, string Category, int Level, decimal Years)> Skills,
        List<(string Company, string Title, string? Start, string? End, bool IsCurrent, string? Desc, List<string> Tech)> Experience,
        List<(string Name, string Org, string? IssueDate, string? ExpiryDate)> Certifications
    );
}
