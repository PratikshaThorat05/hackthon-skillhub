namespace SkillsHub.API.Infrastructure.Data.Entities;

public class SearchHistory
{
    public int Id { get; set; }
    public Guid SearchedBy { get; set; }
    public string Query { get; set; } = string.Empty;
    public int ResultCount { get; set; }
    public Guid? TopMatchProfileId { get; set; }
    public DateTime SearchedAt { get; set; } = DateTime.UtcNow;

    public User Searcher { get; set; } = null!;
}
