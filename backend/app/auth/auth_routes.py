from fastapi import APIRouter, HTTPException, Depends, status
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

from . import models, schemas

from .database import engine, get_db
from . import security
from .config import settings
import uuid
# Initialize logging
import logging

logging.basicConfig(level=logging.INFO)

# Create database tables
models.Base.metadata.create_all(bind=engine)

router = APIRouter(tags=["auth"])

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
@router.post("/auth/signup", response_model=schemas.User)
async def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    logging.info(f"Attempting to sign up user: {user.email} with username: {user.username}")
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

    # Get the default role 'viewer'
    default_role = db.query(models.Role).filter(models.Role.name == 'Viewer').first()
    if not default_role:
        raise HTTPException(status_code=500, detail="Default role 'viewer' not found. Please create it in the roles table.")

    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        verification_token=token,
        is_verified=False,
        role_id=default_role.id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    send_verification_email(user.email, token)

    return db_user

@router.get("/auth/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"message": "Email verified successfully!"}

@router.post("/auth/token", response_model=schemas.Token)
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

@router.post("/auth/refresh", response_model=schemas.Token)
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

# Logout endpoint (JWT: just delete tokens on frontend, but placeholder for blacklist)
@router.post("/auth/logout")
def logout():
    return {"message": "Logged out. Please remove tokens on client."}

@router.get("/auth/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# List all roles
@router.get("/roles")
def get_roles(db: Session = Depends(get_db)):
    try:
        logging.info("Fetching all roles from the database.")
        roles = db.query(models.Role).all()
        return [{"id": role.id, "name": role.name, "description": role.description} for role in roles]
    except Exception as e:
        logging.error(f"Error fetching roles: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching roles")
    
# List all permissions
@router.get("/permissions")
def get_permissions(db: Session = Depends(get_db)):
    return db.query(models.Permission).all()

@router.post("/users/{user_id}/role")
async def assign_role_to_user(
    user_id: int,
    role_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role = db.query(models.Role).filter(models.Role == role_id).all()
    if not role:
        raise HTTPException(status_code=400, detail="Role not found")
    logging.info(f"Assigning role {role} to user {user.username}")
    user.role = role[0]  # Assuming role_id is unique and only one role is returned
    db.commit()
    return {"message": "Role assigned successfully"}

@router.post("/role/{role_id}/permissions")
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

@router.delete("/role/{role_id}/permissions")
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

@router.get("/users/{user_id}/role")
async def get_user_role(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Users can see their own role, superusers can see anyone's role
    if not current_user.is_superuser and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view other user's role")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"role": {"id": user.role.id, "name": user.role.name}}

@router.get("/role/{role_id}/permissions")
async def get_role_permissions(
    role_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    return {"permissions": [{"id": perm.id, "name": perm.name} for perm in role.permissions]}
