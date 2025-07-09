from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
from parsers.nessus import NessusParser
import json

app = FastAPI()

DASHBOARD_SERVICE_URL = "http://backend:8000"  # Update with your dashboard service URL

class ParseRequest(BaseModel):
    file_id: int
    tool_id: int
    user_id: int

@app.post("/parse")
async def parse_file(request: ParseRequest):
    try:
        # Get file info from dashboard service
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{DASHBOARD_SERVICE_URL}/dashboard/files/{request.file_id}"
            )
            if response.status_code != 200:
                raise HTTPException(status_code=404, detail="File not found")
            
            file_info = response.json()
            
            # Read file content
            with open(file_info["file_path"], "r") as f:
                file_content = f.read()
            
            # Initialize appropriate parser based on tool_id
            # For now, we only have NessusParser
            parser = NessusParser()
            findings = parser.parse_report(file_content, file_info["filename"])
            if not isinstance(findings, list):
                raise HTTPException(status_code=500, detail="Invalid response from parser service")
            # Normalize findings
            from parser_backend.normalizer import Normalizer
            normalized_findings = [Normalizer().normalize(finding) for finding in findings]

            return {
                "status": "success",
                "findings": normalized_findings
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
