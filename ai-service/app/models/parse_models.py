from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from typing import Optional


class ParseResumeRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")

    text: str
    profile_id: str = ""


class ExtractedSkill(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str
    category: Optional[str] = None
    proficiency: int = 3
    years: Optional[float] = None


class ExtractedExperience(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    company: str
    title: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    description: Optional[str] = None
    tech_stack: list[str] = []


class ExtractedProject(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str
    description: Optional[str] = None
    tech_stack: list[str] = []
    git_hub_url: Optional[str] = None


class ExtractedEducation(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    institution: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    graduation_year: Optional[int] = None


class ParseResumeResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    summary: str
    skills: list[ExtractedSkill]
    experience: list[ExtractedExperience]
    projects: list[ExtractedProject]
    education: list[ExtractedEducation]
    total_years_experience: float
