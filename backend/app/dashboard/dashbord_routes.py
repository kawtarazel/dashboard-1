# backend/app/dashboard/admin_routes.py - NEW FILE
from fastapi import APIRouter, HTTPException, Depends, status, Query, UploadFile, File
import httpx
import hashlib
import os
import json
from typing import List, Optional
from datetime import datetime
from sqlalchemy import func

from . import models, schemas
from .database import get_db
from ..auth.admin_routes import get_current_user, get_admin_user
from ..auth import models as auth_models

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# ==================== KPI MANAGEMENT ====================

@router.get("/kpis", response_model=List[schemas.KPI])
async def get_all_kpis(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    level: Optional[str] = Query(None, description="Filter by level: operational, managerial, strategic"),
    db: Session = Depends(get_db),
    admin: auth_models.User = Depends(get_admin_user)
):
    """Get all KPIs with pagination and filtering"""
    query = db.query(models.KPI)
    
    if level:
        query = query.filter(models.KPI.level.ilike(f"%{level}%"))
    
    kpis = query.offset(skip).limit(limit).all()
    return kpis

@router.get("/kpis/{kpi_id}", response_model=schemas.KPI)
async def get_kpi(
    kpi_id: int,
    db: Session = Depends(get_db),
    admin: auth_models.User = Depends(get_admin_user)
):
    """Get specific KPI by ID"""
    kpi = db.query(models.KPI).filter(models.KPI.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")
    return kpi

@router.post("/kpis", response_model=schemas.KPI)
async def create_kpi(
    kpi: schemas.KPICreate,
    db: Session = Depends(get_db),
    admin: auth_models.User = Depends(get_admin_user)
):
    """Create a new KPI"""
    # Check if KPI with same name already exists
    existing_kpi = db.query(models.KPI).filter(models.KPI.name == kpi.name).first()
    if existing_kpi:
        raise HTTPException(
            status_code=400, 
            detail=f"KPI with name '{kpi.name}' already exists"
        )
    
    new_kpi = models.KPI(
        **kpi.dict(),
        updated_by=admin.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_kpi)
    db.commit()
    db.refresh(new_kpi)
    return new_kpi

@router.put("/kpis/{kpi_id}", response_model=schemas.KPI)
async def update_kpi(
    kpi_id: int,
    kpi_update: schemas.KPICreate,
    db: Session = Depends(get_db),
    admin: auth_models.User = Depends(get_admin_user)
):
    """Update an existing KPI"""
    kpi = db.query(models.KPI).filter(models.KPI.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")
    
    # Check if another KPI with same name exists (excluding current one)
    existing_kpi = db.query(models.KPI).filter(
        models.KPI.name == kpi_update.name,
        models.KPI.id != kpi_id
    ).first()
    if existing_kpi:
        raise HTTPException(
            status_code=400,
            detail=f"Another KPI with name '{kpi_update.name}' already exists"
        )
    
    # Update fields
    for field, value in kpi_update.dict(exclude_unset=True).items():
        setattr(kpi, field, value)
    
    kpi.updated_by = admin.id
    kpi.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(kpi)
    return kpi

@router.delete("/kpis/{kpi_id}")
async def delete_kpi(
    kpi_id: int,
    db: Session = Depends(get_db),
    admin: auth_models.User = Depends(get_admin_user)
):
    """Delete a KPI"""
    kpi = db.query(models.KPI).filter(models.KPI.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")
    
    # Check if KPI has associated values
    kpi_values_count = db.query(models.KPIValue).filter(models.KPIValue.kpi_id == kpi_id).count()
    if kpi_values_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete KPI. It has {kpi_values_count} associated values. Delete them first or use soft delete."
        )
    
    db.delete(kpi)
    db.commit()
    return {"message": f"KPI '{kpi.name}' deleted successfully"}

# ==================== TOOL MANAGEMENT ====================

@router.get("/tools", response_model=List[schemas.Tool])
async def get_all_tools(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    category: Optional[str] = Query(None, description="Filter by category"),
    type: Optional[str] = Query(None, description="Filter by type"),
    db: Session = Depends(get_db),
    admin: auth_models.User = Depends(get_admin_user)
):
    """Get all tools with pagination and filtering"""
    query = db.query(models.Tool)
    
    if category:
        query = query.filter(models.Tool.category.ilike(f"%{category}%"))
    
    if type:
        query = query.filter(models.Tool.type.ilike(f"%{type}%"))
    
    tools = query.offset(skip).limit(limit).all()
    return tools

@router.get("/tools/{tool_id}", response_model=schemas.Tool)
async def get_tool(
    tool_id: int,
    db: Session = Depends(get_db),
    admin: auth_models.User = Depends(get_admin_user)
):
    """Get specific tool by ID"""
    tool = db.query(models.Tool).filter(models.Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool

@router.post("/tools", response_model=schemas.Tool)
async def create_tool(
    tool: schemas.ToolCreate,
    db: Session = Depends(get_db),
    admin: auth_models.User = Depends(get_admin_user)
):
    """Create a new tool"""
    # Check if tool with same name already exists
    existing_tool = db.query(models.Tool).filter(models.Tool.name == tool.name).first()
    if existing_tool:
        raise HTTPException(
            status_code=400,
            detail=f"Tool with name '{tool.name}' already exists"
        )
    
    new_tool = models.Tool(
        **tool.dict(),
        updated_by=admin.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_tool)
    db.commit()
    db.refresh(new_tool)
    return new_tool

@router.put("/tools/{tool_id}", response_model=schemas.Tool)
async def update_tool(
    tool_id: int,
    tool_update: schemas.ToolCreate,
    db: Session = Depends(get_db),
    admin: auth_models.User = Depends(get_admin_user)
):
    """Update an existing tool"""
    tool = db.query(models.Tool).filter(models.Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    # Check if another tool with same name exists (excluding current one)
    existing_tool = db.query(models.Tool).filter(
        models.Tool.name == tool_update.name,
        models.Tool.id != tool_id
    ).first()
    if existing_tool:
        raise HTTPException(
            status_code=400,
            detail=f"Another tool with name '{tool_update.name}' already exists"
        )
    
    # Update fields
    for field, value in tool_update.dict(exclude_unset=True).items():
        setattr(tool, field, value)
    
    tool.updated_by = admin.id
    tool.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(tool)
    return tool

@router.delete("/tools/{tool_id}")
async def delete_tool(
    tool_id: int,
    db: Session = Depends(get_db),
    admin: auth_models.User = Depends(get_admin_user)
):
    """Delete a tool"""
    tool = db.query(models.Tool).filter(models.Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    # Check if tool has associated logs
    logs_count = db.query(models.Log).filter(models.Log.tool_id == tool_id).count()
    if logs_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete tool. It has {logs_count} associated logs. Delete them first or use soft delete."
        )
    
    db.delete(tool)
    db.commit()
    return {"message": f"Tool '{tool.name}' deleted successfully"}

# ==================== STATISTICS ====================

@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin: auth_models.User = Depends(get_admin_user)
):
    """Get dashboard statistics for admin"""
    
    try:
        # KPI statistics
        total_kpis = db.query(models.KPI).count()
        kpis_by_level = {}
        for level in ['operational', 'managerial', 'strategic']:
            count = db.query(models.KPI).filter(models.KPI.level.ilike(f"%{level}%")).count()
            kpis_by_level[level] = count
        
        # Tool statistics
        total_tools = db.query(models.Tool).count()
        tools_by_category = db.query(
            models.Tool.category, 
            func.count(models.Tool.id).label('count')  # ✅ FIXED: Use func.count()
        ).group_by(models.Tool.category).all()
        
        # Log statistics
        total_logs = db.query(models.Log).count()
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        recent_logs = db.query(models.Log).filter(
            models.Log.created_at >= today_start
        ).count()
        
        return {
            "kpis": {
                "total": total_kpis,
                "by_level": kpis_by_level
            },
            "tools": {
                "total": total_tools,
                "by_category": {cat: count for cat, count in tools_by_category}
            },
            "logs": {
                "total": total_logs,
                "today": recent_logs
            },
            "updated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard stats: {str(e)}")

# ==================== FILE MANAGEMENT ====================

UPLOAD_DIR = "uploads"
PARSER_SERVICE_URL = "http://parser_backend:8001"  # Update with your parser service URL

@router.post("/files/upload", response_model=schemas.FileResponse)
async def upload_file(
    file: UploadFile = File(...),
    tool_id: int = Query(..., description="ID of the tool to use for parsing"),
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    # Create uploads directory if it doesn't exist
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Read and save file
    contents = await file.read()
    file_hash = hashlib.md5(contents).hexdigest()
    
    # Create file path
    file_ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{file_hash}{file_ext}")
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Create file record
    db_file = models.File(
        filename=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        uploaded_by=current_user.id,
        size=len(contents),
        status="pending",
        md5_hash=file_hash
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    # Send to parser service asynchronously
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PARSER_SERVICE_URL}/parse",
                json={
                    "file_id": db_file.id,
                    "tool_id": tool_id,
                    "user_id": current_user.id
                }
            )
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Parser service error")
            
            findings = response.json()
            if not isinstance(findings, list):
                raise HTTPException(status_code=500, detail="Invalid response from parser service")
            
            for finding in findings:
                db_log = models.Log(
                    file_id=db_file.id,
                    tool_id=tool_id,
                    status="success",
                    message=f"Parsed {file.filename} with tool ID {tool_id}",
                    raw_data=json.dumps(finding),  # Store raw data from the tool
                    parsed_data=json.dumps(finding),  # Store JSON results
                    event_time=finding.get("event_time", datetime.utcnow()),
                    action=finding.get("action"),
                    attack_type=finding.get("attack_type"),
                    policy=finding.get("policy"),
                    bandwidth=finding.get("bandwidth"),
                    ip_source=finding.get("ip_source"),
                    ip_destination=finding.get("ip_destination"),
                    severity=finding.get("severity"),
                    cvss_base_score=finding.get("cvss_base_score"),
                    vulnerability_name=finding.get("vulnerability_name"),
                    malware_type=finding.get("malware_type"),
                    quarantine_status=finding.get("quarantine_status"),
                    log_type=finding.get("log_type"),
                    app_name=finding.get("app_name"),
                    country_code=finding.get("country_code")
                )

            db.add(db_log)
            db.commit()
            
    except Exception as e:
        # Update file status to failed
        db_file.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))
    
    return db_file

@router.get("/files", response_model=List[schemas.FileResponse])
async def list_files(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    files = db.query(models.File).offset(skip).limit(limit).all()
    return files

@router.get("/files/{file_id}/logs", response_model=List[schemas.LogResponse])
async def get_file_logs(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    logs = db.query(models.Log).filter(models.Log.file_id == file_id).all()
    return logs
