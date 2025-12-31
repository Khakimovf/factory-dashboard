# Quick Start Guide

## 1. Setup (One-time)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## 2. Run Server

```bash
# Option 1: Using run.py
python run.py

# Option 2: Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 3. Test the API

### Open API Docs
Navigate to: http://localhost:8000/docs

### Upload a file using cURL

```bash
curl -X POST "http://localhost:8000/api/v1/documents/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/document.pdf"
```

### Test with Python

```python
import requests

url = "http://localhost:8000/api/v1/documents/upload"
files = {"file": open("test.pdf", "rb")}
response = requests.post(url, files=files)
print(response.json())
```

## 4. Connect Frontend

The API is configured to accept requests from:
- http://localhost:3000
- http://localhost:5173
- http://localhost:4173

Make sure your React frontend is running on one of these ports.

## That's it! 🎉

The server is now running and ready to accept document uploads.
