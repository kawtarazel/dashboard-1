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
    
class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    uploaded_by = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    size = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending, processed, failed
    md5_hash = Column(String, nullable=False)

    # Relationships
    logs = relationship("Log", back_populates="file")

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    tool_id = Column(Integer, ForeignKey("tools.id"), nullable=False)
    status = Column(String, nullable=False)  # success, failed
    message = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    raw_data = Column(String, nullable=True)  # Store raw data from the tool
    parsed_data = Column(String, nullable=True)  # Store JSON results
    event_time = Column(DateTime(timezone=True), nullable=True)
    action = Column(String, nullable=True)
    attack_type = Column(String, nullable=True)
    policy = Column(String, nullable=True)
    bandwidth = Column(Float, nullable=True)  # e.g., in Mbps
    ip_source = Column(String, nullable=True)  # Source IP address
    ip_destination = Column(String, nullable=True)  # Destination IP address
    severity = Column(String, nullable=True)  # e.g., low, medium, high
    cvss_base_score = Column(Float, nullable=True)  # Common Vulnerability Scoring System score
    vulnerability_name = Column(String, nullable=True)  # Name of the vulnerability
    malware_type = Column(String, nullable=True)  # Type of malware detected
    quarantine_status = Column(String, nullable=True)  # e.g., quarantined, not quarantined
    log_type = Column(String, nullable=True)
    app_name = Column(String, nullable=True) 
    country_code = Column(String, nullable=True)

    # Relationships
    file = relationship("File", back_populates="logs")
    tool = relationship("Tool", backref="logs")