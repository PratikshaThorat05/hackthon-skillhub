using System.Net;
using System.Text.Json;
using SkillsHub.API.Common.Models;

namespace SkillsHub.API.Common.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";
            var response = ApiResponse<object>.Fail("An unexpected error occurred. Please try again.");
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}
