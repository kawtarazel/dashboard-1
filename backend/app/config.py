from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # JWT Settings
    JWT_SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database Settings
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "security_dashboard"

    # SMTP settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 465
    SMTP_USER: Optional[str] = "abdoamsg17@gmail.com"
    SMTP_PASSWORD: Optional[str] = "tthd ifdg nnro foga"

    # Security Settings
    CORS_ORIGINS: list = ["http://localhost:5173"]  # Vite's default port
    PASSWORD_SALT: str = "your-salt-change-this-in-production"

    class Config:
        env_file = ".env"

settings = Settings()
