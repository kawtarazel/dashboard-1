from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from .config import settings

SQLALCHEMY_DATABASE_URL = f"postgresql://{settings.DASHBOARD_POSTGRES_USER}:{settings.DASHBOARD_POSTGRES_PASSWORD}@{settings.DASHBOARD_POSTGRES_HOST}:{settings.DASHBOARD_POSTGRES_PORT}/{settings.DASHBOARD_POSTGRES_DB}"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

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