from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database Settings
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    POSTGRES_DB: str

    # Security Settings
    CORS_ORIGINS: list
    PASSWORD_SALT: str

    class Config:
        env_file = ".env2"

settings = Settings()
