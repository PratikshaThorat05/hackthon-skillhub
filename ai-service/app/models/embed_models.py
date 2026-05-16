from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class EmbedProfileRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")

    profile_id: str
    text: str


class EmbedProfileResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    vector: list[float]
    model: str


class IndexEntry(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")

    profile_id: str
    vector: list[float]


class RebuildIndexRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")

    profiles: list[IndexEntry]


class RebuildIndexResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    indexed_count: int
    message: str
