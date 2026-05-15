using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillsHub.API.Common.Models;
using SkillsHub.API.Features.Search.DTOs;
using System.Security.Claims;

namespace SkillsHub.API.Features.Search;

[ApiController]
[Route("api/search")]
[Authorize(Roles = "HR,Admin")]
public class SearchController(SearchService searchService) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue("userId")!);

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SearchResponse>>> Search([FromBody] SearchRequest req)
    {
        var result = await searchService.SearchAsync(req, CurrentUserId);
        return Ok(ApiResponse<SearchResponse>.Ok(result));
    }
}
