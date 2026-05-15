import base64
import io
import json
import logging
import re

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """You are a technical resume parser. Extract structured data from the resume text below.
Return ONLY valid JSON matching this exact schema — no markdown, no explanation:

{
  "summary": "2-sentence professional summary",
  "skills": [
    {"name": "Python", "category": "Backend", "proficiency": 4, "years": 5.0}
  ],
  "experience": [
    {
      "company": "Google",
      "title": "Senior SWE",
      "start_date": "2020-01",
      "end_date": null,
      "is_current": true,
      "description": "...",
      "tech_stack": ["Python", "Kubernetes"]
    }
  ],
  "projects": [
    {"name": "...", "description": "...", "tech_stack": ["..."], "git_hub_url": null}
  ],
  "education": [
    {"institution": "MIT", "degree": "B.S.", "field_of_study": "CS", "graduation_year": 2019}
  ],
  "certifications": [
    {
      "name": "AWS Certified Solutions Architect",
      "issuing_organization": "Amazon Web Services",
      "credential_id": "ABC-12345",
      "credential_url": null,
      "issue_date": "2022-06",
      "expiry_date": "2025-06"
    }
  ],
  "total_years_experience": 6.5
}

Proficiency scale: 1=Beginner, 2=Basic, 3=Intermediate, 4=Advanced, 5=Expert
Infer proficiency from role seniority and years of experience with that skill.
For certifications: extract ALL certifications, licenses, and professional credentials mentioned.
Dates should be in "yyyy-MM" format when available, null otherwise.

Resume text:
"""


def _extract_text_from_bytes(data: bytes) -> str:
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(data))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        if text.strip():
            return text
    except Exception:
        pass

    try:
        import docx
        doc = docx.Document(io.BytesIO(data))
        text = "\n".join(p.text for p in doc.paragraphs)
        if text.strip():
            return text
    except Exception:
        pass

    try:
        return data.decode("utf-8")
    except Exception:
        pass

    return ""


async def parse_resume(text_or_b64: str, api_key: str, model: str) -> dict:
    resume_text = text_or_b64
    try:
        decoded = base64.b64decode(text_or_b64)
        resume_text = _extract_text_from_bytes(decoded)
        if not resume_text.strip():
            resume_text = text_or_b64
    except Exception:
        pass

    if api_key:
        return await _parse_with_openai(resume_text, api_key, model)
    else:
        logger.warning("No OpenAI API key — using mock parser")
        return _mock_parse(resume_text)


async def _parse_with_openai(resume_text: str, api_key: str, model: str) -> dict:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=api_key)

    truncated = resume_text[:8000]

    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a resume parser. Return only valid JSON."},
            {"role": "user", "content": EXTRACTION_PROMPT + truncated}
        ],
        temperature=0.1,
        max_tokens=2000
    )

    content = response.choices[0].message.content or "{}"
    content = re.sub(r"```(?:json)?", "", content).strip()

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        logger.error("Failed to parse OpenAI JSON response, falling back to mock")
        return _mock_parse(resume_text)


def _mock_parse(text: str) -> dict:
    return {
        "summary": "Experienced software professional with strong technical background. Skilled in modern development practices and cloud technologies.",
        "skills": [
            {"name": "Python", "category": "Backend", "proficiency": 4, "years": 4.0},
            {"name": "JavaScript", "category": "Frontend", "proficiency": 3, "years": 3.0},
            {"name": "SQL", "category": "Database", "proficiency": 3, "years": 3.0},
            {"name": "Docker", "category": "DevOps", "proficiency": 3, "years": 2.0},
            {"name": "AWS", "category": "Cloud", "proficiency": 3, "years": 2.0},
        ],
        "experience": [
            {
                "company": "Tech Corp",
                "title": "Software Engineer",
                "start_date": "2021-01",
                "end_date": None,
                "is_current": True,
                "description": "Developed and maintained backend services and APIs.",
                "tech_stack": ["Python", "Docker", "PostgreSQL"]
            }
        ],
        "projects": [
            {
                "name": "Internal Dashboard",
                "description": "Built analytics dashboard for internal use.",
                "tech_stack": ["React", "Python", "SQL"],
                "git_hub_url": None
            }
        ],
        "education": [
            {
                "institution": "State University",
                "degree": "B.S.",
                "field_of_study": "Computer Science",
                "graduation_year": 2020
            }
        ],
        "certifications": [],
        "total_years_experience": 4.0
    }
