import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import parse, embed, search
from app.services.embedding_service import get_model

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-load embedding model on startup
    logger.info("Loading sentence-transformers model...")
    get_model()
    logger.info("AI service ready")
    yield
    logger.info("AI service shutting down")


app = FastAPI(
    title="SkillsHub AI Service",
    description="Resume parsing, embedding generation, and semantic search",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Internal service — .NET API is the only caller
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parse.router, tags=["Resume Parsing"])
app.include_router(embed.router, tags=["Embeddings"])
app.include_router(search.router, tags=["Search"])


@app.get("/health")
async def health():
    from app.services.vector_index import get_index
    index = get_index()
    return {
        "status": "healthy",
        "indexed_profiles": index.size,
        "model": "all-MiniLM-L6-v2"
    }
