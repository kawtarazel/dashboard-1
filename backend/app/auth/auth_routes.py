# backend/app/auth/auth_routes.py - FIXED VERSION with decorator
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt
from fastapi import Form, Body
from slowapi import Limiter
from slowapi.util import get_remote_address

from . import models, schemas
from .database import get_db
from . import security
from ..core.config import settings
from email.mime.text import MIMEText
import uuid
import smtplib
import logging

logging.basicConfig(level=logging.INFO)

router = APIRouter(tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ✅ FIXED: Create module-level limiter for decorators
limiter = Limiter(key_func=get_remote_address)

def send_verification_email(email: str, token: str):
    """Send email verification"""
    try:
        link = f"http://localhost:8000/api/auth/verify-email?token={token}"
        msg = MIMEText(f"Click the link to verify your email: {link}")
        msg["Subject"] = "Verify your email"
        msg["From"] = settings.SMTP_USER
        msg["To"] = email

        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, [email], msg.as_string())
        logging.info(f"Verification email sent to {email}")
    except Exception as e:
        logging.error(f"Failed to send verification email: {e}")

@router.post("/auth/signup", response_model=schemas.User)
async def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """User registration endpoint"""
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
    
    # Enforce strong password policy
    import re
    pw = user.password
    if not pw or len(pw) < 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 12 characters long."
        )
    if not re.search(r"[a-z]", pw):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter."
        )
    if not re.search(r"[A-Z]", pw):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter."
        )
    if not re.search(r"[0-9]", pw):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one digit."
        )
    if not re.search(r"[^a-zA-Z0-9]", pw):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character."
        )
    # Hash password
    hashed_password = security.get_password_hash(user.password)
    token = str(uuid.uuid4())

    # Get the default role 'Viewer'
    default_role = db.query(models.Role).filter(models.Role.name == 'Viewer').first()
    if not default_role:
        raise HTTPException(
            status_code=500, 
            detail="Default role 'Viewer' not found. Please contact administrator."
        )

    # Create user
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

    # Send verification email (non-blocking)
    send_verification_email(user.email, token)
    
    return db_user

@router.get("/auth/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    """Email verification endpoint"""
    user = db.query(models.User).filter(models.User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"message": "Email verified successfully!"}

# ✅ FIXED: Use decorator for rate limiting
@router.post("/auth/token", response_model=schemas.Token)
@limiter.limit("5/minute")
async def login(
    request: Request,  # Required for rate limiting
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """Login endpoint with rate limiting"""
    logging.info(f"Attempting login with email: {email}")

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

    # Create tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    refresh_token = security.create_refresh_token(
        data={"sub": user.email}
    )

    logging.info(f"Login successful for user: {email}")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/auth/refresh", response_model=schemas.Token)
async def refresh_token(current_token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Refresh access token"""
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

    # Create new tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    refresh_token = security.create_refresh_token(
        data={"sub": user.email}
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    """Get current authenticated user, with token blacklist check"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    # Blacklist check
    if security.is_token_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please log in again.",
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


@router.post("/auth/logout")
def logout(token: str = Depends(oauth2_scheme)):
    """Logout endpoint: Blacklist the current token"""
    security.blacklist_token(token)
    return {"message": "Logged out. Token has been revoked."}

@router.get("/auth/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

@router.get("/roles")
def get_roles(db: Session = Depends(get_db)):
    """Get all available roles"""
    try:
        logging.info("Fetching all roles from the database.")
        roles = db.query(models.Role).all()
        return [{"id": role.id, "name": role.name, "description": role.description} for role in roles]
    except Exception as e:
        logging.error(f"Error fetching roles: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching roles")
    
@router.get("/permissions")
def get_permissions(db: Session = Depends(get_db)):
    """Get all available permissions"""
    return db.query(models.Permission).all()

# Rest of the endpoints remain the same...
@router.post("/users/{user_id}/role")
async def assign_role_to_user(
    user_id: int,
    role_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Assign role to user"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=400, detail="Role not found")
        
    logging.info(f"Assigning role {role.name} to user {user.username}")
    user.role = role
    db.commit()
    return {"message": "Role assigned successfully"}

@router.get("/users/{user_id}/role")
async def get_user_role(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's role"""
    if not current_user.is_superuser and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view other user's role")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"role": {"id": user.role.id, "name": user.role.name}}