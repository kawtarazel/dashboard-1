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

@asynccontextmanager
async def lifespan(_: FastAPI):
    """Application lifespan events"""
    print("🚀 Starting Security Dashboard API...")
    
    print("📊 Creating database tables...")
    auth_models.Base.metadata.create_all(bind=auth_engine)
    dashboard_models.Base.metadata.create_all(bind=dashboard_engine)
    
    print("🌱 Seeding initial data...")
    seed_auth_data()
    
    print("✅ Application startup complete!")
    yield
    print("👋 Application shutdown")

# ✅ FIXED: Single FastAPI app declaration
app = FastAPI(
    title="Security Dashboard API", 
    lifespan=lifespan,
    description="Cybersecurity Dashboard with Role-Based Access Control",
    version="1.0.0"
)
add_security_headers(app)

# ✅ FIXED: Add rate limiting to main app
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

from sqlalchemy.orm import Session
from app.auth import models
from app.auth.database import SessionLocal

def seed_auth_data():
    """Seed initial authentication data"""
    db: Session = SessionLocal()
    try:
        # Seed permissions
        if db.query(models.Permission).count() == 0:
            permissions = [
                models.Permission(name='view_dashboard', description='Can view the dashboard'),
                models.Permission(name='edit_profile', description='Can edit own profile'),
                models.Permission(name='manage_users', description='Can manage (add/edit/delete) users'),
                models.Permission(name='assign_roles', description='Can assign roles to users'),
                models.Permission(name='view_reports', description='Can view reports'),
                models.Permission(name='export_data', description='Can export data'),
                models.Permission(name='manage_permissions', description='Can manage permissions'),
            ]
            db.add_all(permissions)
            db.commit()
            print("✅ Permissions seeded")

        # Seed roles
        if db.query(models.Role).count() == 0:
            roles = [
                models.Role(name='Strategic', description='Strategic level access'),
                models.Role(name='Managerial', description='Managerial level access'),
                models.Role(name='Operational', description='Operational level access'),
                models.Role(name='Viewer', description='View-only access'),
            ]
            db.add_all(roles)
            db.commit()
            print("✅ Roles seeded")

        # Seed role_permissions
        if db.query(models.RolePermission).count() == 0:
            # Get role and permission IDs
            role_ids = {role.name: role.id for role in db.query(models.Role).all()}
            perm_ids = {perm.name: perm.id for perm in db.query(models.Permission).all()}
            
            role_permissions = [
                # Viewer permissions
                models.RolePermission(role_id=role_ids['Viewer'], permission_id=perm_ids['view_dashboard']),
                
                # Operational permissions
                models.RolePermission(role_id=role_ids['Operational'], permission_id=perm_ids['view_dashboard']),
                models.RolePermission(role_id=role_ids['Operational'], permission_id=perm_ids['edit_profile']),
                models.RolePermission(role_id=role_ids['Operational'], permission_id=perm_ids['view_reports']),
                
                # Managerial permissions
                models.RolePermission(role_id=role_ids['Managerial'], permission_id=perm_ids['view_dashboard']),
                models.RolePermission(role_id=role_ids['Managerial'], permission_id=perm_ids['edit_profile']),
                models.RolePermission(role_id=role_ids['Managerial'], permission_id=perm_ids['view_reports']),
                models.RolePermission(role_id=role_ids['Managerial'], permission_id=perm_ids['export_data']),
                
                # Strategic permissions
                models.RolePermission(role_id=role_ids['Strategic'], permission_id=perm_ids['view_dashboard']),
                models.RolePermission(role_id=role_ids['Strategic'], permission_id=perm_ids['edit_profile']),
                models.RolePermission(role_id=role_ids['Strategic'], permission_id=perm_ids['view_reports']),
                models.RolePermission(role_id=role_ids['Strategic'], permission_id=perm_ids['export_data']),
            ]
            db.add_all(role_permissions)
            db.commit()
            print("✅ Role permissions seeded")

        # Create admin user
        import os
        admin_email = os.getenv("ADMIN_EMAIL")
        admin_password = os.getenv("ADMIN_PASSWORD")
        admin_exists = db.query(models.User).filter(models.User.email == admin_email).first()
        if not admin_exists:
            # Get Strategic role (assuming it exists)
            strategic_role = db.query(models.Role).filter(models.Role.name == 'Strategic').first()
            if strategic_role:
                admin = models.User(
                    email=admin_email,
                    username="admin",
                    hashed_password=security.get_password_hash(admin_password),
                    is_superuser=True,
                    is_active=True,
                    is_verified=True,
                    role_id=strategic_role.id
                )
                db.add(admin)
                db.commit()
                print(f"✅ Admin user created ({admin_email} / {admin_password})")
            else:
                print("⚠️ Strategic role not found, admin user not created")

    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

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