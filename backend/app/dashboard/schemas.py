from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime

# ==================== KPI SCHEMAS ====================

class KPIBase(BaseModel):
    name: str
    description: Optional[str] = None
    level: str
    type: str
    target: str
    unit: Optional[str] = None
    frequency: str
    formula: Optional[str] = None
    reporting_format: Optional[str] = None
    data_source: Optional[str] = None

    @field_validator('level')
    def validate_level(cls, v):
        allowed_levels = ['Operational', 'Managerial', 'Strategic']
        if v not in allowed_levels:
            raise ValueError(f'Level must be one of: {", ".join(allowed_levels)}')
        return v

    @field_validator('frequency')
    def validate_frequency(cls, v):
        allowed_frequencies = ['real-time', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'annually']
        if v.lower() not in allowed_frequencies:
            raise ValueError(f'Frequency must be one of: {", ".join(allowed_frequencies)}')
        return v

class KPICreate(KPIBase):
    pass

class KPI(KPIBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    updated_by: Optional[int] = None

    class Config:
        from_attributes = True

# ==================== TOOL SCHEMAS ====================

class ToolBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: str
    category: str
    vendor: Optional[str] = None
    version: Optional[str] = None
    configuration: Optional[str] = None

    @field_validator('category')
    def validate_category(cls, v):
        allowed_categories = [
            'Sécurité data', 'Sécurité drs identités, accès et mobilité', 'Sécurité des infrastructures, applicatifs et continuité', 
            'Security Perimeter', 'Monitoring de la sécurité et réponse aux incidents',
            'Gouvernance sécurité organisation et ressources'
        ]
        if v not in allowed_categories:
            raise ValueError(f'Category must be one of: {", ".join(allowed_categories)}')
        return v

    @field_validator('type')
    def validate_type(cls, v):
        allowed_types = [
            'firewall', 'antivirus', 'vulnerability scanner', 
            'waf', 'ids_ips', 'web application scanner', 'patch management'
        ]
        if v.lower() not in allowed_types:
            raise ValueError(f'Type must be one of: {", ".join(allowed_types)}')
        return v

class ToolCreate(ToolBase):
    pass

class Tool(ToolBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    updated_by: Optional[int] = None

    class Config:
        from_attributes = True

# ==================== FILE SCHEMAS ====================

class FileBase(BaseModel):
    filename: str
    file_type: str

class FileCreate(FileBase):
    pass

class FileResponse(FileBase):
    id: int
    file_path: str
    uploaded_by: int
    created_at: datetime
    size: int
    status: str
    md5_hash: str

    class Config:
        from_attributes = True

# ==================== LOG SCHEMAS ====================

class LogBase(BaseModel):
    file_id: int
    tool_id: int
    status: str
    message: Optional[str] = None
    raw_data: Optional[str] = None

class LogCreate(LogBase):
    parsed_data: Optional[str] = None

class LogResponse(LogBase):
    id: int
    created_at: datetime
    parsed_data: Optional[str] = None

    class Config:
        from_attributes = True

# ==================== PARSER REQUEST SCHEMAS ====================

class ParseFileRequest(BaseModel):
    file_id: int
    tool_id: int
    user_id: int