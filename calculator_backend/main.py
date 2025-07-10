# calculator_backend/main.py
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import httpx
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import json
import asyncio
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from core.config import settings
from core.logging import setup_logger

# Set up logging
logger = setup_logger(__name__, level=logging.INFO)

app = FastAPI(title="KPI Calculator Service", version="1.0.0")

# Database setup
SQLALCHEMY_DATABASE_URL = f"postgresql://{settings.DASHBOARD_POSTGRES_USER}:{settings.DASHBOARD_POSTGRES_PASSWORD}@{settings.DASHBOARD_POSTGRES_HOST}:{settings.DASHBOARD_POSTGRES_PORT}/{settings.DASHBOARD_POSTGRES_DB}"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dashboard service URL
DASHBOARD_SERVICE_URL = "http://backend:8000"

# Pydantic models
class CalculationRequest(BaseModel):
    file_id: int
    tool_id: int
    user_id: int
    auth_token: str
    log_count: int
    processed_findings: List[Dict[str, Any]]

class CalculationResponse(BaseModel):
    success: bool
    calculated_kpis: List[Dict[str, Any]]
    message: str

# Database models (simplified versions of what's in dashboard)
class KPI(Base):
    __tablename__ = "kpis"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    level = Column(String, nullable=False)
    type = Column(String, nullable=False)
    target = Column(String, nullable=False)
    unit = Column(String, nullable=True)
    frequency = Column(String, nullable=False)
    formula = Column(String, nullable=True)
    data_source = Column(String, nullable=True)

class KPIValue(Base):
    __tablename__ = "kpi_values"
    
    id = Column(Integer, primary_key=True, index=True)
    kpi_id = Column(Integer, ForeignKey("kpis.id"), nullable=False)
    value = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class Log(Base):
    __tablename__ = "logs"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, nullable=False)
    tool_id = Column(Integer, nullable=False)
    status = Column(String, nullable=False)
    severity = Column(String, nullable=True)
    cvss_base_score = Column(Float, nullable=True)
    vulnerability_name = Column(String, nullable=True)
    ip_source = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class KPICalculator:
    """KPI Calculator that processes findings and calculates KPI values"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_kpis(self, findings: List[Dict[str, Any]], tool_id: int, file_id: int) -> List[Dict[str, Any]]:
        """Calculate KPI values based on processed findings"""
        calculated_kpis = []
        
        try:
            # Get all active KPIs
            kpis = self.db.query(KPI).all()
            logger.info(f"Found {len(kpis)} KPIs to calculate")
            
            for kpi in kpis:
                try:
                    value = self._calculate_kpi_value(kpi, findings, tool_id, file_id)
                    if value is not None:
                        # Store the calculated value
                        kpi_value = KPIValue(
                            kpi_id=kpi.id,
                            value=value,
                            timestamp=datetime.utcnow()
                        )
                        self.db.add(kpi_value)
                        
                        calculated_kpis.append({
                            "kpi_id": kpi.id,
                            "kpi_name": kpi.name,
                            "calculated_value": value,
                            "unit": kpi.unit,
                            "target": kpi.target,
                            "timestamp": datetime.utcnow().isoformat()
                        })
                        
                        logger.info(f"Calculated KPI '{kpi.name}': {value} {kpi.unit or ''}")
                    
                except Exception as e:
                    logger.error(f"Error calculating KPI '{kpi.name}': {str(e)}")
                    continue
            
            # Commit all KPI values
            self.db.commit()
            logger.info(f"Successfully calculated and stored {len(calculated_kpis)} KPI values")
            
        except Exception as e:
            logger.error(f"Error in KPI calculation process: {str(e)}")
            self.db.rollback()
            
        return calculated_kpis
    
    def _calculate_kpi_value(self, kpi: KPI, findings: List[Dict[str, Any]], tool_id: int, file_id: int) -> Optional[float]:
        """Calculate individual KPI value based on its type and formula"""
        
        try:
            # Security-related KPI calculations
            if "security" in kpi.type.lower() or "vulnerability" in kpi.type.lower():
                return self._calculate_security_kpi(kpi, findings)
            
            # Performance-related KPI calculations
            elif "performance" in kpi.type.lower() or "system" in kpi.type.lower():
                return self._calculate_performance_kpi(kpi, findings)
            
            # Compliance-related KPI calculations
            elif "compliance" in kpi.type.lower() or "policy" in kpi.type.lower():
                return self._calculate_compliance_kpi(kpi, findings)
            
            # Generic calculation based on formula if available
            elif kpi.formula:
                return self._calculate_formula_based_kpi(kpi, findings)
            
            else:
                logger.warning(f"No calculation method found for KPI type: {kpi.type}")
                return None
                
        except Exception as e:
            logger.error(f"Error calculating KPI '{kpi.name}': {str(e)}")
            return None
    
    def _calculate_security_kpi(self, kpi: KPI, findings: List[Dict[str, Any]]) -> Optional[float]:
        """Calculate security-related KPIs"""
        
        if not findings:
            return 0.0
        
        total_findings = len(findings)
        
        # High/Critical vulnerability count
        if "high" in kpi.name.lower() or "critical" in kpi.name.lower():
            high_critical_count = sum(1 for f in findings 
                                    if f.get('severity', '').lower() in ['high', 'critical'])
            return float(high_critical_count)
        
        # Vulnerability density (vulnerabilities per host)
        elif "density" in kpi.name.lower():
            unique_hosts = len(set(f.get('ip_source', 'unknown') for f in findings))
            if unique_hosts > 0:
                return round(total_findings / unique_hosts, 2)
            return 0.0
        
        # Average CVSS score
        elif "cvss" in kpi.name.lower() or "average" in kpi.name.lower():
            cvss_scores = [f.get('cvss_base_score', 0) for f in findings if f.get('cvss_base_score')]
            if cvss_scores:
                return round(sum(cvss_scores) / len(cvss_scores), 2)
            return 0.0
        
        # Exploitable vulnerabilities percentage
        elif "exploitable" in kpi.name.lower():
            exploitable_count = sum(1 for f in findings if f.get('exploitable', False))
            return round((exploitable_count / total_findings) * 100, 2) if total_findings > 0 else 0.0
        
        # Default: total vulnerability count
        else:
            return float(total_findings)
    
    def _calculate_performance_kpi(self, kpi: KPI, findings: List[Dict[str, Any]]) -> Optional[float]:
        """Calculate performance-related KPIs"""
        
        # Scan coverage (number of hosts scanned)
        if "coverage" in kpi.name.lower() or "hosts" in kpi.name.lower():
            unique_hosts = len(set(f.get('ip_source', 'unknown') for f in findings))
            return float(unique_hosts)
        
        # Scan completion rate (assuming 100% if we have findings)
        elif "completion" in kpi.name.lower():
            return 100.0 if findings else 0.0
        
        # Default performance metric
        else:
            return 100.0 if findings else 0.0
    
    def _calculate_compliance_kpi(self, kpi: KPI, findings: List[Dict[str, Any]]) -> Optional[float]:
        """Calculate compliance-related KPIs"""
        
        if not findings:
            return 100.0  # 100% compliant if no issues found
        
        total_findings = len(findings)
        
        # Policy violations
        if "policy" in kpi.name.lower() or "violation" in kpi.name.lower():
            policy_violations = sum(1 for f in findings if f.get('policy'))
            return float(policy_violations)
        
        # Compliance percentage (inverse of findings)
        elif "compliance" in kpi.name.lower():
            # Assume lower findings = higher compliance
            # This is a simplified calculation - in reality, you'd have specific compliance rules
            max_acceptable_findings = 10  # This should be configurable
            compliance_rate = max(0, (max_acceptable_findings - total_findings) / max_acceptable_findings * 100)
            return round(compliance_rate, 2)
        
        else:
            return float(total_findings)
    
    def _calculate_formula_based_kpi(self, kpi: KPI, findings: List[Dict[str, Any]]) -> Optional[float]:
        """Calculate KPI using custom formula"""
        
        try:
            # This is a simplified formula evaluator
            # In production, you might want to use a more robust expression evaluator
            
            formula = kpi.formula.lower()
            
            # Replace common variables with actual values
            total_findings = len(findings)
            unique_hosts = len(set(f.get('ip_source', 'unknown') for f in findings))
            high_severity = sum(1 for f in findings if f.get('severity', '').lower() in ['high', 'critical'])
            
            # Simple variable substitution
            formula = formula.replace('total_findings', str(total_findings))
            formula = formula.replace('unique_hosts', str(unique_hosts))
            formula = formula.replace('high_severity', str(high_severity))
            
            # Evaluate the formula (be careful with eval in production!)
            # In a real implementation, use a safe expression evaluator
            result = eval(formula)
            return float(result)
            
        except Exception as e:
            logger.error(f"Error evaluating formula '{kpi.formula}': {str(e)}")
            return None

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "calculator_backend"}

@app.post("/calculate", response_model=CalculationResponse)
async def calculate_kpis(request: CalculationRequest):
    """Calculate KPIs based on processed findings"""
    
    try:
        logger.info(f"Starting KPI calculation for file_id: {request.file_id}, tool_id: {request.tool_id}")
        logger.info(f"Received {len(request.processed_findings)} findings to process")
        
        # Get database session
        db = next(get_db())
        
        try:
            # Initialize calculator
            calculator = KPICalculator(db)
            
            # Calculate KPIs
            calculated_kpis = calculator.calculate_kpis(
                request.processed_findings, 
                request.tool_id, 
                request.file_id
            )
            
            logger.info(f"Successfully calculated {len(calculated_kpis)} KPIs")
            
            return CalculationResponse(
                success=True,
                calculated_kpis=calculated_kpis,
                message=f"Successfully calculated {len(calculated_kpis)} KPI values"
            )
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error in KPI calculation: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error calculating KPIs: {str(e)}"
        )

@app.post("/calculate-batch")
async def calculate_kpis_batch(background_tasks: BackgroundTasks, request: CalculationRequest):
    """Calculate KPIs in background for large datasets"""
    
    background_tasks.add_task(calculate_kpis_background, request)
    
    return {
        "message": "KPI calculation started in background",
        "file_id": request.file_id,
        "status": "processing"
    }

async def calculate_kpis_background(request: CalculationRequest):
    """Background task for KPI calculation"""
    try:
        await calculate_kpis(request)
        logger.info(f"Background KPI calculation completed for file_id: {request.file_id}")
    except Exception as e:
        logger.error(f"Background KPI calculation failed for file_id: {request.file_id}: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)