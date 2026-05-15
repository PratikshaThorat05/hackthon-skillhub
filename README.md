# SkillsHub — AI-Powered Skills Intelligence Platform

> Upload resumes → AI extracts skills → HR searches with natural language → Ranked matches with AI reasoning

## Architecture

```
Angular (4200) → .NET API (5000) → Python AI Service (8000)
                       ↓
                  SQL Server (1433)
```

## Quick Start

### Option A — Docker (recommended, all services)

```bash
# 1. Add your OpenAI key (optional — mock works without it)
echo "OPENAI_API_KEY=sk-..." >> ai-service/.env

# 2. Start everything
docker compose up --build

# 3. Open http://localhost:4200
```

First startup takes ~5 minutes (AI model download, SQL migration).

### Option B — Local Development

**Prerequisites:** .NET 9, Node 20, Python 3.11, SQL Server

**1. SQL Server**
```bash
docker run -e SA_PASSWORD=SkillsHub@2024! -e ACCEPT_EULA=Y -p 1433:1433 \
  mcr.microsoft.com/mssql/server:2022-latest
```

**2. .NET API**
```bash
cd SkillsHub.API
dotnet run
# API: http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

**3. Python AI Service**
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Health: http://localhost:8000/health
# Docs:   http://localhost:8000/docs
```

**4. Angular Frontend**
```bash
cd skillshub-ui
npm install
npm start
# App: http://localhost:4200
```

---

## Demo Flow

### As an Employee:
1. Register → Role: `Employee`
2. Go to **Upload Resume** → upload a PDF/DOCX
3. Wait ~10s for AI processing
4. View **My Profile** → see extracted skills, experience, projects

### As HR:
1. Register → Role: `HR`
2. Go to **Profiles** → approve employee profiles
3. Go to **Search** → type natural language query
4. See ranked results with AI match reasoning

### Example Search Queries:
- `Senior React developer with TypeScript and AWS`
- `Backend engineer with Python and machine learning experience`
- `DevOps engineer with Kubernetes and CI/CD pipelines`
- `Full stack developer who has worked in fintech`

---

## API Reference

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/register` | POST | None | Register user |
| `/api/auth/login` | POST | None | Login → JWT |
| `/api/auth/me` | GET | Any | Current user |
| `/api/resumes/upload` | POST | Employee | Upload resume |
| `/api/resumes/status` | GET | Employee | Parse status |
| `/api/profiles/me` | GET | Employee | Own profile |
| `/api/hr/profiles` | GET | HR | List profiles |
| `/api/hr/profiles/{id}/approve` | PATCH | HR | Approve profile |
| `/api/hr/stats` | GET | HR | Dashboard stats |
| `/api/search` | POST | HR | AI semantic search |

Full interactive docs: `http://localhost:5000/swagger`

---

## Project Structure

```
Hackthon/
├── SkillsHub.API/          .NET 9 Web API
│   ├── Features/           Vertical slice features
│   │   ├── Auth/
│   │   ├── Resumes/
│   │   ├── Profiles/
│   │   ├── HR/
│   │   └── Search/
│   ├── Infrastructure/
│   │   ├── Data/           EF Core + SQL Server
│   │   ├── AI/             AI Gateway (HttpClient)
│   │   └── Storage/        File storage
│   └── Common/
│
├── ai-service/             Python FastAPI
│   ├── app/
│   │   ├── routers/        /parse-resume, /embed-profile, /search
│   │   ├── services/       resume_parser, embedding_service, vector_index
│   │   └── models/         Pydantic schemas
│   └── main.py
│
├── skillshub-ui/           Angular 19
│   └── src/app/
│       ├── core/           Auth, models, interceptors
│       ├── features/       Employee & HR screens
│       └── shared/         Navbar, components
│
└── docker-compose.yml
```

---

## Configuration

| Setting | Default | Override |
|---|---|---|
| OpenAI API Key | (empty = mock) | `ai-service/.env` OPENAI_API_KEY |
| OpenAI Model | `gpt-4o-mini` | `ai-service/.env` OPENAI_MODEL |
| JWT Secret | see .env | `.env` JWT_SECRET |
| SQL Password | `SkillsHub@2024!` | `.env` SA_PASSWORD |
| API URL | `localhost:5000` | `skillshub-ui/src/environments/environment.ts` |

---

## AI Pipeline

```
Resume Upload (PDF/DOCX)
    ↓
Python AI Service: extract text (pypdf/python-docx)
    ↓
GPT-4o-mini: structured JSON extraction (skills, experience, projects)
    ↓
sentence-transformers: 384-dim embedding vector
    ↓
FAISS in-memory index: vector stored + indexed
    ↓
HR Search: query → embed → FAISS cosine search → top-K profiles
    ↓
GPT-4o-mini: 2-sentence match reasoning for top 3
```

Without an OpenAI key, the system uses a mock parser and still performs real semantic search.
