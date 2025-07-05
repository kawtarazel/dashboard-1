from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database Settings
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    AUTH_POSTGRES_DB: str
    DASHBOARD_POSTGRES_DB: str
    
    # JWT Settings
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # SMTP Settings
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASSWORD: str
    
    # Security
    CORS_ORIGINS: list = ["http://localhost:5173"]
    PASSWORD_SALT: str
    
    class Config:
        env_file = ".env"

settings = Settings()