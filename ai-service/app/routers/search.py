import logging
from fastapi import APIRouter
from app.models.search_models import (
    SearchRequest, SearchResponse, SearchMatch,
    ExplainMatchRequest, ExplainMatchResponse
)
from app.services.embedding_service import embed_text
from app.services.vector_index import get_index
from app.services.match_reasoner import explain_match
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/search", response_model=SearchResponse, response_model_by_alias=True)
async def search(req: SearchRequest):
    logger.info("Semantic search: query='%s', top_k=%d", req.query[:50], req.top_k)
    query_vector = embed_text(req.query)
    index = get_index()
    raw_results = index.search(query_vector, req.top_k)

    results = [
        SearchMatch(profile_id=pid, score=score, rank=i + 1)
        for i, (pid, score) in enumerate(raw_results)
    ]
    return SearchResponse(results=results)


@router.post("/explain-match", response_model=ExplainMatchResponse, response_model_by_alias=True)
async def explain_match_endpoint(req: ExplainMatchRequest):
    reasoning = await explain_match(
        req.query, req.profile_summary,
        req.skills, req.experience,
        settings.openai_api_key, settings.openai_model
    )
    return ExplainMatchResponse(reasoning=reasoning)
