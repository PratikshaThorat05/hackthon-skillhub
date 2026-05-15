using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using SkillsHub.API.Infrastructure.AI.Models;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Polly;
using Serilog;
using SkillsHub.API.Common.Middleware;
using SkillsHub.API.Features.Auth;
using SkillsHub.API.Features.HR;
using SkillsHub.API.Features.Profiles;
using SkillsHub.API.Features.Resumes;
using SkillsHub.API.Features.Search;
using SkillsHub.API.Infrastructure.AI;
using SkillsHub.API.Infrastructure.Data;
using SkillsHub.API.Infrastructure.Storage;

var builder = WebApplication.CreateBuilder(args);

// Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();
builder.Host.UseSerilog();

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default"),
        sql => sql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null)));

// JWT Authentication
var jwtSecret = builder.Configuration["JwtSettings:Secret"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();

// AI Gateway (typed HttpClient with Polly retry)
builder.Services.AddHttpClient<IAIGatewayService, AIGatewayService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["AIService:BaseUrl"]!);
    client.Timeout = TimeSpan.FromSeconds(120);
})
.AddTransientHttpErrorPolicy(p =>
    p.WaitAndRetryAsync(3, retry => TimeSpan.FromSeconds(Math.Pow(2, retry))));

// Feature services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<ResumeService>();
builder.Services.AddScoped<ProfileService>();
builder.Services.AddScoped<HRService>();
builder.Services.AddScoped<SearchService>();
builder.Services.AddScoped<LocalFileStorageService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger with JWT support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "SkillsHub API", Version = "v1", Description = "AI-powered skills intelligence platform" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Enter: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

// CORS for Angular
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins(
            builder.Configuration["Cors:AllowedOrigin"] ?? "http://localhost:4200"
        )
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

// Auto-migrate on startup
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Database migration failed — SQL Server may not be ready yet");
    }
}

// Rebuild FAISS index from stored embeddings on startup
_ = Task.Run(async () =>
{
    await Task.Delay(5000); // Wait for Python AI service to be ready
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ai = scope.ServiceProvider.GetRequiredService<IAIGatewayService>();

        var rawEmbeddings = db.ProfileEmbeddings
            .Select(e => new { ProfileId = e.ProfileId.ToString(), e.EmbeddingVector })
            .ToList();

        var embeddings = rawEmbeddings
            .Select(e => new IndexEntry(e.ProfileId, System.Text.Json.JsonSerializer.Deserialize<List<float>>(e.EmbeddingVector)!))
            .ToList();

        if (embeddings.Count > 0)
        {
            await ai.RebuildIndexAsync(new RebuildIndexRequest(embeddings));
            Log.Information("FAISS index rebuilt with {Count} profiles on startup", embeddings.Count);
        }
        else
        {
            Log.Information("No embeddings found in DB — FAISS index stays empty");
        }
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Failed to rebuild FAISS index on startup");
    }
});

app.UseMiddleware<ExceptionMiddleware>();
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "SkillsHub API v1"));
app.UseCors("AllowAngular");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
