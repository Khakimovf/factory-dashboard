# Maintenance Module Implementation

## Overview
This document describes the Maintenance (Ta'mirlash va texnik xizmat) module that has been added to the factory management system. The module enables fast handling of equipment failures, assignment of maintenance workers, and complete documentation of the repair process.

---

## Backend Implementation

### Files Added

#### 1. Models
- **`backend/app/models/maintenance.py`**
  - `MaintenanceStatus` enum (open, in_progress, closed)
  - `FailureReportBase` - Base model
  - `FailureReportCreate` - Model for creating reports
  - `FailureReportUpdate` - Model for updating reports
  - `FailureReport` - Full report model with all fields

#### 2. Services
- **`backend/app/services/maintenance_service.py`**
  - `MaintenanceService` class with business logic:
    - `create_failure_report()` - Create new failure report
    - `get_failure_report()` - Get report by ID
    - `get_all_failure_reports()` - Get all reports with filtering
    - `update_failure_report()` - Update report fields and handle status transitions
    - `mark_worker_arrived()` - Mark worker arrival and transition to in_progress
    - `add_photo_to_report()` - Add photo URLs to report
    - `delete_failure_report()` - Delete a report
  - Uses in-memory storage (ready for database integration)
  - Automatic status transition handling with timestamp management

#### 3. API Routes
- **`backend/app/api/routes/maintenance.py`**
  - Router prefix: `/maintenance`
  - All routes prefixed with `/api/v1` via main.py

#### 4. Configuration
- **`backend/app/config.py`** (Modified)
  - Added `.png` to `ALLOWED_EXTENSIONS` for photo uploads

### API Endpoints

| Method | Endpoint | Description | Status Codes |
|--------|----------|-------------|--------------|
| POST | `/api/v1/maintenance/failure-reports` | Create a new failure report | 201, 500 |
| GET | `/api/v1/maintenance/failure-reports` | Get all failure reports (with optional `status_filter` and `line_id` query params) | 200, 500 |
| GET | `/api/v1/maintenance/failure-reports/{report_id}` | Get a specific failure report | 200, 404, 500 |
| PATCH | `/api/v1/maintenance/failure-reports/{report_id}` | Update a failure report | 200, 404, 500 |
| POST | `/api/v1/maintenance/failure-reports/{report_id}/worker-arrived` | Mark worker as arrived | 200, 404, 500 |
| POST | `/api/v1/maintenance/failure-reports/{report_id}/photos` | Upload photo to report | 200, 400, 404, 500 |
| DELETE | `/api/v1/maintenance/failure-reports/{report_id}` | Delete a failure report | 204, 404 |
| GET | `/api/v1/maintenance/health` | Health check | 200 |

### Status Flow

The module implements the following business flow with automatic status transitions:

1. **OPEN** (Initial State)
   - Created when line master reports a failure
   - `created_at` timestamp is set
   - No worker assigned yet

2. **IN_PROGRESS** (Transition)
   - Automatically triggered when:
     - Line master clicks "Worker arrived" OR
     - Status is manually changed to `in_progress`
   - `worker_arrived_at` timestamp is set
   - `start_time` is set (if not already set)
   - Worker can be assigned

3. **CLOSED** (Final State)
   - Triggered when status is changed to `closed`
   - `completed_at` timestamp is set
   - `total_duration_minutes` is calculated (from `start_time` to `completed_at`)

### Data Model

```python
FailureReport {
    id: str                      # Unique identifier (e.g., "fr_abc12345")
    line_id: str                 # Production line ID
    line_name: str               # Production line name
    description: str             # Failure description
    reported_by: str             # Line master name
    priority: str                # Optional: low, normal, high, urgent
    status: MaintenanceStatus    # open, in_progress, closed
    assigned_to: str?            # Maintenance worker name (optional)
    comments: str?               # Additional comments/notes
    photo_urls: List[str]        # URLs of uploaded photos
    created_at: datetime         # Report creation timestamp
    start_time: datetime?        # When work started
    worker_arrived_at: datetime? # When worker arrived
    completed_at: datetime?      # When repair completed
    total_duration_minutes: int? # Total duration in minutes
}
```

---

## Frontend Implementation

### Files Added

#### 1. API Service
- **`src/app/services/maintenanceApi.ts`**
  - TypeScript types matching backend models
  - `MaintenanceApiService` class with methods for all API endpoints
  - Error handling and type safety

#### 2. Components
- **`src/app/components/MaintenanceDashboard.tsx`**
  - Main dashboard showing statistics (Open, In Progress, Closed, Total)
  - Status filtering
  - Recent reports list
  - Quick action cards

- **`src/app/components/FailureReportList.tsx`**
  - Full list of failure reports
  - Search functionality
  - Status filtering
  - Click to view details

- **`src/app/components/FailureReportDetail.tsx`**
  - Detailed view of a single failure report
  - Timeline visualization (created, arrived, started, completed)
  - Photo gallery
  - Update form (status, assigned_to, comments)
  - Action buttons (Mark Worker Arrived, Close Report, Upload Photos)

- **`src/app/components/CreateFailureReport.tsx`**
  - Form to create new failure report
  - Production line selection
  - Priority selection
  - Description textarea

- **`src/app/components/UploadPhotoReport.tsx`**
  - Multiple photo upload interface
  - Preview grid
  - Drag & drop support
  - Upload progress indicator

#### 3. Routes
- **`src/app/App.tsx`** (Modified)
  - Added routes:
    - `/maintenance` → MaintenanceDashboard
    - `/maintenance/failure-reports` → FailureReportList
    - `/maintenance/failure-reports/new` → CreateFailureReport
    - `/maintenance/failure-reports/:id` → FailureReportDetail
    - `/maintenance/failure-reports/:id/upload-photos` → UploadPhotoReport

#### 4. Navigation
- **`src/app/components/Sidebar.tsx`** (Modified)
  - Added Maintenance menu item with Wrench icon

#### 5. Translations
- **`src/locales/uz.json`** (Modified)
  - Added complete Uzbek translations for Maintenance module
- **`src/locales/ru.json`** (Modified)
  - Added complete Russian translations for Maintenance module

---

## Features Implemented

### ✅ Core Features
1. **Create Failure Report** - Line master can report equipment failures
2. **Status Management** - Three statuses (Open, In Progress, Closed) with automatic transitions
3. **Photo Upload** - Multiple photos can be uploaded per report
4. **Comments/Notes** - Additional notes can be added to reports
5. **Time Tracking** - Automatic tracking of:
   - Creation time
   - Worker arrival time
   - Start time
   - Completion time
   - Total duration

### ✅ User Interface
1. **Dashboard** - Overview with statistics and recent reports
2. **Report List** - Searchable, filterable list of all reports
3. **Report Detail** - Comprehensive card view with timeline and photos
4. **Create Form** - User-friendly form for creating reports
5. **Photo Upload** - Drag & drop interface with previews

### ✅ Business Flow Implementation
1. Line master creates failure report → Status: OPEN
2. Maintenance department sees notification (via dashboard/list)
3. Maintenance worker is assigned (via update form)
4. Line master clicks "Worker arrived" → Status: IN_PROGRESS (automatic)
5. Repair is completed
6. Worker uploads photo report (via upload page)
7. Maintenance job is closed → Status: CLOSED (manual or automatic)

---

## Assumptions Made

1. **No Database Yet**: Using in-memory storage in the backend service. The code is structured to easily migrate to a database (SQLAlchemy models can be added later).

2. **User Authentication**: Currently no authentication is implemented. The `reported_by` and `assigned_to` fields are simple strings. In production, these should be user IDs linked to an authentication system.

3. **Production Lines**: The frontend uses `productionLines` from `FactoryContext`. In a production system, these should come from the backend API.

4. **API Base URL**: Frontend API service uses `http://localhost:8000`. This should be configured via environment variables in production.

5. **Photo Storage**: Photos are stored in `backend/uploads/` directory. In production, consider cloud storage (S3, Azure Blob, etc.).

6. **Role-Based Access**: No role-based access control implemented. All users can perform all actions. In production, implement:
   - Line masters: Create reports, mark worker arrived
   - Maintenance workers: Update reports, upload photos
   - Managers: View all, close reports

---

## Notes for Future Extension

### 1. Role-Based Access Control
- Implement user roles (Line Master, Maintenance Worker, Manager)
- Add permission checks to API endpoints
- Restrict UI actions based on user role

### 2. Notifications
- Real-time notifications when new reports are created
- Email/SMS notifications for assigned workers
- Push notifications for status changes
- Consider WebSocket integration for real-time updates

### 3. SLA (Service Level Agreement)
- Define response time targets (e.g., worker must arrive within 30 minutes)
- Track SLA compliance
- Alert when SLA is at risk
- Add SLA dashboard/metrics

### 4. Database Integration
- Replace in-memory storage with SQLAlchemy models
- Add indexes on frequently queried fields (status, line_id, created_at)
- Implement soft deletes instead of hard deletes
- Add database migrations

### 5. Reporting & Analytics
- Dashboard with charts (failures by line, by status, trends)
- Export functionality (PDF, Excel)
- Historical data analysis
- Maintenance cost tracking

### 6. Mobile App
- Mobile-friendly interface for line masters to quickly report failures
- Camera integration for photo capture
- Push notifications for mobile devices

### 7. Integration Points
- Integration with production line monitoring system
- Automatic failure detection from sensors
- Integration with inventory system for parts tracking
- Integration with scheduling system for worker assignment

### 8. Advanced Features
- Recurring maintenance scheduling
- Preventive maintenance tracking
- Parts inventory management per repair
- Cost tracking per repair
- Equipment history (all repairs for a specific line)

---

## Testing the Module

### Backend Testing
1. Start the backend server:
   ```bash
   cd backend
   python run.py
   ```
2. Visit API docs: `http://localhost:8000/docs`
3. Test endpoints using the interactive Swagger UI

### Frontend Testing
1. Start the frontend dev server:
   ```bash
   npm run dev
   ```
2. Navigate to Maintenance module via sidebar
3. Test the complete flow:
   - Create a failure report
   - View the report list
   - View report details
   - Mark worker arrived
   - Upload photos
   - Close the report

---

## File Structure Summary

```
backend/
├── app/
│   ├── models/
│   │   ├── maintenance.py          # NEW
│   │   └── __init__.py             # MODIFIED
│   ├── services/
│   │   ├── maintenance_service.py  # NEW
│   │   └── __init__.py             # MODIFIED
│   ├── api/
│   │   └── routes/
│   │       ├── maintenance.py      # NEW
│   │       └── __init__.py
│   ├── config.py                   # MODIFIED (added .png)
│   └── main.py                     # MODIFIED (added maintenance router)

src/
├── app/
│   ├── components/
│   │   ├── MaintenanceDashboard.tsx    # NEW
│   │   ├── FailureReportList.tsx       # NEW
│   │   ├── FailureReportDetail.tsx     # NEW
│   │   ├── CreateFailureReport.tsx     # NEW
│   │   ├── UploadPhotoReport.tsx       # NEW
│   │   ├── Sidebar.tsx                 # MODIFIED
│   │   └── ...
│   ├── services/
│   │   └── maintenanceApi.ts           # NEW
│   ├── App.tsx                         # MODIFIED
│   └── ...
└── locales/
    ├── uz.json                         # MODIFIED
    └── ru.json                         # MODIFIED
```

---

## Summary

The Maintenance module has been successfully implemented with:
- ✅ Complete backend API with 8 endpoints
- ✅ Full frontend with 5 pages/components
- ✅ Status management with automatic transitions
- ✅ Photo upload functionality
- ✅ Time tracking (start, arrival, end, duration)
- ✅ Multilingual support (Uzbek & Russian)
- ✅ Clean separation of concerns
- ✅ Production-ready code structure
- ✅ Extensible architecture for future enhancements

The module follows existing code patterns and does not modify any other modules (HR, Warehouse, Production Lines, Dashboard) as requested.


