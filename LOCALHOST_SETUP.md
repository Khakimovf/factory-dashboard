# Localhost Development Setup Guide

This guide provides step-by-step instructions to run the backend and frontend on localhost.

## Prerequisites

- Python 3.8+ installed
- Node.js 18+ and npm/pnpm installed
- Virtual environment support (venv)

## Backend Setup

### Step 1: Navigate to Backend Directory

```powershell
cd backend
```

### Step 2: Activate Virtual Environment

**Windows (PowerShell):**
```powershell
.\.venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
.venv\Scripts\activate.bat
```

**Linux/Mac:**
```bash
source .venv/bin/activate
```

### Step 3: Install Dependencies

```powershell
pip install -r requirements.txt
```

This will install:
- `fastapi==0.109.0`
- `uvicorn[standard]==0.27.0`
- `python-multipart==0.0.6`
- `pydantic==2.5.3`
- `pydantic-settings==2.1.0`

### Step 4: Run Backend Server

**From the `backend` directory:**

```powershell
python run.py
```

The backend will start on **http://localhost:8000**

You can verify it's working by visiting:
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health
- Root: http://localhost:8000/

## Frontend Setup

### Step 1: Navigate to Project Root

```powershell
cd ..
```

(From backend directory, go back to project root)

### Step 2: Install Dependencies

```powershell
npm install
```

or if using pnpm:

```powershell
pnpm install
```

### Step 3: Run Frontend Development Server

```powershell
npm run dev
```

or if using pnpm:

```powershell
pnpm dev
```

The frontend will start on **http://localhost:5173** (default Vite port)

## Running Both Servers Simultaneously

You need **two terminal windows/tabs**:

### Terminal 1 - Backend:
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python run.py
```

### Terminal 2 - Frontend:
```powershell
npm run dev
```

## File Upload Testing

The file upload endpoint is available at:
- **POST** `http://localhost:8000/api/v1/documents/upload`

Uploaded files are saved to: `backend/uploads/`

### Test with curl (PowerShell):

```powershell
curl -X POST "http://localhost:8000/api/v1/documents/upload" -F "file=@path/to/your/file.pdf"
```

### Test with Postman or Browser:

1. Go to http://localhost:8000/docs
2. Find the `/api/v1/documents/upload` endpoint
3. Click "Try it out"
4. Upload a file (PDF, DOCX, JPG, or JPEG)
5. Files are saved to `backend/uploads/`

## CORS Configuration

CORS is already configured to allow requests from:
- `http://localhost:5173` (Vite default)
- `http://localhost:3000` (alternative)
- `http://localhost:4173` (Vite preview)
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

## Troubleshooting

### Backend Issues

**Problem: ModuleNotFoundError**
- **Solution**: Make sure you're running `python run.py` from the `backend` directory
- **Solution**: Ensure virtual environment is activated
- **Solution**: Reinstall dependencies: `pip install -r requirements.txt`

**Problem: Port 8000 already in use**
- **Solution**: Change port in `run.py` or kill the process using port 8000

**Problem: Uploads directory not found**
- **Solution**: The `uploads` directory is created automatically. If it doesn't exist, create it manually:
  ```powershell
  mkdir backend\uploads
  ```

### Frontend Issues

**Problem: Cannot connect to backend**
- **Solution**: Ensure backend is running on port 8000
- **Solution**: Check CORS configuration in `backend/app/config.py`
- **Solution**: Verify frontend is making requests to `http://localhost:8000`

**Problem: Port 5173 already in use**
- **Solution**: Vite will automatically use the next available port, or specify a different port in `vite.config.ts`

## Project Structure

```
backend/
  app/
    api/routes/
      documents.py      # File upload endpoints
    services/
      file_service.py   # File handling logic
    models/
      document.py       # Pydantic models
    config.py           # Configuration (CORS, uploads, etc.)
    main.py             # FastAPI app
  uploads/              # Uploaded files directory
  requirements.txt      # Python dependencies
  run.py               # Development server script

(root)/
  src/                  # Frontend source code
  vite.config.ts        # Vite configuration
  package.json          # Frontend dependencies
```

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /docs` - Swagger UI documentation
- `POST /api/v1/documents/upload` - Upload a document
- `GET /api/v1/documents/health` - Documents service health check

## Notes

- Backend runs on **port 8000**
- Frontend runs on **port 5173** (Vite default)
- File uploads are saved to `backend/uploads/` directory
- No database required - file metadata is returned in the response
- Maximum file size: 10MB
- Allowed file types: PDF, DOCX, JPG, JPEG





