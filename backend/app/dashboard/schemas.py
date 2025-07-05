from pydantic import BaseModel
from typing import Optional
from datetime import datetime

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
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class KPICreate(KPIBase):
    pass

class KPI(KPIBase):
    id: int
    updated_by: Optional[int] = None

    class Config:
        from_attributes = True