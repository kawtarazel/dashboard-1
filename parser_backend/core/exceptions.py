from datetime import datetime
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

class CustomHTTPException(HTTPException):
    def __init__(self, status_code: int, detail: str, error_code: str = None):
        super().__init__(status_code, detail)
        self.error_code = error_code

async def custom_http_exception_handler(request: Request, exc: CustomHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_code": exc.error_code,
            "timestamp": datetime.now().isoformat()
        }
    )