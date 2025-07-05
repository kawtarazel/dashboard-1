from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # JWT Settings
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database Settings
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    POSTGRES_DB: str

    # SMTP settings
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: Optional[str]
    SMTP_PASSWORD: Optional[str]

    # Security Settings
    CORS_ORIGINS: list
    PASSWORD_SALT: str

    class Config:
        env_file = ".env"

settings = Settings()
