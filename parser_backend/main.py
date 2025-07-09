from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
from parsers.nessus import NessusParser
from normalizer import Normalizer  # Fixed import
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Security Parser Service", version="1.0.0")

DASHBOARD_SERVICE_URL = "http://backend:8000"  # Correct service name

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
                headers={"Authorization": f"Bearer {request.auth_token}"},  # Use the token
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
            if tool_info['type'] == 'vulnerability_scanner' and 'nessus' in tool_info['name'].lower():
                parser = NessusParser()
            else:
                logger.warning(f"No parser available for tool type: {tool_info['type']}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Parser not available for tool type: {tool_info['type']}"
                )
            
            # Parse the report
            try:
                findings = parser.parse_report(file_content, file_info["filename"])
                logger.info(f"Parser returned {len(findings)} findings")
                
                if not isinstance(findings, list):
                    logger.error("Parser returned non-list result")
                    raise HTTPException(status_code=500, detail="Invalid response from parser")
                
                # Normalize findings
                normalizer = Normalizer()
                parsed_findings = []
                
                for finding in findings:
                    try:
                        normalized = normalizer.normalize(finding)
                        parsed_findings.append({
                            "raw_finding": finding,      # Original data from parser
                            "normalized_finding": normalized  # Processed data
                        })
                    except Exception as e:
                        logger.warning(f"Failed to normalize finding: {str(e)}")
                        continue
                
                logger.info(f"Successfully normalized {len(parsed_findings)} findings")
                return {"findings": parsed_findings}  # Structured response
                
            except Exception as e:
                logger.error(f"Error parsing report: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error parsing report: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in parse_file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)