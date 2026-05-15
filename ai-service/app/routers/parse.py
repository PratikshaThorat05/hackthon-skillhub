import logging
from fastapi import APIRouter
from app.models.parse_models import ParseResumeRequest, ParseResumeResponse
from app.services.resume_parser import parse_resume
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/parse-resume", response_model=ParseResumeResponse, response_model_by_alias=True)
async def parse_resume_endpoint(req: ParseResumeRequest):
    logger.info("Parsing resume for profile_id=%s", req.profile_id)
    result = await parse_resume(req.text, settings.openai_api_key, settings.openai_model)
    return ParseResumeResponse(**result)
