# Factory HR Document Workflow API

Backend API for factory HR document workflow system built with FastAPI.

## Features

- ✅ Document upload (PDF, DOCX, JPG)
- ✅ File validation and size checks
- ✅ Metadata generation
- ✅ CORS support for React frontend
- ✅ Clean architecture (ready for database integration)
- ✅ Production-ready error handling

## Tech Stack

- **Python 3.8+**
- **FastAPI** - Modern, fast web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **File storage** - Local file system (no database)

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration settings
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       └── documents.py # Document endpoints
│   ├── models/
│   │   ├── __init__.py
│   │   └── document.py      # Document data models
│   └── services/
│       ├── __init__.py
│       └── file_service.py  # File handling logic
├── uploads/                 # Uploaded files storage
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## Installation

1. **Create virtual environment** (recommended):

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

2. **Install dependencies**:

```bash
pip install -r requirements.txt
```

## Running the Server

### Development Mode

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Upload Document

**POST** `/api/v1/documents/upload`

Upload a document file (PDF, DOCX, JPG).

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field

**Response:**
```json
{
  "filename": "employee_handbook_20250115_103000_a1b2c3d4.pdf",
  "upload_date": "2025-01-15T10:30:00.123456",
  "status": "draft",
  "file_path": "uploads/employee_handbook_20250115_103000_a1b2c3d4.pdf",
  "file_size": 1024000,
  "file_type": "application/pdf"
}
```

**Example with cURL:**
```bash
curl -X POST "http://localhost:8000/api/v1/documents/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/document.pdf"
```

### Health Check

**GET** `/health`

Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "factory-hr-api",
  "version": "1.0.0"
}
```

## File Upload Specifications

### Allowed File Types
- PDF (`.pdf`)
- DOCX (`.docx`)
- JPG/JPEG (`.jpg`, `.jpeg`)

### File Size Limit
- Maximum: **10MB**

### File Naming
Uploaded files are automatically renamed with:
- Original filename (sanitized)
- Timestamp (YYYYMMDD_HHMMSS)
- Unique identifier (8 characters)

Example: `employee_handbook_20250115_103000_a1b2c3d4.pdf`

## CORS Configuration

The API is configured to accept requests from:
- http://localhost:3000 (React default)
- http://localhost:5173 (Vite default)
- http://localhost:4173 (Vite preview)
- http://127.0.0.1:3000
- http://127.0.0.1:5173

To add more origins, update `ALLOWED_ORIGINS` in `app/config.py`.

## Architecture Notes

### Current Structure (No Database)

- Files are stored in `uploads/` directory
- Metadata is returned immediately after upload
- No persistence layer (stateless API)

### Future Database Integration

The codebase is structured to easily add a database:

1. **Models** (`app/models/`) - Already use Pydantic models that can map to database schemas
2. **Services** (`app/services/`) - Business logic is separated and can be extended with database operations
3. **Routes** (`app/api/routes/`) - API endpoints are clean and can easily integrate database queries

**Example database integration:**
```python
# Future: app/services/document_service.py
from app.models.document import DocumentMetadata

class DocumentService:
    async def save_document_to_db(self, metadata: DocumentMetadata):
        # Database save logic here
        pass
    
    async def get_documents(self):
        # Database query logic here
        pass
```

## Error Handling

The API handles various error scenarios:

- **400 Bad Request**: Invalid file type, file too large, empty file
- **500 Internal Server Error**: File save errors, unexpected errors

All errors return JSON responses with descriptive messages.

## Development

### Running Tests (Future)

```bash
pytest
```

### Code Formatting (Recommended)

```bash
# Install formatter
pip install black

# Format code
black app/
```

## Production Considerations

1. **File Storage**: Currently using local filesystem. For production, consider:
   - Cloud storage (AWS S3, Azure Blob, Google Cloud Storage)
   - Network-attached storage (NAS)
   - File server

2. **Security**: 
   - Add authentication/authorization
   - Implement rate limiting
   - Add file virus scanning
   - Validate file content (not just extension)

3. **Scalability**:
   - Add database for metadata persistence
   - Implement file deduplication
   - Add caching layer
   - Consider CDN for file serving

4. **Monitoring**:
   - Add logging
   - Implement health checks
   - Add metrics collection

## License

Internal use only.
