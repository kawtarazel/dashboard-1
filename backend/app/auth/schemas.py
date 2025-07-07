from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import json
class ConfigurationModel(BaseModel):
    configuration: Optional[str] = None

    @field_validator('configuration')
    def validate_configuration(cls, v):
        if v:
            try:
                json.loads(v)  # Ensure it's valid JSON
            except json.JSONDecodeError:
                raise ValueError('Configuration must be valid JSON')
        return v

from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    username: str
    preference: Optional[str] = None

    @field_validator('preference')
    def validate_preference(cls, v):
        if v:
            try:
                json.loads(v)  # Ensure it's valid JSON
            except json.JSONDecodeError:
                raise ValueError('Preference must be valid JSON')
        return v

class UserCreate(UserBase):
    password: str
    is_verified: bool = False
    verification_token: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
    exp: Optional[datetime] = None

class User(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PermissionBase(BaseModel):
    name: str
    description: Optional[str] = None

class PermissionCreate(PermissionBase):
    pass

class Permission(PermissionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
