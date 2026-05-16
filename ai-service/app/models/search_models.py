from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class SearchRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")

    query: str
    top_k: int = 10


class SearchMatch(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    profile_id: str
    score: float
    rank: int


class SearchResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    results: list[SearchMatch]


class ExplainMatchRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")

    query: str
    profile_summary: str
    skills: list[str]
    experience: str


class ExplainMatchResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    reasoning: str
