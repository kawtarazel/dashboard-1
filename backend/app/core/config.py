from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str
    # AUTH Database Settings
    AUTH_POSTGRES_HOST: str
    AUTH_POSTGRES_PORT: str
    AUTH_POSTGRES_USER: str
    AUTH_POSTGRES_PASSWORD: str
    AUTH_POSTGRES_DB: str
    
    # DASHBOARD Database Settings  
    DASHBOARD_POSTGRES_HOST: str
    DASHBOARD_POSTGRES_PORT: str
    DASHBOARD_POSTGRES_USER: str
    DASHBOARD_POSTGRES_PASSWORD: str
    DASHBOARD_POSTGRES_DB: str
    
    # JWT Settings
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int
    
    # SMTP Settings
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASSWORD: str
    
    # Security
    CORS_ORIGINS: list
    PASSWORD_SALT: str
    
    class Config:
        env_file = ".env"

settings = Settings()