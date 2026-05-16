using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkillsHub.API.Common.Models;
using SkillsHub.API.Features.Resumes.DTOs;
using System.Security.Claims;

namespace SkillsHub.API.Features.Resumes;

[ApiController]
[Route("api/resumes")]
[Authorize]
public class ResumesController(ResumeService resumeService) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue("userId")!);

    [HttpPost("upload")]
    public async Task<ActionResult<ApiResponse<ResumeUploadResponse>>> Upload(IFormFile file)
    {
        var (success, error, response) = await resumeService.UploadAsync(file, CurrentUserId);
        if (!success) return BadRequest(ApiResponse<ResumeUploadResponse>.Fail(error));
        return Ok(ApiResponse<ResumeUploadResponse>.Ok(response!));
    }

    [HttpPost("upload-text")]
    public async Task<ActionResult<ApiResponse<ResumeUploadResponse>>> UploadText([FromBody] ProfileTextUploadRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.ProfileText))
            return BadRequest(ApiResponse<ResumeUploadResponse>.Fail("Profile text is required"));
        var (success, error, response) = await resumeService.UploadFromTextAsync(req.ProfileText, CurrentUserId);
        if (!success) return BadRequest(ApiResponse<ResumeUploadResponse>.Fail(error));
        return Ok(ApiResponse<ResumeUploadResponse>.Ok(response!));
    }

    [HttpPost("upload-linkedin")]
    public async Task<ActionResult<ApiResponse<ResumeUploadResponse>>> UploadLinkedIn([FromBody] LinkedInUploadRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.LinkedInUrl))
            return BadRequest(ApiResponse<ResumeUploadResponse>.Fail("LinkedIn URL is required"));
        var (success, error, response) = await resumeService.UploadFromLinkedInAsync(req.LinkedInUrl, CurrentUserId);
        if (!success) return BadRequest(ApiResponse<ResumeUploadResponse>.Fail(error));
        return Ok(ApiResponse<ResumeUploadResponse>.Ok(response!));
    }

    [HttpPost("upload-github")]
    public async Task<ActionResult<ApiResponse<ResumeUploadResponse>>> UploadGitHub([FromBody] GitHubUploadRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.GitHubUrl))
            return BadRequest(ApiResponse<ResumeUploadResponse>.Fail("GitHub URL is required"));
        var (success, error, response) = await resumeService.UploadFromGitHubAsync(req.GitHubUrl, CurrentUserId);
        if (!success) return BadRequest(ApiResponse<ResumeUploadResponse>.Fail(error));
        return Ok(ApiResponse<ResumeUploadResponse>.Ok(response!));
    }

    [HttpGet("status")]
    public async Task<ActionResult<ApiResponse<ResumeStatusResponse>>> Status()
    {
        var status = await resumeService.GetStatusAsync(CurrentUserId);
        if (status is null) return NotFound(ApiResponse<ResumeStatusResponse>.Fail("No resume found"));
        return Ok(ApiResponse<ResumeStatusResponse>.Ok(status));
    }
}
