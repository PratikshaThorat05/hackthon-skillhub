using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillsHub.API.Common.Models;
using SkillsHub.API.Features.Profiles.DTOs;
using System.Security.Claims;

namespace SkillsHub.API.Features.Profiles;

[ApiController]
[Route("api/profiles")]
[Authorize]
public class ProfilesController(ProfileService profileService) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue("userId")!);

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<ProfileResponse>>> GetMyProfile()
    {
        var profile = await profileService.GetByUserIdAsync(CurrentUserId);
        if (profile is null) return NotFound(ApiResponse<ProfileResponse>.Fail("Profile not found. Upload a resume first."));
        return Ok(ApiResponse<ProfileResponse>.Ok(profile));
    }

    [HttpPatch("me")]
    public async Task<ActionResult<ApiResponse<ProfileResponse>>> UpdateMyProfile([FromBody] UpdateProfileRequest req)
    {
        var profile = await profileService.UpdateAsync(CurrentUserId, req);
        if (profile is null) return NotFound(ApiResponse<ProfileResponse>.Fail("Profile not found"));
        return Ok(ApiResponse<ProfileResponse>.Ok(profile, "Profile updated"));
    }

    [HttpGet("directory")]
    public async Task<ActionResult<ApiResponse<List<ProfileSummaryResponse>>>> GetDirectory()
    {
        var items = await profileService.GetDirectoryAsync();
        return Ok(ApiResponse<List<ProfileSummaryResponse>>.Ok(items));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "HR,Admin")]
    public async Task<ActionResult<ApiResponse<ProfileResponse>>> GetProfile(Guid id)
    {
        var profile = await profileService.GetByIdAsync(id);
        if (profile is null) return NotFound(ApiResponse<ProfileResponse>.Fail("Profile not found"));
        return Ok(ApiResponse<ProfileResponse>.Ok(profile));
    }
}
