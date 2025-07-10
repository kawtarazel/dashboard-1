from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # DASHBOARD Database Settings  
    DASHBOARD_POSTGRES_HOST: str
    DASHBOARD_POSTGRES_PORT: str
    DASHBOARD_POSTGRES_USER: str
    DASHBOARD_POSTGRES_PASSWORD: str
    DASHBOARD_POSTGRES_DB: str
    
    # Security
    CORS_ORIGINS: list
    
    class Config:
        env_file = ".env"

settings = Settings()