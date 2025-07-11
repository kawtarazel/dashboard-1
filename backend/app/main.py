from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Rate limiting imports
from app.auth.auth_routes import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .auth import security
from .core.config import settings
from .core.security_headers import add_security_headers

from app.dashboard.database import engine as dashboard_engine
from app.dashboard import models as dashboard_models
from app.auth.database import engine as auth_engine
from app.auth import models as auth_models

from .init_db.init_db import seed_data
from sqlalchemy.orm import Session
from app.auth.database import SessionLocal

@asynccontextmanager
async def lifespan(_: FastAPI):
    """Application lifespan events"""
    print("Starting Security Dashboard API...")
    
    print("Creating database tables...")
    auth_models.Base.metadata.create_all(bind=auth_engine)
    dashboard_models.Base.metadata.create_all(bind=dashboard_engine)
    
    print("Seeding initial data...")
    seed_data()
    
    print("Application startup complete!")
    yield
    print("Application shutdown")

app = FastAPI(
    title="Security Dashboard API", 
    lifespan=lifespan,
    description="Cybersecurity Dashboard with Role-Based Access Control",
    version="1.0.0"
)

add_security_headers(app)

# rate limiting to main app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for Docker and monitoring"""
    try:
        # Test database connections
        auth_db = SessionLocal()
        auth_db.execute('SELECT 1')
        auth_db.close()
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "auth_database": "connected",
                "dashboard_database": "connected",
                "application": "running"
            },
            "version": "1.0.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "CybrSense Security Dashboard API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

# Include routers
from .auth.auth_routes import router as auth_router
from .auth.admin_routes import router as admin_router
from .dashboard.dashbord_routes import router as dashboard_router

app.include_router(auth_router, prefix='/api', tags=["auth"])
app.include_router(admin_router, prefix='/api', tags=["admin"])
app.include_router(dashboard_router, prefix='/api', tags=["dashboard"])