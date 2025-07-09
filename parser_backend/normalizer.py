from dataclasses import dataclass, asdict, field
from typing import Optional, Dict, Any
from datetime import datetime
import ipaddress


class SeverityLevel:
    INFO = "Info"
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"
    VALID_LEVELS = {INFO, LOW, MEDIUM, HIGH, CRITICAL}


@dataclass
class Normalizer:
    """Data class for normalized findings with validation and normalization"""
    event_time: Optional[datetime] = field(default=None)
    action: Optional[str] = field(default=None)
    attack_type: Optional[str] = field(default=None)
    policy: Optional[str] = field(default=None)
    bandwidth: Optional[int] = field(default=None)
    ip_source: Optional[str] = field(default=None)
    ip_destination: Optional[str] = field(default=None)
    severity: Optional[str] = field(default=None)
    cvss_base_score: Optional[float] = field(default=None)
    vulnerability_name: Optional[str] = field(default=None)
    malware_type: Optional[str] = field(default=None)
    quarantine_status: Optional[str] = field(default=None)
    log_type: Optional[str] = field(default=None)
    app_name: Optional[str] = field(default=None)
    country_code: Optional[str] = field(default=None)

    def __post_init__(self):
        self._normalize_event_time()
        self._validate_severity()
        self._validate_bandwidth()
        self._validate_cvss_score()
        self._validate_ips()

    def _normalize_event_time(self):
        if isinstance(self.event_time, str):
            for fmt in (
                "%Y-%m-%dT%H:%M:%S",       # ISO without timezone
                "%Y-%m-%d %H:%M:%S",       # Common format
                "%Y-%m-%dT%H:%M:%S.%f",    # ISO with microseconds
                "%a %b %d %H:%M:%S %Y",    # e.g., Mon Jul 1 11:33:11 2025
                "%b %d %Y %H:%M:%S",       # e.g., Jul 1 2025 11:33:11
            ):
                try:
                    self.event_time = datetime.strptime(self.event_time, fmt)
                    return
                except (ValueError, TypeError):
                    continue
            # Last resort: try fromisoformat for full ISO strings
            try:
                self.event_time = datetime.fromisoformat(self.event_time)
            except Exception:
                raise ValueError(f"Invalid event_time format: {self.event_time}")


    def _validate_severity(self):
        if self.severity is not None and self.severity not in SeverityLevel.VALID_LEVELS:
            raise ValueError(f"Invalid severity: {self.severity}. Must be one of {SeverityLevel.VALID_LEVELS}")

    def _validate_bandwidth(self):
        if self.bandwidth is not None and self.bandwidth < 0:
            raise ValueError("Bandwidth must be a non-negative integer")

    def _validate_cvss_score(self):
        if self.cvss_base_score is not None and not (0.0 <= self.cvss_base_score <= 10.0):
            raise ValueError("CVSS base score must be between 0.0 and 10.0")

    def _validate_ips(self):
        for attr in ('ip_source', 'ip_destination'):
            ip = getattr(self, attr)
            if ip is not None:
                try:
                    ipaddress.ip_address(ip)
                except ValueError:
                    raise ValueError(f"Invalid IP address for {attr}: {ip}")

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary, excluding None values. Serialize event_time to ISO format."""
        result: Dict[str, Any] = {}
        for key, value in asdict(self).items():
            if value is None:
                continue
            if isinstance(value, datetime):
                result[key] = value.isoformat()
            else:
                result[key] = value
        return result

    def normalize(self, data: Dict[str, Any]) -> 'Normalizer':
        """Normalize input data into a Normalizer instance."""
        # take the data and create a Normalizer instance, and validate it then return it as a dict
        normalized_data = {
            "event_time": data.get("event_time"),
            "action": data.get("action"),
            "attack_type": data.get("attack_type"),
            "policy": data.get("policy"),
            "bandwidth": data.get("bandwidth"),
            "ip_source": data.get("ip_source"),
            "ip_destination": data.get("ip_destination"),
            "severity": data.get("severity"),
            "cvss_base_score": data.get("cvss_base_score"),
            "vulnerability_name": data.get("vulnerability_name"),
            "malware_type": data.get("malware_type"),
            "quarantine_status": data.get("quarantine_status"),
            "log_type": data.get("log_type"),
            "app_name": data.get("app_name"),
            "country_code": data.get("country_code")
        }
        normalizer = Normalizer(**normalized_data)
        # Validate the instance to ensure all fields are correct
        normalizer.__post_init__()
        # Convert to dict and return
        return normalizer.to_dict()