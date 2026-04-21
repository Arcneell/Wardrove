from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://wardrove:wardrove@localhost:5432/wardrove"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Security
    secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 30

    # OAuth - GitHub
    github_client_id: str = ""
    github_client_secret: str = ""

    # App
    app_url: str = "http://localhost:8847"
    upload_max_size_mb: int = 100
    rate_limit_auth: int = 100  # requests per minute
    rate_limit_api_token: int = 50
    rate_limit_anon: int = 20

    # Worker
    worker_max_jobs: int = 10

    # Demo mode — when true, a seeded "demo" account can sign in via a
    # one-click endpoint without OAuth. Safe to leave on for self-hosted
    # single-user installs; turn OFF for multi-tenant / public deployments.
    demo_mode: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
