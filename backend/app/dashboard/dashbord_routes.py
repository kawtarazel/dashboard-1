# backend/app/dashboard/admin_routes.py - NEW FILE
from fastapi import APIRouter, HTTPException, Depends, status, Query, UploadFile, File
import httpx
import hashlib
import os
import json
from typing import List, Optional
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session

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
    current_user: auth_models.User = Depends(get_current_user)
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
    current_user: auth_models.User = Depends(get_current_user)
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
    admin: auth_models.User = Depends(get_current_user)
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
    admin: auth_models.User = Depends(get_current_user)
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
    admin: auth_models.User = Depends(get_current_user)
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
from fastapi import Request, Header

UPLOAD_DIR = "uploads"
PARSER_SERVICE_URL = "http://parser_backend:8001"  # Update with your parser service URL
import logging
# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Updated upload_file function in dashboard_routes.py
@router.post("/files/upload", response_model=schemas.FileResponse)
async def upload_file(
    file: UploadFile = File(...),
    tool_id: int = Query(..., description="ID of the tool to use for parsing"),
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user),
    authorization: str = Header(None)
):
    """Upload and parse a security report file"""
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
    token = authorization.split(" ")[1] if authorization else None
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PARSER_SERVICE_URL}/parse",
                json={
                    "file_id": db_file.id,
                    "tool_id": tool_id,
                    "user_id": current_user.id,
                    "auth_token": token
                },
                timeout=300.0  # 5 minutes timeout for parsing
            )
            
            if response.status_code != 200:
                try:
                    # Try to extract the parser's error detail
                    error_detail = response.json().get("detail", "Unknown parser error")
                except:
                    error_detail = response.text  # Fallback to raw response
                logger.error(error_detail)
                db_file.status = "failed"
                db.commit()
                
                # Create error log
                error_log = models.Log(
                    file_id=db_file.id,
                    tool_id=tool_id,
                    status="failed",
                    message=error_detail,
                    raw_data=response.text
                )
                db.add(error_log)
                db.commit()
                
                raise HTTPException(
                    status_code=response.status_code,  # Preserve original status code
                    detail=error_detail  # Forward the parser's error message
                )
            
            # Parse response - expecting list of normalized findings
            findings = response.json()["findings"]
            if not isinstance(findings, list):
                error_msg = "Invalid response format from parser service"
                logger.error(error_msg)
                db_file.status = "failed"
                db.commit()
                raise HTTPException(status_code=500, detail=error_msg)
            
            # Store findings in database
            for parsed_finding in findings:  # findings is now a list of {raw_finding, normalized_finding}
                try:
                    raw_data = parsed_finding["raw_finding"]
                    normalized_data = parsed_finding["normalized_finding"]

                    # Convert datetime if present (from normalized data)
                    event_time = None
                    if normalized_data.get("event_time"):
                        try:
                            event_time = datetime.fromisoformat(normalized_data["event_time"])
                        except ValueError:
                            logger.warning(f"Invalid event_time format: {normalized_data['event_time']}")

                    # Create log entry
                    db_log = models.Log(
                        file_id=db_file.id,
                        tool_id=tool_id,
                        status="success",
                        message=f"Parsed {file.filename} with tool ID {tool_id}",
                        raw_data=json.dumps(raw_data),          # Store original finding
                        parsed_data=json.dumps(normalized_data), # Store normalized data
                        event_time=event_time,
                        # Map normalized fields to database columns
                        action=normalized_data.get("action"),
                        attack_type=normalized_data.get("attack_type"),
                        policy=normalized_data.get("policy"),
                        bandwidth=normalized_data.get("bandwidth"),
                        ip_source=normalized_data.get("ip_source"),
                        ip_destination=normalized_data.get("ip_destination"),
                        severity=normalized_data.get("severity"),
                        cvss_base_score=normalized_data.get("cvss_base_score"),
                        vulnerability_name=normalized_data.get("vulnerability_name"),
                        malware_type=normalized_data.get("malware_type"),
                        quarantine_status=normalized_data.get("quarantine_status"),
                        log_type=normalized_data.get("log_type"),
                        app_name=normalized_data.get("app_name"),
                        country_code=normalized_data.get("country_code")
                    )
                    db.add(db_log)
                    
                except Exception as e:
                    logger.error(f"Error storing finding: {str(e)}")
                    continue
            
            # Update file status to processed
            db_file.status = "processed"
            db.commit()
            
            logger.info(f"Successfully processed {len(findings)} findings from {file.filename}")
            
    except httpx.TimeoutException:
        error_msg = "Parser service timeout"
        logger.error(error_msg)
        db_file.status = "failed"
        db.commit()
        raise HTTPException(status_code=504, detail=error_msg)
    except Exception as e:
        error_msg = f"Error processing file: {str(e)}"
        logger.error(error_msg)
        db_file.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=error_msg)
    
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

@router.get("/files/{file_id}", response_model=schemas.FileResponse)
async def get_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    """Get specific file by ID"""
    file = db.query(models.File).filter(models.File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return file

@router.get("/files/{file_id}/logs", response_model=List[schemas.LogResponse])
async def get_file_logs(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    logs = db.query(models.Log).filter(models.Log.file_id == file_id).all()
    return logs

# ==================== KPI VALUES ====================

@router.get("/kpi-values")
async def get_kpi_values(
    kpi_id: Optional[int] = Query(None, description="Filter by KPI ID"),
    start_date: Optional[datetime] = Query(None, description="Start date for filtering"),
    end_date: Optional[datetime] = Query(None, description="End date for filtering"),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    """Get KPI values with filtering options"""
    
    query = db.query(models.KPIValue).join(models.KPI)
    
    if kpi_id:
        query = query.filter(models.KPIValue.kpi_id == kpi_id)
    
    if start_date:
        query = query.filter(models.KPIValue.timestamp >= start_date)
    
    if end_date:
        query = query.filter(models.KPIValue.timestamp <= end_date)
    
    # Order by timestamp descending
    kpi_values = query.order_by(models.KPIValue.timestamp.desc()).limit(limit).all()
    
    # Format response
    result = []
    for kpi_value in kpi_values:
        result.append({
            "id": kpi_value.id,
            "kpi_id": kpi_value.kpi_id,
            "kpi_name": kpi_value.kpi.name,
            "value": kpi_value.value,
            "timestamp": kpi_value.timestamp.isoformat(),
            "kpi_unit": kpi_value.kpi.unit,
            "kpi_target": kpi_value.kpi.target
        })
    
    return result

@router.get("/kpi-values/{kpi_id}/latest")
async def get_latest_kpi_value(
    kpi_id: int,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    """Get the latest value for a specific KPI"""
    
    kpi_value = db.query(models.KPIValue).filter(
        models.KPIValue.kpi_id == kpi_id
    ).order_by(models.KPIValue.timestamp.desc()).first()
    
    if not kpi_value:
        raise HTTPException(status_code=404, detail="No values found for this KPI")
    
    return {
        "id": kpi_value.id,
        "kpi_id": kpi_value.kpi_id,
        "kpi_name": kpi_value.kpi.name,
        "value": kpi_value.value,
        "timestamp": kpi_value.timestamp.isoformat(),
        "kpi_unit": kpi_value.kpi.unit,
        "kpi_target": kpi_value.kpi.target
    }