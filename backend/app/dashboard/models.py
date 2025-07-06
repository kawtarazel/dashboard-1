from sqlalchemy import Column, Float, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

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
    reporting_format = Column(String, nullable=True)
    data_source = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    updated_by = Column(Integer, nullable=True)

class KPIValue(Base):
    __tablename__ = "kpi_values"

    id = Column(Integer, primary_key=True, index=True)
    kpi_id = Column(Integer, ForeignKey("kpis.id"), nullable=False)
    value = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    kpi = relationship("KPI", back_populates="values")

KPI.values = relationship("KPIValue", order_by=KPIValue.timestamp, back_populates="kpi")

class Tool(Base):
    __tablename__ = "tools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    type = Column(String, nullable=False)
    category = Column(String, nullable=False)
    vendor = Column(String, nullable=True)
    version = Column(String, nullable=True)
    configuration = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    updated_by = Column(Integer, nullable=True)
    
class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    tool_id = Column(Integer, ForeignKey("tools.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    raw_data = Column(String, nullable=False)
    processed_data = Column(String, nullable=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=True)
    # Additional fields for metrics
    # metrics ...
    
    tool = relationship("Tool", back_populates="logs")
    file = relationship("File", back_populates="logs")

Tool.logs = relationship("Log", order_by=Log.created_at, back_populates="tool")

class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    path = Column(String, nullable=False)
    size = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, nullable=False)

    logs = relationship("Log", back_populates="file")