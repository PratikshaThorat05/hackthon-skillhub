using System.ComponentModel.DataAnnotations;

namespace SkillsHub.API.Features.Search.DTOs;

public record SearchRequest([Required, MinLength(3)] string Query, int TopK = 10);

public record SearchResultItem(
    int Rank,
    double Score,
    Guid ProfileId,
    string FullName,
    string? CurrentTitle,
    string? Department,
    decimal? YearsOfExperience,
    string? Summary,
    List<string> TopSkills,
    string? Reasoning
);

public record SearchResponse(
    string Query,
    int TotalResults,
    List<SearchResultItem> Results,
    DateTime SearchedAt
);
