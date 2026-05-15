using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillsHub.API.Common.Models;
using SkillsHub.API.Features.HR.DTOs;
using SkillsHub.API.Features.Profiles;
using SkillsHub.API.Features.Profiles.DTOs;
using SkillsHub.API.Features.Resumes;
using SkillsHub.API.Features.Resumes.DTOs;
using System.Security.Claims;

namespace SkillsHub.API.Features.HR;

[ApiController]
[Route("api/hr")]
[Authorize(Roles = "HR,Admin")]
public class HRController(HRService hrService, ProfileService profileService, ResumeService resumeService) : ControllerBase
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

    [HttpPatch("profiles/{id:guid}")]
    public async Task<ActionResult<ApiResponse<ProfileResponse>>> UpdateProfile(Guid id, [FromBody] UpdateProfileRequest req)
    {
        var profile = await profileService.UpdateByIdAsync(id, req);
        if (profile is null) return NotFound(ApiResponse<ProfileResponse>.Fail("Profile not found"));
        return Ok(ApiResponse<ProfileResponse>.Ok(profile, "Profile updated successfully"));
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

    [HttpPost("upload-text")]
    public async Task<ActionResult<ApiResponse<object>>> UploadText([FromBody] ProfileTextHRUploadRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.EmployeeEmail))
            return BadRequest(ApiResponse<object>.Fail("Employee email is required"));
        if (string.IsNullOrWhiteSpace(req.ProfileText))
            return BadRequest(ApiResponse<object>.Fail("Profile text is required"));

        var (success, error, response) = await resumeService.UploadTextForEmployeeAsync(req.ProfileText, req.EmployeeEmail.Trim().ToLower());
        if (!success) return BadRequest(ApiResponse<object>.Fail(error));
        return Ok(ApiResponse<object>.Ok(response!, $"Profile text import started for {req.EmployeeEmail}"));
    }

    [HttpPost("upload-linkedin")]
    public async Task<ActionResult<ApiResponse<object>>> UploadLinkedIn([FromBody] LinkedInHRUploadRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.EmployeeEmail))
            return BadRequest(ApiResponse<object>.Fail("Employee email is required"));
        if (string.IsNullOrWhiteSpace(req.LinkedInUrl))
            return BadRequest(ApiResponse<object>.Fail("LinkedIn URL is required"));

        var (success, error, response) = await resumeService.UploadLinkedInForEmployeeAsync(req.LinkedInUrl, req.EmployeeEmail.Trim().ToLower());
        if (!success) return BadRequest(ApiResponse<object>.Fail(error));
        return Ok(ApiResponse<object>.Ok(response!, $"LinkedIn profile import started for {req.EmployeeEmail}"));
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<object>>> UploadEmployeeResume(
        [FromForm] IFormFile file,
        [FromForm] string employeeEmail)
    {
        if (string.IsNullOrWhiteSpace(employeeEmail))
            return BadRequest(ApiResponse<object>.Fail("Employee email is required"));

        var (success, error, response) = await resumeService.UploadForEmployeeAsync(file, employeeEmail.Trim().ToLower());
        if (!success) return BadRequest(ApiResponse<object>.Fail(error));

        return Ok(ApiResponse<object>.Ok(response!, $"Resume uploaded for {employeeEmail}. AI processing started."));
    }

    [HttpPost("bulk-upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<List<BulkUploadResult>>>> BulkUpload(
        [FromForm] List<IFormFile> files,
        [FromForm] List<string> emails)
    {
        if (files.Count == 0)
            return BadRequest(ApiResponse<List<BulkUploadResult>>.Fail("No files provided"));
        if (files.Count != emails.Count)
            return BadRequest(ApiResponse<List<BulkUploadResult>>.Fail("Each file must have a corresponding email"));

        var tasks = files.Zip(emails, async (file, email) =>
        {
            if (string.IsNullOrWhiteSpace(email))
                return new BulkUploadResult { Email = email, FileName = file.FileName, Success = false, Error = "Email is required" };

            var (success, error, _) = await resumeService.UploadForEmployeeAsync(file, email.Trim().ToLower());
            return new BulkUploadResult { Email = email.Trim().ToLower(), FileName = file.FileName, Success = success, Error = error };
        });

        var results = await Task.WhenAll(tasks);
        return Ok(ApiResponse<List<BulkUploadResult>>.Ok(results.ToList(), $"Processed {results.Length} files"));
    }
}
