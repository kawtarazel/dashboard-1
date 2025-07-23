from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
from parsers.nessus import NessusParser
from normalizer import Normalizer
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Security Parser Service", version="1.0.0")

DASHBOARD_SERVICE_URL = "http://backend:8000"  # service name in Docker Compose

from typing import List, Dict, Any
class ParsedFinding(BaseModel):
    raw_finding: Dict[str, Any]  # Original finding from the parser
    normalized_finding: Dict[str, Any]  # Processed by Normalizer

class ParseResponse(BaseModel):
    findings: List[ParsedFinding]

class ParseRequest(BaseModel):
    file_id: int
    tool_id: int
    user_id: int
    auth_token: str

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "parser_backend"}

@app.post("/parse", response_model=ParseResponse)
async def parse_file(request: ParseRequest):
    """Parse uploaded security report file"""
    try:
        logger.info(f"Starting to parse file_id: {request.file_id} with tool_id: {request.tool_id}")
        
        # Get file info from dashboard service
        async with httpx.AsyncClient() as client:
            # Get file information
            response = await client.get(
                f"{DASHBOARD_SERVICE_URL}/api/dashboard/files/{request.file_id}",
                headers={"Authorization": f"Bearer {request.auth_token}"},
                timeout=30.0,
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to get file info: {response.status_code}")
                raise HTTPException(status_code=404, detail="File not found")
            
            file_info = response.json()
            logger.info(f"Retrieved file info: {file_info['filename']}")
            
            # Get tool information to determine parser type
            tool_response = await client.get(
                f"{DASHBOARD_SERVICE_URL}/api/dashboard/tools/{request.tool_id}",
                headers={"Authorization": f"Bearer {request.auth_token}"},
                timeout=30.0
            )
            
            if tool_response.status_code != 200:
                logger.error(f"Failed to get tool info: {tool_response.status_code}")
                raise HTTPException(status_code=404, detail="Tool not found")
            
            tool_info = tool_response.json()
            logger.info(f"Retrieved tool info: {tool_info['name']} - {tool_info['type']}")
            
            # Read file content
            try:
                with open(file_info["file_path"], "r", encoding='utf-8') as f:
                    file_content = f.read()
                logger.info(f"Successfully read file content ({len(file_content)} characters)")
            except FileNotFoundError:
                logger.error(f"File not found: {file_info['file_path']}")
                raise HTTPException(status_code=404, detail="File not found on disk")
            except Exception as e:
                logger.error(f"Error reading file: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")
            
            # Initialize appropriate parser based on tool type
            parser = None
            if tool_info['type'].lower() == 'vulnerability scanner':
                # For vulnerability scanners, we need to determine the specific type
                tool_name_lower = tool_info['name'].lower()
                if 'nessus' in tool_name_lower:
                    parser = NessusParser()
                else:
                    logger.warning(f"Unsupported vulnerability scanner: {tool_info['name']}")
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Vulnerability scanner '{tool_info['name']}' is not supported yet. Currently supported: Nessus"
                    )
            else:
                logger.warning(f"No parser available for tool type: {tool_info['type']}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Tool type '{tool_info['type']}' is not supported yet. Currently supported: vulnerability_scanner (Nessus)"
                )
            
            # Parse the report
            try:
                findings = parser.parse_report(file_content, file_info["filename"])
                logger.info(f"Parser returned {len(findings)} findings")
                
                if not isinstance(findings, list):
                    logger.error("Parser returned non-list result")
                    raise HTTPException(status_code=500, detail="Invalid response from parser")
                
                # Handle empty results
                if len(findings) == 0:
                    logger.info("No findings found in the report")
                    return {"findings": []}
                
                # Normalize findings
                normalizer = Normalizer()
                parsed_findings = []
                normalization_errors = 0
                
                for i, finding in enumerate(findings):
                    try:
                        normalized = normalizer.normalize(finding)
                        parsed_findings.append({
                            "raw_finding": finding,      # Original data from parser
                            "normalized_finding": normalized  # Processed data
                        })
                    except Exception as e:
                        normalization_errors += 1
                        logger.warning(f"Failed to normalize finding {i+1}: {str(e)}")
                        # Continue processing other findings
                        continue
                
                # Log normalization results
                if normalization_errors > 0:
                    logger.warning(f"Failed to normalize {normalization_errors} out of {len(findings)} findings")
                
                logger.info(f"Successfully normalized {len(parsed_findings)} findings")
                return {"findings": parsed_findings}
                
            except ValueError as e:
                # Handle format validation errors with user-friendly messages
                error_message = str(e)
                logger.error(f"Format validation error: {error_message}")
                
                # Provide specific guidance based on the error
                if "does not appear to be a valid Nessus v2 report" in error_message:
                    raise HTTPException(
                        status_code=400, 
                        detail="The uploaded file is not a valid Nessus report. Please ensure you exported the report as '.nessus' format from Tenable Nessus."
                    )
                elif "does not have valid Nessus report structure" in error_message:
                    raise HTTPException(
                        status_code=400, 
                        detail="The file structure is not valid for a Nessus report. Please check that the XML export completed successfully."
                    )
                elif "Invalid XML format" in error_message:
                    raise HTTPException(
                        status_code=400, 
                        detail="The uploaded file contains invalid XML. Please re-export the report from Nessus."
                    )
                else:
                    raise HTTPException(status_code=400, detail=error_message)
                    
            except Exception as e:
                logger.error(f"Unexpected error parsing report: {str(e)}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"An unexpected error occurred while parsing the report. Please check the file format and try again."
                )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in parse_file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Service error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)