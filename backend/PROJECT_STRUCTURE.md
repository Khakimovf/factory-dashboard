# Project Structure

```
backend/
│
├── app/                          # Main application package
│   ├── __init__.py              # Package initialization
│   ├── main.py                  # FastAPI app entry point
│   ├── config.py                # Configuration settings
│   │
│   ├── api/                     # API layer
│   │   ├── __init__.py
│   │   └── routes/              # API route handlers
│   │       ├── __init__.py
│   │       └── documents.py     # Document endpoints
│   │
│   ├── models/                  # Data models (Pydantic)
│   │   ├── __init__.py
│   │   └── document.py          # Document metadata model
│   │
│   └── services/                # Business logic layer
│       ├── __init__.py
│       └── file_service.py      # File handling service
│
├── uploads/                     # File storage directory
│   └── .gitkeep                # Keep directory in git
│
├── requirements.txt             # Python dependencies
├── README.md                   # Full documentation
├── QUICKSTART.md               # Quick start guide
├── PROJECT_STRUCTURE.md        # This file
├── run.py                      # Development server script
└── .gitignore                  # Git ignore rules
```

## Architecture Overview

### Layered Architecture

1. **API Layer** (`app/api/routes/`)
   - Handles HTTP requests/responses
   - Route definitions
   - Request validation
   - Response formatting

2. **Service Layer** (`app/services/`)
   - Business logic
   - File operations
   - Validation logic
   - Future: Database operations

3. **Model Layer** (`app/models/`)
   - Pydantic models
   - Data validation
   - Serialization
   - Future: Database models

4. **Configuration** (`app/config.py`)
   - App settings
   - Constants
   - Environment configuration

### Design Principles

- **Separation of Concerns**: Each layer has a clear responsibility
- **Single Responsibility**: Each module does one thing well
- **Dependency Injection**: Services can be easily tested/mocked
- **Scalability**: Easy to add database, caching, etc.

### Future Database Integration Points

When adding a database:

1. **Models** → Add SQLAlchemy models in `app/models/`
2. **Services** → Add database operations in `app/services/`
3. **Routes** → Minimal changes, just call service methods

Example future structure:
```
app/
├── models/
│   ├── document.py          # Pydantic models (keep)
│   └── db_document.py       # SQLAlchemy models (add)
├── services/
│   ├── file_service.py      # File operations (keep)
│   └── document_service.py  # Database operations (add)
```
