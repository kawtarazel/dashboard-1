import xml.etree.ElementTree as ET
import json
import re
from datetime import datetime
from typing import Dict, List, Optional, Any, Generator
from dataclasses import dataclass, asdict

import logging
from core.logging import setup_logger
logger = setup_logger(__name__, level=logging.INFO)

@dataclass
class NessusFinding:
    """Data class for Nessus findings with validation"""
    host_fqdn: Optional[str] = None
    mac_address: Optional[str] = None
    ip_source: Optional[str] = None
    host_os: Optional[str] = None
    event_time: Optional[str] = None
    scan_duration: Optional[str] = None
    scanner_ip: Optional[str] = None
    vulnerability_name: Optional[str] = None
    plugin_id: Optional[str] = None
    severity: str = "Info"
    cvss_base_score: float = 0.0
    exploitable: bool = False
    metasploit_available: bool = False
    metasploit_name: Optional[str] = None
    details: Optional[str] = None
    solution: Optional[str] = None
    port: Optional[int] = None
    protocol: Optional[str] = None
    service: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary, excluding None values"""
        result = {}
        for key, value in asdict(self).items():
            if value is not None:
                result[key] = value
        return result

class NessusParser:
    """Enhanced Nessus XML parser with better error handling and performance"""
    
    SEVERITY_MAP = {
        "0": "Info",
        "1": "Low",
        "2": "Medium",
        "3": "High",
        "4": "Critical"
    }
    
    # Plugin IDs to skip (informational plugins)
    SKIP_PLUGIN_IDS = {"19506", "10287", "11936"}  # Common scan info plugins
    
    def __init__(self, max_findings: Optional[int] = None):
        """
        Initialize parser.
        
        Args:
            max_findings: Maximum number of findings to return (for large reports)
        """
        self.max_findings = max_findings
        self.findings_count = 0
        
    def parse_report(self, file_content: str, filename: str) -> List[Dict[str, Any]]:
        """
        Parse a Nessus XML report and return findings.
        
        Args:
            file_content: The content of the Nessus XML file
            filename: The name of the file being parsed
            
        Returns:
            List of findings dictionaries
        """
        try:
            # Parse XML with iterparse for better memory efficiency
            root = ET.fromstring(file_content)
            findings = list(self._parse_findings(root))
            
            logger.info(f"Successfully parsed {len(findings)} findings from {filename}")
            return findings
            
        except ET.ParseError as e:
            logger.error(f"Invalid XML in {filename}: {str(e)}")
            raise ValueError(f"Invalid XML file: {str(e)}")
        except Exception as e:
            logger.error(f"Error parsing {filename}: {str(e)}")
            raise ValueError(f"Error parsing Nessus file: {str(e)}")
    
    def _parse_findings(self, root: ET.Element) -> Generator[Dict[str, Any], None, None]:
        """Generate findings from the XML root element"""
        report_hosts = root.findall(".//ReportHost")
        
        for report_host in report_hosts:
            # Extract host information
            host_info = self._extract_host_info(report_host)
            
            # Extract scan metadata
            scan_info = self._extract_scan_info(report_host)
            
            # Process report items
            report_items = report_host.findall(".//ReportItem")
            
            for report_item in report_items:
                # Check if we've reached the max findings limit
                if self.max_findings and self.findings_count >= self.max_findings:
                    logger.warning(f"Reached maximum findings limit: {self.max_findings}")
                    return
                
                # Skip informational plugins
                plugin_id = report_item.get("pluginID", "")
                if plugin_id in self.SKIP_PLUGIN_IDS:
                    continue
                
                finding = self._create_finding(report_item, host_info, scan_info)
                if finding:
                    self.findings_count += 1
                    yield finding.to_dict()
                    #############################################
    
    def _extract_host_info(self, report_host: ET.Element) -> Dict[str, Optional[str]]:
        """Extract host information from ReportHost element"""
        host_info = {
            "host_fqdn": None,
            "ip_source": None,
            "mac_address": None,
            "host_os": None
        }
        
        # First check attributes
        host_info["ip_source"] = report_host.get("name")
        
        # Then check tags
        tag_mapping = {
            "host-fqdn": "host_fqdn",
            "host-ip": "ip_source",
            "mac-address": "mac_address",
            "operating-system": "host_os"
        }
        
        for tag in report_host.findall(".//tag"):
            tag_name = tag.get("name")
            if tag_name in tag_mapping:
                host_info[tag_mapping[tag_name]] = tag.text
        
        return host_info
    
    def _extract_scan_info(self, report_host: ET.Element) -> Dict[str, Optional[str]]:
        """Extract scan information from ReportHost element"""
        scan_info = {
            "event_time": None,
            "scan_duration": None,
            "scanner_ip": None
        }
        
        # Extract from tags
        for tag in report_host.findall(".//tag"):
            if tag.get("name") == "HOST_START":
                scan_info["event_time"] = tag.text
        
        # Extract from Nessus Scan Information plugin if present
        scan_info_item = report_host.find(".//ReportItem[@pluginName='Nessus Scan Information']")
        if scan_info_item is not None:
            plugin_output = scan_info_item.findtext("plugin_output", "")
            
            # Extract scan duration
            duration_match = re.search(r'Scan duration : (\d+) sec', plugin_output)
            if duration_match:
                scan_info["scan_duration"] = f"{duration_match.group(1)} seconds"
            
            # Extract scanner IP
            scanner_match = re.search(r'Scanner IP : ([\d.]+)', plugin_output)
            if scanner_match:
                scan_info["scanner_ip"] = scanner_match.group(1)
        
        return scan_info
    
    def _create_finding(self, 
                       report_item: ET.Element, 
                       host_info: Dict[str, Optional[str]], 
                       scan_info: Dict[str, Optional[str]]) -> Optional[NessusFinding]:
        """Create a finding from a ReportItem element"""
        try:
            # Extract basic information
            severity_num = report_item.get("severity", "0")
            severity = self.SEVERITY_MAP.get(severity_num, "Info")
            
            # Extract vulnerability details
            vulnerability_name = report_item.get("pluginName", "Unknown")
            plugin_id = report_item.get("pluginID", "")
            port = report_item.get("port", "0")
            protocol = report_item.get("protocol", "")
            service = report_item.get("svc_name", "")
            
            # Extract description and solution
            description = report_item.findtext("description", "").strip()
            plugin_output = report_item.findtext("plugin_output", "").strip()
            solution = report_item.findtext("solution", "").strip()
            
            # Build details field
            details_parts = []
            if description:
                details_parts.append(f"Description: {description}")
            if plugin_output:
                details_parts.append(f"Plugin Output: {plugin_output}")
            details = "\n\n".join(details_parts) if details_parts else None
            
            # Extract CVSS score
            cvss_base_score = 0.0
            cvss_text = report_item.findtext("cvss_base_score", "0.0")
            try:
                cvss_base_score = float(cvss_text)
            except ValueError:
                logger.warning(f"Invalid CVSS score: {cvss_text}")
            
            # Check exploitation availability
            exploit_available = report_item.findtext("exploit_available", "false").lower() == "true"
            metasploit_available = report_item.findtext("exploit_framework_metasploit", "false").lower() == "true"
            metasploit_name = None
            if metasploit_available:
                metasploit_name = report_item.findtext("metasploit_name")
            
            # Create finding object
            finding = NessusFinding(
                **host_info,
                **scan_info,
                vulnerability_name=vulnerability_name,
                plugin_id=plugin_id,
                severity=severity,
                cvss_base_score=cvss_base_score,
                exploitable=exploit_available,
                metasploit_available=metasploit_available,
                metasploit_name=metasploit_name,
                details=details,
                solution=solution,
                port=int(port) if port.isdigit() else None,
                protocol=protocol if protocol else None,
                service=service if service else None
            )
            
            return finding
            
        except Exception as e:
            logger.error(f"Error creating finding: {str(e)}")
            return None