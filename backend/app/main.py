from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .auth.config import settings

app = FastAPI(title="Security Dashboard API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from .auth.auth_routes import router as auth_router
from .auth.admin_routes import router as admin_router

from .dashboard.test_routes import router as dashboard_router
app.include_router(dashboard_router, prefix='/api', tags=["dashboard"])

app.include_router(auth_router, prefix='/api', tags=["auth"])
app.include_router(admin_router, prefix='/api', tags=["admin"])