from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
from jose import JWTError, jwt
from fastapi import Form, Security
from fastapi.security import HTTPAuthorizationCredentials
from fastapi import Body

# Utility to get current user and check admin
from fastapi import Request

from .database import engine, get_db
from . import models, schemas, security
from .config import settings
import uuid
# Initialize logging
import logging

logging.basicConfig(level=logging.INFO)

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Security Dashboard API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

from email.mime.text import MIMEText
import smtplib
from .config import settings

def send_verification_email(email: str, token: str):
    link = f"http://localhost:8000/api/auth/verify-email?token={token}"  # Replace domain in prod
    msg = MIMEText(f"Click the link to verify your email: {link}")
    msg["Subject"] = "Verify your email"
    msg["From"] = settings.SMTP_USER
    msg["To"] = email

    with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, [email], msg.as_string())

# Authentication endpoints
@app.post("/api/auth/signup", response_model=schemas.User)
async def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(models.User).filter(
        (models.User.email == user.email) | 
        (models.User.username == user.username)
    ).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )
    
    hashed_password = security.get_password_hash(user.password)
    token = str(uuid.uuid4())

    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        verification_token=token,
        is_verified=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    send_verification_email(user.email, token)

    return db_user

@app.get("/api/auth/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"message": "Email verified successfully!"}

@app.post("/api/auth/token", response_model=schemas.Token)
async def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    logging.info(f"Attempting login with email: {email}")
    logging.debug(f"Password received: {password}")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in.",
            headers={"X-Error-Code": "EMAIL_NOT_VERIFIED"}
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    # Create refresh token
    refresh_token = security.create_refresh_token(
        data={"sub": user.email}
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@app.post("/api/auth/refresh", response_model=schemas.Token)
async def refresh_token(current_token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            current_token, 
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception

    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    # Create new refresh token
    refresh_token = security.create_refresh_token(
        data={"sub": user.email}
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

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
@app.on_event("startup")
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
            is_verified=True
        )
        db.add(admin)
        db.commit()

# Logout endpoint (JWT: just delete tokens on frontend, but placeholder for blacklist)
@app.post("/api/auth/logout")
def logout():
    return {"message": "Logged out. Please remove tokens on client."}


# Admin: List all users with roles and permissions
@app.get("/api/admin/users")
def list_users(db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    try:
        users = db.query(models.User).all()
        result = []
        for user in users:
            roles = [{"id": r.id, "name": r.name} for r in user.roles]
            # Collect permissions from roles and direct user permissions if any
            permissions_set = set()
            # Permissions from roles
            for role in user.roles:
                for perm in role.permissions:
                    permissions_set.add((perm.id, perm.name))
            # If you have direct user permissions, add them here as well
            # for perm in user.permissions:
            #     permissions_set.add((perm.id, perm.name))
            permissions = [{"id": pid, "name": pname} for pid, pname in permissions_set]
            result.append({
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "is_active": user.is_active,
                "is_superuser": user.is_superuser,
                "is_verified": user.is_verified,
                "roles": roles,
                "permissions": permissions
            })
        logging.info(f"Fetched {len(result)} users from the database.")
        return result
    finally:
        logging.info("Fetched all users successfully.")
        db.close()

# Admin: Assign role to user
@app.post("/api/admin/users/{user_id}/roles/{role_id}")
def assign_role(user_id: int, role_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not user or not role:
        raise HTTPException(status_code=404, detail="User or role not found")
    if role not in user.roles:
        user.roles.append(role)
        db.commit()
    return {"message": f"Role '{role.name}' assigned to user '{user.username}'"}

# Admin: Remove role from user
@app.delete("/api/admin/users/{user_id}/roles/{role_id}")
def remove_role(user_id: int, role_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not user or not role:
        raise HTTPException(status_code=404, detail="User or role not found")
    if role in user.roles:
        user.roles.remove(role)
        db.commit()
    return {"message": f"Role '{role.name}' removed from user '{user.username}'"}

# Admin: Change user permissions (add/remove)
@app.post("/api/admin/users/{user_id}/permissions/{permission_id}")
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

@app.delete("/api/admin/users/{user_id}/permissions/{permission_id}")
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
@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted."}


# List all roles
@app.get("/api/roles")
def get_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).all()

# List all permissions
@app.get("/api/permissions")
def get_permissions(db: Session = Depends(get_db)):
    return db.query(models.Permission).all()

@app.get("/api/auth/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/api/users/{user_id}/roles")
async def assign_roles_to_user(
    user_id: int,
    role_ids: dict = Body(..., example={"role_ids": [1, 2]}),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    roles = db.query(models.Role).filter(models.Role.id.in_(role_ids["role_ids"])).all()
    if len(roles) != len(role_ids["role_ids"]):
        raise HTTPException(status_code=400, detail="Some roles were not found")
    
    user.roles.extend([role for role in roles if role not in user.roles])
    db.commit()
    return {"message": "Roles assigned successfully"}

@app.delete("/api/users/{user_id}/roles")
async def remove_roles_from_user(
    user_id: int,
    role_ids: dict = Body(..., example={"role_ids": [1, 2]}),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    roles = db.query(models.Role).filter(models.Role.id.in_(role_ids["role_ids"])).all()
    if len(roles) != len(role_ids["role_ids"]):
        raise HTTPException(status_code=400, detail="Some roles were not found")
    
    for role in roles:
        if role in user.roles:
            user.roles.remove(role)
    
    db.commit()
    return {"message": "Roles removed successfully"}

@app.post("/api/roles/{role_id}/permissions")
async def assign_permissions_to_role(
    role_id: int,
    permission_ids: dict = Body(..., example={"permission_ids": [1, 2]}),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    permissions = db.query(models.Permission).filter(models.Permission.id.in_(permission_ids["permission_ids"])).all()
    if len(permissions) != len(permission_ids["permission_ids"]):
        raise HTTPException(status_code=400, detail="Some permissions were not found")
    
    role.permissions.extend([perm for perm in permissions if perm not in role.permissions])
    db.commit()
    return {"message": "Permissions assigned successfully"}

@app.delete("/api/roles/{role_id}/permissions")
async def remove_permissions_from_role(
    role_id: int,
    permission_ids: dict = Body(..., example={"permission_ids": [1, 2]}),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    permissions = db.query(models.Permission).filter(models.Permission.id.in_(permission_ids["permission_ids"])).all()
    if len(permissions) != len(permission_ids["permission_ids"]):
        raise HTTPException(status_code=400, detail="Some permissions were not found")
    
    for permission in permissions:
        if permission in role.permissions:
            role.permissions.remove(permission)
    
    db.commit()
    return {"message": "Permissions removed successfully"}

@app.get("/api/users/{user_id}/roles")
async def get_user_roles(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Users can see their own roles, superusers can see anyone's roles
    if not current_user.is_superuser and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view other user's roles")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"roles": [{"id": role.id, "name": role.name} for role in user.roles]}

@app.get("/api/roles/{role_id}/permissions")
async def get_role_permissions(
    role_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    return {"permissions": [{"id": perm.id, "name": perm.name} for perm in role.permissions]}
