namespace SkillsHub.API.Infrastructure.Data.Entities;

public class Resume
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public string ParseStatus { get; set; } = "Queued"; // Queued | Processing | Done | Failed
    public DateTime? ParsedAt { get; set; }
    public string? RawExtractedText { get; set; }
    public string? ParseError { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    public User User { get; set; } = null!;
}
