using Microsoft.EntityFrameworkCore;
using SkillsHub.API.Features.Search.DTOs;
using SkillsHub.API.Infrastructure.AI;
using SkillsHub.API.Infrastructure.AI.Models;
using SkillsHub.API.Infrastructure.Data;
using SkillsHub.API.Infrastructure.Data.Entities;

namespace SkillsHub.API.Features.Search;

public class SearchService(AppDbContext db, IAIGatewayService ai, ILogger<SearchService> logger)
{
    public async Task<SearchResponse> SearchAsync(SearchRequest req, Guid searchedBy)
    {
        // Call AI service for semantic search
        var aiResults = await ai.SearchAsync(new SearchAIRequest(req.Query, req.TopK));

        List<SearchResultItem> results = [];

        if (aiResults?.Results.Count > 0)
        {
            var profileIds = aiResults.Results.Select(r => Guid.Parse(r.ProfileId)).ToList();

            var profiles = await db.EmployeeProfiles
                .Include(p => p.Skills).ThenInclude(s => s.Skill)
                .Where(p => profileIds.Contains(p.Id) && p.Status != "Rejected")
                .ToListAsync();

            // Get reasoning for top 3 only (LLM cost control)
            int rank = 1;
            foreach (var aiMatch in aiResults.Results.Take(req.TopK))
            {
                var profile = profiles.FirstOrDefault(p => p.Id == Guid.Parse(aiMatch.ProfileId));
                if (profile is null) continue;

                string? reasoning = null;
                if (rank <= 3)
                {
                    var topSkillNames = profile.Skills
                        .OrderByDescending(s => s.ProficiencyLevel)
                        .Take(8)
                        .Select(s => s.Skill.Name)
                        .ToList();

                    var explainResult = await ai.ExplainMatchAsync(new ExplainMatchRequest(
                        req.Query,
                        profile.Summary ?? profile.FullName,
                        topSkillNames,
                        $"{profile.YearsOfExperience ?? 0} years experience, {profile.CurrentTitle}"
                    ));
                    reasoning = explainResult?.Reasoning;
                }

                results.Add(new SearchResultItem(
                    rank++,
                    Math.Round(aiMatch.Score * 100, 1),
                    profile.Id,
                    profile.FullName,
                    profile.CurrentTitle,
                    profile.Department,
                    profile.YearsOfExperience,
                    profile.Summary,
                    profile.Skills.OrderByDescending(s => s.ProficiencyLevel).Take(5).Select(s => s.Skill.Name).ToList(),
                    reasoning
                ));
            }
        }
        else
        {
            // Fallback: keyword-based search from SQL
            logger.LogWarning("AI search unavailable, falling back to keyword search");
            results = await KeywordFallbackAsync(req.Query);
        }

        // Log search (non-fatal)
        try
        {
            if (await db.Users.AnyAsync(u => u.Id == searchedBy))
            {
                db.SearchHistories.Add(new SearchHistory
                {
                    SearchedBy = searchedBy,
                    Query = req.Query,
                    ResultCount = results.Count,
                    TopMatchProfileId = results.FirstOrDefault()?.ProfileId
                });
                await db.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to save search history");
        }

        return new SearchResponse(req.Query, results.Count, results, DateTime.UtcNow);
    }

    private async Task<List<SearchResultItem>> KeywordFallbackAsync(string query)
    {
        var keywords = query.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);

        var profiles = await db.EmployeeProfiles
            .Include(p => p.Skills).ThenInclude(s => s.Skill)
            .Where(p => p.Status == "Approved")
            .ToListAsync();

        return profiles
            .Select(p => new
            {
                Profile = p,
                Score = keywords.Count(k =>
                    (p.Summary ?? "").ToLower().Contains(k) ||
                    (p.CurrentTitle ?? "").ToLower().Contains(k) ||
                    p.Skills.Any(s => s.Skill.Name.ToLower().Contains(k)))
            })
            .Where(x => x.Score > 0)
            .OrderByDescending(x => x.Score)
            .Take(10)
            .Select((x, i) => new SearchResultItem(
                i + 1, x.Score * 10.0, x.Profile.Id, x.Profile.FullName,
                x.Profile.CurrentTitle, x.Profile.Department, x.Profile.YearsOfExperience,
                x.Profile.Summary,
                x.Profile.Skills.OrderByDescending(s => s.ProficiencyLevel).Take(5).Select(s => s.Skill.Name).ToList(),
                null))
            .ToList();
    }
}
