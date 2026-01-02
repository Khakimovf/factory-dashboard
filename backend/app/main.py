"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import API_PREFIX, ALLOWED_ORIGINS
from app.api.routes import documents, maintenance

# Create FastAPI app
app = FastAPI(
    title="Factory HR Document Workflow API",
    description="Backend API for factory HR document workflow system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(documents.router, prefix=API_PREFIX)
app.include_router(maintenance.router, prefix=API_PREFIX)


@app.get("/", tags=["root"])
async def root():
    """Root endpoint."""
    return {
        "message": "Factory HR Document Workflow API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": f"{API_PREFIX}/documents/health"
    }


@app.get("/health", tags=["health"])
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "factory-hr-api",
        "version": "1.0.0"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error": str(exc)
        }
    )
