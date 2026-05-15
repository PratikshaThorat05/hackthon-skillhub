namespace SkillsHub.API.Infrastructure.AI.Models;

public record ParseResumeRequest(string Text, string ProfileId);

public record ExtractedSkill(string Name, string? Category, int Proficiency, decimal? Years);
public record ExtractedExperience(string Company, string Title, string? StartDate, string? EndDate, bool IsCurrent, string? Description, List<string> TechStack);
public record ExtractedProject(string Name, string? Description, List<string> TechStack, string? GitHubUrl);
public record ExtractedEducation(string Institution, string? Degree, string? FieldOfStudy, int? GraduationYear);

public record ParseResumeResponse(
    string Summary,
    List<ExtractedSkill> Skills,
    List<ExtractedExperience> Experience,
    List<ExtractedProject> Projects,
    List<ExtractedEducation> Education,
    decimal TotalYearsExperience
);

public record EmbedProfileRequest(string ProfileId, string Text);
public record EmbedProfileResponse(List<float> Vector, string Model);

public record SearchAIRequest(string Query, int TopK = 10);
public record SearchAIMatch(string ProfileId, double Score, int Rank);
public record SearchAIResponse(List<SearchAIMatch> Results);

public record ExplainMatchRequest(string Query, string ProfileSummary, List<string> Skills, string Experience);
public record ExplainMatchResponse(string Reasoning);

public record RebuildIndexRequest(List<IndexEntry> Profiles);
public record IndexEntry(string ProfileId, List<float> Vector);
