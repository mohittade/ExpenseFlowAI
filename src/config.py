"""
Configuration management for ExpenseFlow AI.
"""
from pydantic_settings import BaseSettings
from pydantic import Field, model_validator
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_workers: int = 1

    # Database
    database_url: str = "sqlite:///expense_flow.db"

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_max_connections: int = 10

    # LLM — accept both OPENAI_API_KEY and NVIDIA_API_KEY
    openai_api_key: str = ""
    nvidia_api_key: str = ""          # read from .env as NVIDIA_API_KEY
    openai_model: str = "gpt-4o-mini"
    openai_temperature: float = 0.1
    openai_max_tokens: int = 4000

    # Retry settings
    llm_max_retries: int = 3
    llm_retry_min_wait: float = 2.0
    llm_retry_max_wait: float = 10.0

    # Circuit breaker
    circuit_breaker_failure_threshold: int = 5
    circuit_breaker_recovery_timeout: int = 30

    # Security
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Email — config.py fields (SMTP_HOST / SMTP_USER)
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    finance_email: str = "finance@company.com"

    # Observability
    otel_endpoint: str = "http://localhost:4317"
    service_name: str = "expense-flow-ai"
    log_level: str = "INFO"

    # Feature flags
    enable_human_approval: bool = True
    enable_email_notifications: bool = True
    enable_pdf_generation: bool = True

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        # Ignore unknown env vars (SMTP_SERVER, SMTP_USERNAME aliases, etc.)
        "extra": "ignore",
    }


settings = Settings()


def get_settings() -> Settings:
    """Get settings instance."""
    return settings