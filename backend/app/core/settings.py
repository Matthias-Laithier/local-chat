from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    cors_origins: list[str]
    database_url: str
    ollama_base_url: str
    ollama_model: str

    # IANA timezone name for the agent's current date/time context (e.g. UTC, Europe/Berlin)
    agent_timezone: str = "UTC"
    web_search_enabled: bool = True
    web_search_max_results: int = 5


settings = Settings()
