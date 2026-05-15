using System.Net.Http.Json;
using SkillsHub.API.Infrastructure.AI.Models;

namespace SkillsHub.API.Infrastructure.AI;

public class AIGatewayService(HttpClient http, ILogger<AIGatewayService> logger) : IAIGatewayService
{
    public async Task<ParseResumeResponse?> ParseResumeAsync(ParseResumeRequest request, CancellationToken ct = default)
    {
        try
        {
            var response = await http.PostAsJsonAsync("/parse-resume", request, ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<ParseResumeResponse>(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to parse resume via AI service");
            return null;
        }
    }

    public async Task<(ParseResumeResponse? Result, string? Error)> ParseLinkedInAsync(LinkedInParseRequest request, CancellationToken ct = default)
    {
        try
        {
            var response = await http.PostAsJsonAsync("/parse-linkedin", request, ct);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(ct);
                // Extract the "detail" field from FastAPI's 422 response
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(body);
                    if (doc.RootElement.TryGetProperty("detail", out var detail))
                        return (null, detail.GetString());
                }
                catch { }
                return (null, $"LinkedIn parsing failed (HTTP {(int)response.StatusCode})");
            }
            var result = await response.Content.ReadFromJsonAsync<ParseResumeResponse>(ct);
            return (result, null);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to parse LinkedIn profile via AI service");
            return (null, "AI service unavailable");
        }
    }

    public async Task<EmbedProfileResponse?> EmbedProfileAsync(EmbedProfileRequest request, CancellationToken ct = default)
    {
        try
        {
            var response = await http.PostAsJsonAsync("/embed-profile", request, ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<EmbedProfileResponse>(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to embed profile via AI service");
            return null;
        }
    }

    public async Task<SearchAIResponse?> SearchAsync(SearchAIRequest request, CancellationToken ct = default)
    {
        try
        {
            var response = await http.PostAsJsonAsync("/search", request, ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<SearchAIResponse>(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to search via AI service");
            return null;
        }
    }

    public async Task<ExplainMatchResponse?> ExplainMatchAsync(ExplainMatchRequest request, CancellationToken ct = default)
    {
        try
        {
            var response = await http.PostAsJsonAsync("/explain-match", request, ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<ExplainMatchResponse>(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to explain match via AI service");
            return null;
        }
    }

    public async Task<bool> RebuildIndexAsync(RebuildIndexRequest request, CancellationToken ct = default)
    {
        try
        {
            var response = await http.PostAsJsonAsync("/rebuild-index", request, ct);
            response.EnsureSuccessStatusCode();
            logger.LogInformation("FAISS index rebuilt with {Count} profiles", request.Profiles.Count);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to rebuild AI index");
            return false;
        }
    }
}
