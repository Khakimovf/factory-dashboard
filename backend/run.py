#!/usr/bin/env python3
"""Quick start script for development server."""
import sys
from pathlib import Path
import uvicorn

# Ensure the backend directory is in Python path
BACKEND_DIR = Path(__file__).parent.resolve()
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[str(BACKEND_DIR / "app")],
        log_level="info"
    )
