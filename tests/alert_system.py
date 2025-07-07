# backend/app/dashboard/alert_system.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship, Session
from sqlalchemy.sql import func
from datetime import datetime, timedelta
from typing import List, Optional
import enum
from ..auth.models import User
from .database import Base
from .models import KPI
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..core.config import settings
import json

class AlertSeverity(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertStatus(enum.Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    ESCALATED = "escalated"

class AlertRule(Base):
    __tablename__ = "alert_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    kpi_id = Column(Integer, ForeignKey("kpis.id"), nullable=False)
    condition = Column(String, nullable=False)  # e.g., "greater_than", "less_than", "equals"
    threshold = Column(Float, nullable=False)
    severity = Column(Enum(AlertSeverity), nullable=False)
    enabled = Column(Boolean, default=True)
    notification_channels = Column(String)  # JSON array of channels: ["email", "slack", "webhook"]
    escalation_minutes = Column(Integer, default=30)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    kpi = relationship("KPI", backref="alert_rules")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("alert_rules.id"), nullable=False)
    triggered_value = Column(Float, nullable=False)
    message = Column(String)
    severity = Column(Enum(AlertSeverity), nullable=False)
    status = Column(Enum(AlertStatus), default=AlertStatus.ACTIVE)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    acknowledged_at = Column(DateTime(timezone=True))
    acknowledged_by = Column(Integer, ForeignKey("users.id"))
    resolved_at = Column(DateTime(timezone=True))
    resolved_by = Column(Integer, ForeignKey("users.id"))
    escalated_at = Column(DateTime(timezone=True))
    
    rule = relationship("AlertRule")
    acknowledged_user = relationship("User", foreign_keys=[acknowledged_by])
    resolved_user = relationship("User", foreign_keys=[resolved_by])

class AlertNotificationLog(Base):
    __tablename__ = "alert_notification_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False)
    channel = Column(String, nullable=False)  # email, slack, webhook
    recipient = Column(String)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String)  # sent, failed
    error_message = Column(String)
    
    alert = relationship("Alert")

class AlertManager:
    def __init__(self, db: Session):
        self.db = db
    
    def evaluate_rules(self, kpi_id: int, value: float) -> List[Alert]:
        """Evaluate all active rules for a KPI"""
        rules = self.db.query(AlertRule).filter(
            AlertRule.kpi_id == kpi_id,
            AlertRule.enabled == True
        ).all()
        
        triggered_alerts = []
        
        for rule in rules:
            if self._check_condition(value, rule.condition, rule.threshold):
                # Check if similar alert already exists and is active
                existing_alert = self.db.query(Alert).filter(
                    Alert.rule_id == rule.id,
                    Alert.status == AlertStatus.ACTIVE,
                    Alert.triggered_at >= datetime.utcnow() - timedelta(hours=1)
                ).first()
                
                if not existing_alert:
                    alert = self._create_alert(rule, value)
                    triggered_alerts.append(alert)
                    self._send_notifications(alert)
        
        return triggered_alerts
    
    def _check_condition(self, value: float, condition: str, threshold: float) -> bool:
        """Check if value meets the alert condition"""
        conditions = {
            "greater_than": value > threshold,
            "greater_equal": value >= threshold,
            "less_than": value < threshold,
            "less_equal": value <= threshold,
            "equals": value == threshold,
            "not_equals": value != threshold
        }
        return conditions.get(condition, False)
    
    def _create_alert(self, rule: AlertRule, value: float) -> Alert:
        """Create a new alert"""
        kpi = rule.kpi
        message = f"KPI '{kpi.name}' triggered alert: {value} {rule.condition.replace('_', ' ')} {rule.threshold}"
        
        alert = Alert(
            rule_id=rule.id,
            triggered_value=value,
            message=message,
            severity=rule.severity,
            status=AlertStatus.ACTIVE
        )
        
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        
        return alert
    
    def _send_notifications(self, alert: Alert):
        """Send notifications through configured channels"""
        rule = alert.rule
        channels = json.loads(rule.notification_channels or '[]')
        
        for channel in channels:
            try:
                if channel == "email":
                    self._send_email_notification(alert)
                elif channel == "slack":
                    self._send_slack_notification(alert)
                elif channel == "webhook":
                    self._send_webhook_notification(alert)
                
                # Log successful notification
                log = AlertNotificationLog(
                    alert_id=alert.id,
                    channel=channel,
                    status="sent"
                )
                self.db.add(log)
                
            except Exception as e:
                # Log failed notification
                log = AlertNotificationLog(
                    alert_id=alert.id,
                    channel=channel,
                    status="failed",
                    error_message=str(e)
                )
                self.db.add(log)
        
        self.db.commit()
    
    def _send_email_notification(self, alert: Alert):
        """Send email notification"""
        rule = alert.rule
        kpi = rule.kpi
        
        subject = f"[{alert.severity.value.upper()}] Alert: {rule.name}"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
                    <h2 style="color: #dc3545;">🚨 Security Alert Triggered</h2>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Alert:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">{rule.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>KPI:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">{kpi.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Severity:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">
                                <span style="background-color: {'#dc3545' if alert.severity == AlertSeverity.CRITICAL else '#ffc107'}; 
                                             color: white; padding: 5px 10px; border-radius: 3px;">
                                    {alert.severity.value.upper()}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Value:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">{alert.triggered_value} {kpi.unit or ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Threshold:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">{rule.threshold} {kpi.unit or ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Time:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">{alert.triggered_at.strftime('%Y-%m-%d %H:%M:%S UTC')}</td>
                        </tr>
                    </table>
                    
                    <p style="margin-top: 20px;">
                        <a href="http://localhost:5173/dashboard/alerts/{alert.id}" 
                           style="background-color: #007bff; color: white; padding: 10px 20px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            View Alert Details
                        </a>
                    </p>
                </div>
            </body>
        </html>
        """
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = settings.SMTP_USER
        msg['To'] = "security-team@company.com"  # Should come from user preferences
        
        msg.attach(MIMEText(html_body, 'html'))
        
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
    
    def acknowledge_alert(self, alert_id: int, user_id: int) -> Alert:
        """Acknowledge an alert"""
        alert = self.db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.status = AlertStatus.ACKNOWLEDGED
            alert.acknowledged_at = datetime.utcnow()
            alert.acknowledged_by = user_id
            self.db.commit()
        return alert
    
    def resolve_alert(self, alert_id: int, user_id: int) -> Alert:
        """Resolve an alert"""
        alert = self.db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.status = AlertStatus.RESOLVED
            alert.resolved_at = datetime.utcnow()
            alert.resolved_by = user_id
            self.db.commit()
        return alert
    
    def check_escalations(self):
        """Check for alerts that need escalation"""
        cutoff_time = datetime.utcnow() - timedelta(minutes=30)
        
        alerts_to_escalate = self.db.query(Alert).join(AlertRule).filter(
            Alert.status == AlertStatus.ACTIVE,
            Alert.triggered_at <= cutoff_time,
            Alert.escalated_at.is_(None)
        ).all()
        
        for alert in alerts_to_escalate:
            alert.status = AlertStatus.ESCALATED
            alert.escalated_at = datetime.utcnow()
            # Send escalation notifications
            self._send_escalation_notifications(alert)
        
        self.db.commit()

# Add these models to your existing models.py imports
# Also create the alert routes in a new file