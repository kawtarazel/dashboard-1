# test routes for the dashboard module
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import schemas
from ..auth import models
from .database import get_db
from ..auth.admin_routes import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
@router.get("/kpis", response_model=list[schemas.KPI])
def get_kpis(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Retrieve all KPIs.
    """
    kpis = db.query(models.KPI).all()
    return kpis


@router.get("/kpi/{kpi_id}", response_model=schemas.KPI)
def get_kpi(kpi_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Retrieve a specific KPI by ID.
    """
    kpi = db.query(models.KPI).filter(models.KPI.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")
    return kpi

@router.post("/kpi", response_model=schemas.KPI)
def create_kpi(kpi: schemas.KPICreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Create a new KPI.
    """
    new_kpi = models.KPI(**kpi.dict(), updated_by=current_user.id)
    db.add(new_kpi)
    db.commit()
    db.refresh(new_kpi)
    return new_kpi