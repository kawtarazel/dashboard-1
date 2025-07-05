from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from . import models

from .database import engine, get_db
from . import security
from .config import settings
import logging

logging.basicConfig(level=logging.INFO)

# Create database tables
# models.Base.metadata.create_all(bind=engine)

router = APIRouter(prefix="/admin", tags=["admin"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_admin_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

# Ensure admin exists at startup
@router.on_event("startup")
def create_admin():
    db = next(get_db())
    admin = db.query(models.User).filter(models.User.email == "admin@admin.com").first()
    if not admin:
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

# Admin: List all users with role and permissions
@router.get("/users")
def list_users(db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    try:
        users = db.query(models.User).all()
        result = []
        for user in users:
            role = user.role
            # Collect permissions from role and direct user permissions if any
            permissions_set = set()
            # Permissions from role
            for perm in role.permissions:
                permission = db.query(models.Permission).filter(models.Permission.id == perm.permission_id).first()
                if permission:
                    permissions_set.add((permission.id, permission.name))
            for perm in user.permissions:
                permissions = db.query(models.Permission).filter(models.Permission.id == perm.permission_id).first()
                if permissions:
                    permissions_set.add((permissions.id, permissions.name))
            permissions = [{"id": pid, "name": pname} for pid, pname in permissions_set]
            result.append({
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "is_active": user.is_active,
                "is_superuser": user.is_superuser,
                "is_verified": user.is_verified,
                "role": role,
                "permissions": permissions
            })
        logging.info(f"Fetched {len(result)} users from the database.")
        return result
    finally:
        logging.info("Fetched all users successfully.")
        db.close()

# Admin: change user role
@router.post("/users/{user_id}/role/{role_id}")
def assign_role(user_id: int, role_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    logging.info(f"Assigning role {role_id} to user {user_id}")
    if not user or not role:
        raise HTTPException(status_code=404, detail="User or role not found")
    if role != user.role:
        user.role = role
        db.commit()
    return {"message": f"Role '{role.name}' assigned to user '{user.username}'"}

# Admin: Change user permissions (add/remove)
@router.post("/users/{user_id}/permissions/{permission_id}")
def add_permission(user_id: int, permission_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    from .models import UserPermission
    user = db.query(models.User).filter(models.User.id == user_id).first()
    perm = db.query(models.Permission).filter(models.Permission.id == permission_id).first()
    if not user or not perm:
        raise HTTPException(status_code=404, detail="User or permission not found")
    if not any(up.permission_id == permission_id for up in user.permissions):
        user_perm = UserPermission(user_id=user_id, permission_id=permission_id, is_active=True)
        db.add(user_perm)
        db.commit()
    return {"message": f"Permission '{perm.name}' added to user '{user.username}'"}

@router.delete("/users/{user_id}/permissions/{permission_id}")
def remove_permission(user_id: int, permission_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    from .models import UserPermission
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_perm = db.query(UserPermission).filter_by(user_id=user_id, permission_id=permission_id).first()
    if user_perm:
        db.delete(user_perm)
        db.commit()
    return {"message": "Permission removed from user."}

# Admin: Delete user
@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted."}
