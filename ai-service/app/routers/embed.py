import logging
from fastapi import APIRouter
from app.models.embed_models import (
    EmbedProfileRequest, EmbedProfileResponse,
    RebuildIndexRequest, RebuildIndexResponse
)
from app.services.embedding_service import embed_text
from app.services.vector_index import get_index
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/embed-profile", response_model=EmbedProfileResponse, response_model_by_alias=True)
async def embed_profile(req: EmbedProfileRequest):
    logger.info("Embedding profile_id=%s", req.profile_id)
    vector = embed_text(req.text)
    index = get_index()
    if req.profile_id in index.profile_ids:
        idx = index.profile_ids.index(req.profile_id)
        logger.debug("Profile %s already indexed at position %d — will be re-added", req.profile_id, idx)
    index.add(req.profile_id, vector)
    return EmbedProfileResponse(vector=vector, model=settings.embedding_model)


@router.post("/rebuild-index", response_model=RebuildIndexResponse, response_model_by_alias=True)
async def rebuild_index(req: RebuildIndexRequest):
    index = get_index()
    entries = [(p.profile_id, p.vector) for p in req.profiles]
    index.rebuild(entries)
    logger.info("Index rebuilt with %d entries", len(entries))
    return RebuildIndexResponse(indexed_count=len(entries), message="Index rebuilt successfully")
