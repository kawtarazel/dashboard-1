from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean

# schemas for this : 
# @router.post("/kpi", response_model=schemas.KPI)
# def create_kpi(kpi: schemas.KPICreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
#     """
#     Create a new KPI.
#     """
#     new_kpi = models.KPI(**kpi.dict(), updated_by=current_user.id)
#     db.add(new_kpi)
#     db.commit()
#     db.refresh(new_kpi)
#     return new_kpi

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