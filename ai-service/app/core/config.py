from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    embedding_model: str = "all-MiniLM-L6-v2"
    max_tokens: int = 2000
    debug: bool = False
    linkedin_email: str = ""
    linkedin_password: str = ""
    github_token: str = ""


settings = Settings()
