from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Moneetize Mini Prelaunch API"
    app_env: str = "development"
    app_debug: bool = True

    api_host: str = "127.0.0.1"
    api_port: int = 8000
    frontend_origin: str = "http://127.0.0.1:3002"

    firestore_project_id: str = "moneetize-earlybird"
    firestore_api_key: str = Field(
        default="AIzaSyD075SWQwQ9clzky0B_n2hwzPLXBfgPb2Q",
        description="Public Firebase web/mobile key used for Firestore REST access.",
    )

    redis_url: str = "redis://127.0.0.1:6381/0"
    cache_ttl_seconds: int = 300
    scratch_session_ttl_seconds: int = 1800

    default_catalog_page_size: int = 12
    default_team_size: int = 4

    model_config = SettingsConfigDict(
        env_file=(BASE_DIR / "backend" / ".env", BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
