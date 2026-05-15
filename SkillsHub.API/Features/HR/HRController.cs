using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillsHub.API.Common.Models;
using SkillsHub.API.Features.HR.DTOs;
using System.Security.Claims;

namespace SkillsHub.API.Features.HR;

[ApiController]
[Route("api/hr")]
[Authorize(Roles = "HR,Admin")]
public class HRController(HRService hrService) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue("userId")!);

    [HttpGet("profiles")]
    public async Task<ActionResult<ApiResponse<PagedResponse<ProfileSummaryDto>>>> GetProfiles(
        [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var (items, total) = await hrService.GetProfilesAsync(status, page, pageSize);
        return Ok(ApiResponse<PagedResponse<ProfileSummaryDto>>.Ok(new PagedResponse<ProfileSummaryDto>
        {
            Items = items, TotalCount = total, Page = page, PageSize = pageSize
        }));
    }

    [HttpPatch("profiles/{id:guid}/approve")]
    public async Task<ActionResult<ApiResponse<string>>> Approve(Guid id)
    {
        var (success, error) = await hrService.ApproveAsync(id, CurrentUserId);
        if (!success) return NotFound(ApiResponse<string>.Fail(error));
        return Ok(ApiResponse<string>.Ok("Approved", "Profile approved successfully"));
    }

    [HttpPatch("profiles/{id:guid}/reject")]
    public async Task<ActionResult<ApiResponse<string>>> Reject(Guid id, [FromBody] ApprovalRequest req)
    {
        var (success, error) = await hrService.RejectAsync(id, CurrentUserId);
        if (!success) return NotFound(ApiResponse<string>.Fail(error));
        return Ok(ApiResponse<string>.Ok("Rejected", req.Reason ?? "Profile rejected"));
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<HRStatsResponse>>> Stats()
    {
        var stats = await hrService.GetStatsAsync();
        return Ok(ApiResponse<HRStatsResponse>.Ok(stats));
    }
}
