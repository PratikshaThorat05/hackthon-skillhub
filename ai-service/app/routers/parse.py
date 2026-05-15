import logging
from fastapi import APIRouter, HTTPException
from app.models.parse_models import ParseResumeRequest, ParseResumeResponse, LinkedInParseRequest
from app.services.resume_parser import parse_resume
from app.services.linkedin_fetcher import fetch_linkedin_text
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/parse-resume", response_model=ParseResumeResponse, response_model_by_alias=True)
async def parse_resume_endpoint(req: ParseResumeRequest):
    logger.info("Parsing resume for profile_id=%s", req.profile_id)
    result = await parse_resume(req.text, settings.openai_api_key, settings.openai_model)
    return ParseResumeResponse(**result)


@router.post("/parse-linkedin", response_model=ParseResumeResponse, response_model_by_alias=True)
async def parse_linkedin_endpoint(req: LinkedInParseRequest):
    logger.info("Parsing LinkedIn profile: %s", req.url[:80])
    try:
        text = await fetch_linkedin_text(req.url, settings.linkedin_email, settings.linkedin_password)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    result = await parse_resume(text, settings.openai_api_key, settings.openai_model)
    return ParseResumeResponse(**result)
