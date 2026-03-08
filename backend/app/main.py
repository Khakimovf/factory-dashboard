"""Main FastAPI application."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.exceptions import BaseAPIException
from app.api.routes import documents, maintenance, warehouse, production, admin
from app.api.exceptions import (
    api_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    global_exception_handler,
)

# Setup logging
setup_logging()
logger = get_logger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Factory HR Document Workflow API",
    description="Backend API for factory HR document workflow system",
    version=settings.API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
app.add_exception_handler(BaseAPIException, api_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Include routers
app.include_router(documents.router, prefix=settings.API_PREFIX)
app.include_router(maintenance.router, prefix=settings.API_PREFIX)
app.include_router(warehouse.router, prefix=settings.API_PREFIX)
app.include_router(production.router, prefix=settings.API_PREFIX)
app.include_router(admin.router, prefix=settings.API_PREFIX)


@app.middleware("http")
async def security_and_audit_middleware(request: Request, call_next):
    """
    1. Sanitize incoming data (Basic XSS check)
    2. Log all mutating requests as Audit logs using JWT session
    """
    client_ip = request.client.host if request.client else "unknown"
    method = request.method
    path = request.url.path
    
    response = await call_next(request)
    
    # Only log mutating actions for Audit Trail
    if method in ["POST", "PUT", "PATCH", "DELETE"] and settings.API_PREFIX in path:
        from app.repositories.audit_repository import AuditRepository
        from app.models.audit import AuditLog
        from jose import jwt
        import uuid
        
        # Determine module based on path
        module = "UNKNOWN"
        for mod in ["ADMIN", "PRODUCTION", "MAINTENANCE", "WAREHOUSE"]:
            if f"/{mod.lower()}/" in path:
                module = mod
                break
        
        audit_repo = AuditRepository()
        status = "SUCCESS" if response.status_code < 400 else "WARNING" if response.status_code in [401, 403] else "CRITICAL"
        
        # Extract user info from JWT
        user_id = "SYSTEM"
        username = "automated_process"
        
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                user_id = payload.get("sub", "SYSTEM")
                from app.repositories.user_repository import UserRepository
                user = UserRepository().get_by_id(user_id)
                if user:
                    username = user.username
            except Exception:
                pass

        audit_repo.create(AuditLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            username=username,
            action=f"{method} {path}",
            module=module,
            status=status,
            ip_address=client_ip,
            details={"path": path, "status_code": response.status_code}
        ))
        
    return response


@app.get("/", tags=["root"])
async def root():
    """Root endpoint."""
    return {
        "message": "Factory HR Document Workflow API",
        "version": settings.API_VERSION,
        "docs": "/docs",
        "health": f"{settings.API_PREFIX}/documents/health"
    }


@app.get("/health", tags=["health"])
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "factory-hr-api",
        "version": settings.API_VERSION
    }
