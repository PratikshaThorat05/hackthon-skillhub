namespace SkillsHub.API.Infrastructure.Storage;

public class LocalFileStorageService(IConfiguration config, ILogger<LocalFileStorageService> logger)
{
    private readonly string _uploadPath = config["Storage:UploadPath"] ?? "uploads";

    public async Task<string> SaveAsync(IFormFile file, Guid userId)
    {
        var userDir = Path.Combine(_uploadPath, userId.ToString());
        Directory.CreateDirectory(userDir);

        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid()}{ext}";
        var fullPath = Path.Combine(userDir, fileName);

        await using var stream = File.Create(fullPath);
        await file.CopyToAsync(stream);

        logger.LogInformation("Saved file {FileName} to {Path}", file.FileName, fullPath);
        return fullPath;
    }

    public string? ReadAllText(string path)
    {
        if (!File.Exists(path)) return null;
        // Basic text extraction — works for txt files
        // PDF/DOCX extraction is handled by AI service
        return File.ReadAllText(path);
    }

    public byte[]? ReadBytes(string path)
    {
        if (!File.Exists(path)) return null;
        return File.ReadAllBytes(path);
    }
}
