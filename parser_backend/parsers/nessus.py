import xml.etree.ElementTree as ET
import re
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
    
    def check_nessus_v2_format(self, xml_content: str) -> bool:
        """
        Check if the XML content is in Nessus v2 format.
        
        Args:
            xml_content: The XML content to check
            
        Returns:
            bool: True if the content appears to be a Nessus v2 report
        """
        # Check for Nessus v2 specific markers
        nessus_markers = [
            "<NessusClientData_v2",
            "<Report",
            "<ReportHost",
            "<ReportItem",
            "pluginID=",
            "pluginName="
        ]
        
        # Content should contain multiple Nessus-specific markers
        marker_count = sum(1 for marker in nessus_markers if marker in xml_content)
        
        # Additional checks for common Nessus elements
        has_policy = "<Policy>" in xml_content or "policy" in xml_content.lower()
        has_preferences = "<Preferences>" in xml_content or "preference" in xml_content.lower()
        has_plugin_output = "plugin_output" in xml_content
        
        # Must have at least 3 markers and some Nessus-specific content
        is_nessus = marker_count >= 3 and (has_policy or has_preferences or has_plugin_output)
        
        logger.info(f"Nessus format check: {marker_count} markers found, is_nessus: {is_nessus}")
        return is_nessus
    
    def validate_xml_structure(self, root: ET.Element) -> bool:
        """
        Validate that the XML has the expected Nessus structure.
        
        Args:
            root: The XML root element
            
        Returns:
            bool: True if the structure is valid for Nessus
        """
        # Check for required Nessus elements
        report_hosts = root.findall(".//ReportHost")
        if not report_hosts:
            logger.warning("No ReportHost elements found - not a valid Nessus report")
            return False
        
        # Check for at least one ReportItem
        report_items = root.findall(".//ReportItem")
        if not report_items:
            logger.warning("No ReportItem elements found - not a valid Nessus report")
            return False
        
        # Check for plugin attributes in ReportItems
        has_plugin_attrs = any(
            item.get("pluginID") and item.get("pluginName") 
            for item in report_items[:5]  # Check first 5 items
        )
        
        if not has_plugin_attrs:
            logger.warning("No plugin attributes found in ReportItems - not a valid Nessus report")
            return False
        
        logger.info(f"Valid Nessus structure: {len(report_hosts)} hosts, {len(report_items)} items")
        return True
        
    def parse_report(self, file_content: str, filename: str) -> List[Dict[str, Any]]:
        """
        Parse a Nessus XML report and return findings.
        
        Args:
            file_content: The content of the Nessus XML file
            filename: The name of the file being parsed
            
        Returns:
            List of findings dictionaries
            
        Raises:
            ValueError: If the file is not a valid Nessus v2 report
        """
        try:
            # First, check if this is a Nessus v2 format file
            if not self.check_nessus_v2_format(file_content):
                raise ValueError(
                    f"File '{filename}' does not appear to be a valid Nessus v2 report. "
                    "Please ensure you're uploading a Nessus XML export file."
                )
            
            # Parse XML
            try:
                root = ET.fromstring(file_content)
            except ET.ParseError as e:
                logger.error(f"XML parsing failed for {filename}: {str(e)}")
                raise ValueError(f"Invalid XML format in '{filename}': {str(e)}")
            
            # Validate XML structure
            if not self.validate_xml_structure(root):
                raise ValueError(
                    f"File '{filename}' does not have valid Nessus report structure. "
                    "Please check that this is a properly exported Nessus XML file."
                )
            
            # Parse findings
            findings = list(self._parse_findings(root))
            
            if not findings:
                logger.warning(f"No findings extracted from {filename}")
                # Don't raise an error for empty reports, just return empty list
                return []
            
            logger.info(f"Successfully parsed {len(findings)} findings from {filename}")
            return findings
            
        except ValueError:
            # Re-raise validation errors
            raise
        except Exception as e:
            logger.error(f"Unexpected error parsing {filename}: {str(e)}")
            raise ValueError(f"Error parsing Nessus file '{filename}': {str(e)}")
    
    def _parse_findings(self, root: ET.Element) -> Generator[Dict[str, Any], None, None]:
        """Generate findings from the XML root element"""
        report_hosts = root.findall(".//ReportHost")
        
        if not report_hosts:
            logger.warning("No ReportHost elements found")
            return
        
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