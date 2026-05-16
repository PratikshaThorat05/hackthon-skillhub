import re
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)
_executor = ThreadPoolExecutor(max_workers=2)


def _fetch_sync(username: str, email: str, password: str) -> dict:
    """Synchronous LinkedIn fetch — runs in a thread to avoid blocking the event loop."""
    from linkedin_api import Linkedin
    api = Linkedin(email, password, authenticate=True)
    profile = api.get_profile(username)
    skills = api.get_profile_skills(username)
    return {"profile": profile, "skills": skills}


async def fetch_linkedin_text(url: str, email: str, password: str) -> str:
    """
    Fetch a LinkedIn profile using the user's own LinkedIn credentials
    via linkedin-api (calls LinkedIn's internal Voyager API).
    Add LINKEDIN_EMAIL and LINKEDIN_PASSWORD to ai-service/.env
    """
    if not email or not password:
        raise ValueError(
            "LinkedIn credentials not configured. "
            "Add LINKEDIN_EMAIL=your@email.com and LINKEDIN_PASSWORD=yourpassword "
            "to D:\\Hackthon\\ai-service\\.env, then restart the AI service."
        )

    url = url.strip()
    match = re.search(r'linkedin\.com/in/([^/?#\s]+)', url.rstrip('/'))
    if not match:
        raise ValueError(
            "Invalid LinkedIn URL. Expected format: https://www.linkedin.com/in/username"
        )
    username = match.group(1)
    logger.info("Fetching LinkedIn profile for username: %s", username)

    try:
        loop = asyncio.get_event_loop()
        data = await loop.run_in_executor(
            _executor,
            lambda: _fetch_sync(username, email, password)
        )
    except Exception as ex:
        err = str(ex).lower()
        if "challenge" in err or "captcha" in err or "verify" in err:
            raise ValueError(
                "LinkedIn is asking for verification (CAPTCHA/2FA). "
                "Log in to LinkedIn manually in your browser, complete any security checks, "
                "then try again. If it keeps failing, disable 2FA on your LinkedIn account."
            )
        if "bad credentials" in err or "wrong" in err or "invalid" in err or "401" in err:
            raise ValueError(
                "LinkedIn login failed — check LINKEDIN_EMAIL and LINKEDIN_PASSWORD in .env"
            )
        raise ValueError(f"Could not fetch LinkedIn profile: {ex}")

    return _format_profile(data["profile"], data["skills"])


def _fmt_date(d: dict | None) -> str:
    if not d:
        return ""
    year = d.get("year", "")
    month = d.get("month", "")
    return f"{year}-{str(month).zfill(2)}" if month else str(year)


def _format_profile(profile: dict, skills: list) -> str:
    parts: list[str] = []

    first = profile.get("firstName", "")
    last = profile.get("lastName", "")
    if first or last:
        parts.append(f"Name: {first} {last}".strip())

    if profile.get("headline"):
        parts.append(f"Current Title: {profile['headline']}")

    summary = profile.get("summary") or profile.get("description", "")
    if summary:
        parts.append(f"Summary: {summary}")

    location = profile.get("locationName") or profile.get("geoLocationName", "")
    if location:
        parts.append(f"Location: {location}")

    # Experience
    experiences = profile.get("experience") or []
    if experiences:
        parts.append("\nWork Experience:")
        for exp in experiences[:12]:
            title = exp.get("title", "")
            company = (exp.get("companyName") or exp.get("company", {}).get("name", ""))
            start = _fmt_date(exp.get("timePeriod", {}).get("startDate"))
            end_raw = exp.get("timePeriod", {}).get("endDate")
            end = _fmt_date(end_raw) if end_raw else "Present"
            desc = exp.get("description", "")
            parts.append(f"  - {title} at {company} ({start} to {end})")
            if desc:
                parts.append(f"    {desc[:300]}")

    # Education
    education = profile.get("education") or []
    if education:
        parts.append("\nEducation:")
        for edu in education[:6]:
            school = edu.get("schoolName") or edu.get("school", {}).get("name", "")
            degree = edu.get("degreeName", "")
            field = edu.get("fieldOfStudy", "")
            end_year = _fmt_date(edu.get("timePeriod", {}).get("endDate"))
            line = f"  - {degree} in {field} at {school}" if degree else f"  - {school}"
            if end_year:
                line += f" ({end_year})"
            parts.append(line)

    # Skills (from separate API call)
    if skills:
        skill_names = [s.get("name", "") for s in skills if s.get("name")]
        if skill_names:
            parts.append(f"\nSkills: {', '.join(skill_names[:40])}")

    # Certifications
    certs = profile.get("certifications") or []
    if certs:
        parts.append("\nCertifications:")
        for cert in certs[:15]:
            name = cert.get("name", "")
            authority = cert.get("authority", "")
            start = _fmt_date(cert.get("timePeriod", {}).get("startDate"))
            end = _fmt_date(cert.get("timePeriod", {}).get("endDate"))
            line = f"  - {name}"
            if authority:
                line += f" ({authority})"
            if start:
                line += f" — Issued {start}"
            if end:
                line += f", Expires {end}"
            parts.append(line)

    # Projects
    projects = profile.get("projects") or []
    if projects:
        parts.append("\nProjects:")
        for proj in projects[:8]:
            name = proj.get("title", "")
            desc = proj.get("description", "")
            line = f"  - {name}"
            if desc:
                line += f": {desc[:200]}"
            parts.append(line)

    if not parts:
        raise ValueError(
            "LinkedIn profile returned no data. The profile may be empty or the username is incorrect."
        )

    return "\n".join(parts)
