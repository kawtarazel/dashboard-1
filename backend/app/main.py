from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import security
from .core.config import settings

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_auth_data()
    yield

app = FastAPI(title="Security Dashboard API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from sqlalchemy.orm import Session
from app.auth import models
from app.auth.database import engine, SessionLocal

def seed_auth_data():
    db: Session = SessionLocal()
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

    # Seed roles
    if db.query(models.Role).count() == 0:
        roles = [
            models.Role(name='Strategic'),
            models.Role(name='Managerial'),
            models.Role(name='Operational'),
            models.Role(name='Viewer'),
        ]
        db.add_all(roles)
        db.commit()

    # Seed role_permissions
    if db.query(models.RolePermission).count() == 0:
        # Get role and permission IDs
        role_ids = {role.name: role.id for role in db.query(models.Role).all()}
        perm_ids = {perm.name: perm.id for perm in db.query(models.Permission).all()}
        role_permissions = [
            # Viewer
            models.RolePermission(role_id=role_ids['Viewer'], permission_id=perm_ids['view_dashboard']),
            # Operational
            models.RolePermission(role_id=role_ids['Operational'], permission_id=perm_ids['view_dashboard']),
            models.RolePermission(role_id=role_ids['Operational'], permission_id=perm_ids['edit_profile']),
            models.RolePermission(role_id=role_ids['Operational'], permission_id=perm_ids['view_reports']),
            # Managerial
            models.RolePermission(role_id=role_ids['Managerial'], permission_id=perm_ids['view_dashboard']),
            models.RolePermission(role_id=role_ids['Managerial'], permission_id=perm_ids['edit_profile']),
            models.RolePermission(role_id=role_ids['Managerial'], permission_id=perm_ids['view_reports']),
            models.RolePermission(role_id=role_ids['Managerial'], permission_id=perm_ids['export_data']),
            # Strategic
            models.RolePermission(role_id=role_ids['Strategic'], permission_id=perm_ids['view_dashboard']),
            models.RolePermission(role_id=role_ids['Strategic'], permission_id=perm_ids['edit_profile']),
            models.RolePermission(role_id=role_ids['Strategic'], permission_id=perm_ids['view_reports']),
            models.RolePermission(role_id=role_ids['Strategic'], permission_id=perm_ids['export_data']),
        ]
        db.add_all(role_permissions)
        db.commit()

    # Create admin user
    if db.query(models.User).filter(models.User.is_superuser == True).count() == 0:
        admin = models.User(
            email="admin@admin.com",
            username="admin",
            hashed_password=security.get_password_hash("admin123"),
            is_superuser=True,
            is_active=True,
            is_verified=True,
            role_id=1
        )
        db.add(admin)
        db.commit()

    db.close()

app = FastAPI()

# Include routers
from .auth.auth_routes import router as auth_router
from .auth.admin_routes import router as admin_router

from .dashboard.test_routes import router as dashboard_router
app.include_router(dashboard_router, prefix='/api', tags=["dashboard"])

app.include_router(auth_router, prefix='/api', tags=["auth"])
app.include_router(admin_router, prefix='/api', tags=["admin"])