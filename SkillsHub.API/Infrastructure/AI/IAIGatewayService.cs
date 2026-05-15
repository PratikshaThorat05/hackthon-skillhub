using SkillsHub.API.Infrastructure.AI.Models;

namespace SkillsHub.API.Infrastructure.AI;

public interface IAIGatewayService
{
    Task<ParseResumeResponse?> ParseResumeAsync(ParseResumeRequest request, CancellationToken ct = default);
    Task<(ParseResumeResponse? Result, string? Error)> ParseLinkedInAsync(LinkedInParseRequest request, CancellationToken ct = default);
    Task<EmbedProfileResponse?> EmbedProfileAsync(EmbedProfileRequest request, CancellationToken ct = default);
    Task<SearchAIResponse?> SearchAsync(SearchAIRequest request, CancellationToken ct = default);
    Task<ExplainMatchResponse?> ExplainMatchAsync(ExplainMatchRequest request, CancellationToken ct = default);
    Task<bool> RebuildIndexAsync(RebuildIndexRequest request, CancellationToken ct = default);
}
