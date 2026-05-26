# SkillsHub — AI-Powered Skills Intelligence Platform

Hackathon project. Four-service stack: Angular 19 SPA → .NET 9 REST API → Python FastAPI AI service → SQL Server.

## Architecture

```
skillshub-ui (Angular 19, port 4200)
    ↓ HTTP + JWT
SkillsHub.API (.NET 9, port 5000)
    ↓ HTTP (Polly retry)
ai-service (Python FastAPI, port 8000)
    ↓
FAISS vector index + OpenAI GPT-4o-mini

SQL Server (port 1433) ← used by .NET API only
```

## Starting the App

### Local development (4 terminals)

```powershell
# Terminal 1 — SQL Server (Docker)
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=SkillsHub@2024!" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest

# Terminal 2 — Python AI service
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 3 — .NET API (auto-migrates on startup)
cd SkillsHub.API
dotnet run

# Terminal 4 — Angular
cd skillshub-ui
npm install
ng serve
```

### Docker Compose (full stack)

```powershell
docker-compose up --build
```

Services: frontend → localhost:4200, api → localhost:5000, ai-service → localhost:8000.

## Environment Variables

Copy `.env` to `ai-service/.env`. Required variables:

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI key for GPT-4o-mini (leave empty for mock mode) |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` |
| `LINKEDIN_EMAIL` | Optional — LinkedIn profile fetching |
| `LINKEDIN_PASSWORD` | Optional — LinkedIn profile fetching |

.NET API config is in `SkillsHub.API/appsettings.json`:
- `ConnectionStrings:DefaultConnection` — SQL Server
- `JwtSettings:SecretKey` — JWT signing key (32+ chars)
- `AIService:BaseUrl` — Python service URL (default: `http://localhost:8000`)

## Project Structure

```
SkillsHub.API/
  Features/
    Auth/           AuthController, AuthService, JwtTokenService
    Resumes/        ResumesController, ResumeService
    Profiles/       ProfilesController, ProfileService
    HR/             HRController, HRService, DemoDataService
    Search/         SearchController, SearchService
  Infrastructure/
    Data/           AppDbContext, EF Core migrations (3)
    AI/             AIGatewayService (HTTP client to Python)
    Storage/        LocalFileStorageService (resume uploads)

ai-service/
  main.py           FastAPI app + lifespan (pre-loads embedding model)
  routers/          parse.py, embed.py, search.py
  services/
    embedding_service.py   sentence-transformers (all-MiniLM-L6-v2)
    resume_parser.py       PDF/DOCX extraction (pypdf, python-docx)
    vector_index.py        FAISS 384-dim index with disk persistence
    match_reasoner.py      GPT-4o-mini reasoning on matches
    linkedin_fetcher.py    LinkedIn profile scraping
    github_fetcher.py      GitHub profile parsing

skillshub-ui/
  src/app/
    core/           auth guards, API service, HTTP interceptor (JWT)
    features/
      auth/         login, register
      employee/     upload, profile, directory
      hr/           dashboard, review, search, profile-view,
                    bulk-upload, chat, gap-analysis, org-chart, team-builder
    shared/         navbar, skill-chip
```

## Key API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register (roles: Employee, HR, Admin) |
| POST | `/api/auth/login` | None | Returns JWT |
| POST | `/api/resumes/upload` | Employee | Upload PDF/DOCX → triggers AI parse |
| GET | `/api/profiles/me` | Employee | Own profile |
| PATCH | `/api/profiles/me` | Employee | Update name, title, dept, location, availability, linkedin |
| GET | `/api/profiles/directory` | Any | All approved employees |
| GET | `/api/hr/profiles` | HR | All profiles (pending/approved/rejected) |
| POST | `/api/hr/profiles/{id}/approve` | HR | Approve profile |
| POST | `/api/hr/profiles/{id}/reject` | HR | Reject profile |
| GET | `/api/hr/stats` | HR | Dashboard stats |
| POST | `/api/hr/seed-demo` | HR | Seed 10 realistic demo profiles with embeddings |
| POST | `/api/search` | HR | Natural language semantic search |

## Database

SQL Server via EF Core. Migrations run automatically on API startup.

Migrations (in order):
1. `20260515060216_InitialCreate` — core schema (Users, Profiles, Skills, Experience, Projects, Education, Embeddings)
2. `20260515130853_AddCertifications` — Certifications table
3. `20260515131841_AddLocationAvailability` — Location + Availability fields on profiles

To add a migration:
```powershell
cd SkillsHub.API
dotnet ef migrations add <MigrationName>
```

## Demo Flow

1. Login as HR: `testhr@demo.com` / `Demo@1234`
2. Dashboard → click "Load Demo Profiles" → seeds 10 profiles with FAISS embeddings
3. Search → try:
   - `"AWS certified cloud architect"` → Raj Patel (~78.7%)
   - `"Machine learning engineer with Python"` → Alex Rivera
   - `"DevOps with Kubernetes"` → Marcus Johnson
4. Profiles → approve/reject from the queue
5. Employee login: any `*.demo.skillshub.com` address with password `Demo@1234`

## AI Pipeline

Resume upload flow:
1. File saved to `uploads/` (local) or `/uploads` (Docker volume)
2. .NET API sends file to Python `/parse` → extracts text
3. Python extracts structured data (skills+proficiency, experience, projects, education, certifications) via GPT-4o-mini
4. .NET API stores structured data in SQL Server
5. .NET API sends profile text to Python `/embed` → 384-dim vector
6. Vector stored in `ProfileEmbedding` table and added to FAISS index

Semantic search flow:
1. HR submits query string
2. .NET API sends query to Python `/search`
3. Python embeds query → FAISS top-K → GPT-4o-mini generates match reasoning per candidate
4. Results returned with match score + reasoning text

FAISS index is rebuilt from stored `ProfileEmbedding` rows on API startup (no cold-start loss).

## Deployment

Azure deployment config is in `.azure/config`:
- Resource group: `skillshub-rg`
- Location: `centralindia`
- App Service plan: `skillshub-linux-plan` (F1 free tier)
- Web app: `skillhub-api-linux`

Docker images use CPU-only PyTorch to avoid the 1.8 GB CUDA download in the AI service container.
The `all-MiniLM-L6-v2` model is pre-downloaded at image build time so containers start without internet access.
