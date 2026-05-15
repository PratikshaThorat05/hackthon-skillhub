namespace SkillsHub.API.Infrastructure.Data.Entities;

public class ProfileEmbedding
{
    public int Id { get; set; }
    public Guid ProfileId { get; set; }
    public string EmbeddingVector { get; set; } = string.Empty; // JSON float array
    public string? ModelName { get; set; }
    public string? EmbeddingText { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public EmployeeProfile Profile { get; set; } = null!;
}
