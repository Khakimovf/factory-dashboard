# HR Module Modernization Plan

## Current State Analysis

### Frontend
- **Single Component**: `HRDepartment.tsx` contains all HR functionality in one file
- **Mixed Concerns**: Document workflow, library, and stats all in one component
- **No Employee Management**: Only documents are managed
- **No Internal Navigation**: Everything is on a single page
- **Data Source**: Uses `FactoryContext` with in-memory state

### Backend
- **Generic Routes**: `/documents` route is generic, not HR-specific
- **Basic Models**: Only `DocumentMetadata` model exists
- **No Employee API**: No employee management endpoints
- **File Service**: Basic file upload service exists

---

## Modernization Goals

1. ✅ **Modern Admin UI** - Clean, card-based layout with clear sections
2. ✅ **Clear HR Structure** - Organized folder structure with separated concerns
3. ✅ **Internal Document Workflow** - Document workflow stays inside HR module
4. ✅ **Employee Management** - Add employee CRUD operations
5. ✅ **Better Navigation** - Internal tabs/navigation within HR module
6. ✅ **Isolated Changes** - Only modify HR-related files

---

## Proposed Structure

### Frontend Structure
```
src/app/components/
├── hr/                                    # NEW - HR module folder
│   ├── HRDashboard.tsx                    # NEW - Main HR entry point with tabs
│   ├── HREmployees.tsx                    # NEW - Employee management page
│   ├── HRDocuments.tsx                    # NEW - Document workflow page
│   ├── HRDocumentLibrary.tsx              # NEW - Document library page
│   ├── components/                        # NEW - Shared HR components
│   │   ├── EmployeeTable.tsx              # NEW - Employee table component
│   │   ├── EmployeeForm.tsx               # NEW - Employee create/edit form
│   │   ├── DocumentWorkflow.tsx           # NEW - Extracted workflow columns
│   │   └── DocumentLibraryGrid.tsx        # NEW - Extracted library grid
│   └── types.ts                           # NEW - HR-specific TypeScript types
├── HRDepartment.tsx                       # REFACTOR - Redirect to HRDashboard or keep as wrapper
└── ... (other components unchanged)
```

### Backend Structure
```
backend/app/
├── api/routes/
│   ├── hr.py                              # NEW - HR-specific routes
│   └── documents.py                       # KEEP - Existing (backward compatibility)
├── models/
│   ├── hr.py                              # NEW - HR models (Employee, HRDocument)
│   └── document.py                        # KEEP - Existing
└── services/
    ├── hr_service.py                      # NEW - HR business logic
    └── file_service.py                    # KEEP - Existing
```

---

## Detailed File Changes

### Frontend Files

#### 1. NEW: `src/app/components/hr/types.ts`
- TypeScript interfaces for:
  - `Employee` interface
  - `HRDocument` interface (moved from FactoryContext)
  - HR module types

#### 2. NEW: `src/app/components/hr/HRDashboard.tsx`
- **Purpose**: Main HR module entry point
- **Features**:
  - Tab navigation (Employees, Documents, Library)
  - Overview statistics cards
  - Clean header with title
- **Routes**: Handles `/hr` route

#### 3. NEW: `src/app/components/hr/HREmployees.tsx`
- **Purpose**: Employee management page
- **Features**:
  - Employee table with search/filter
  - Add/Edit/Delete employee actions
  - Employee statistics cards
  - Modern table layout using shadcn/ui Table component

#### 4. NEW: `src/app/components/hr/HRDocuments.tsx`
- **Purpose**: Document workflow page
- **Features**:
  - Extracted from current HRDepartment.tsx
  - Kanban-style workflow columns (Draft, Pending, Approved, Archived)
  - Document filtering and search
  - Status management

#### 5. NEW: `src/app/components/hr/HRDocumentLibrary.tsx`
- **Purpose**: Document library page
- **Features**:
  - Extracted from current HRDepartment.tsx
  - Category-based folder view
  - Document grid/list view
  - Browse by category

#### 6. NEW: `src/app/components/hr/components/EmployeeTable.tsx`
- **Purpose**: Reusable employee table component
- **Features**:
  - Table with columns: Name, Position, Department, Status, Actions
  - Sortable columns
  - Action buttons (Edit, Delete)

#### 7. NEW: `src/app/components/hr/components/EmployeeForm.tsx`
- **Purpose**: Employee create/edit form
- **Features**:
  - Form fields: Name, Email, Phone, Position, Department, Hire Date
  - Validation
  - Dialog/modal form

#### 8. NEW: `src/app/components/hr/components/DocumentWorkflow.tsx`
- **Purpose**: Extracted document workflow columns
- **Features**:
  - WorkflowColumn components
  - Status transition logic
  - Drag & drop ready (future enhancement)

#### 9. MODIFIED: `src/app/components/HRDepartment.tsx`
- **Options**:
  - **Option A**: Keep as wrapper that redirects to HRDashboard
  - **Option B**: Replace content with HRDashboard import
  - **Recommendation**: Option B - Replace content to maintain route compatibility

#### 10. MODIFIED: `src/app/context/FactoryContext.tsx`
- **Add**:
  - `Employee` interface
  - `employees` state
  - `initialEmployees` data
  - Employee CRUD functions: `addEmployee`, `updateEmployee`, `deleteEmployee`
  - Keep existing `hrDocuments` and `updateDocumentStatus`

#### 11. MODIFIED: `src/locales/uz.json` & `src/locales/ru.json`
- **Add translations for**:
  - Employee management (employees, addEmployee, editEmployee, etc.)
  - HR navigation tabs
  - Employee fields (name, position, department, etc.)

### Backend Files

#### 1. NEW: `backend/app/models/hr.py`
- **Models**:
  - `Employee` (Pydantic model)
  - `EmployeeCreate`
  - `EmployeeUpdate`
  - `HRDocument` (enhanced from current)
  - `HRDocumentCreate`
  - `HRDocumentUpdate`

#### 2. NEW: `backend/app/api/routes/hr.py`
- **Routes**:
  - `GET /api/v1/hr/employees` - List employees
  - `GET /api/v1/hr/employees/{id}` - Get employee
  - `POST /api/v1/hr/employees` - Create employee
  - `PATCH /api/v1/hr/employees/{id}` - Update employee
  - `DELETE /api/v1/hr/employees/{id}` - Delete employee
  - `GET /api/v1/hr/documents` - List HR documents
  - `POST /api/v1/hr/documents` - Create HR document
  - `PATCH /api/v1/hr/documents/{id}` - Update document status
  - `GET /api/v1/hr/health` - Health check

#### 3. NEW: `backend/app/services/hr_service.py`
- **Service Class**: `HRService`
- **Methods**:
  - Employee CRUD operations
  - HR Document operations
  - In-memory storage (ready for database migration)

#### 4. MODIFIED: `backend/app/main.py`
- **Add**: `from app.api.routes import hr`
- **Add**: `app.include_router(hr.router, prefix=API_PREFIX)`

#### 5. MODIFIED: `backend/app/models/__init__.py`
- **Add**: HR model exports

#### 6. MODIFIED: `backend/app/services/__init__.py`
- **Add**: HR service exports

#### 7. KEEP UNCHANGED: `backend/app/api/routes/documents.py`
- Keep for backward compatibility
- Can be deprecated later

---

## Navigation Structure

### Internal HR Navigation (Tabs)
```
HR Dashboard (/hr)
├── [Tab: Employees] → Employee Management
├── [Tab: Documents] → Document Workflow
└── [Tab: Library] → Document Library
```

### Route Structure
- `/hr` → HRDashboard (with tabs)
- `/hr/employees` → HREmployees (optional separate route)
- `/hr/documents` → HRDocuments (optional separate route)
- `/hr/library` → HRDocumentLibrary (optional separate route)

**Recommendation**: Use tabs within HRDashboard for internal navigation (simpler, keeps everything in one place)

---

## Component Architecture

### HRDashboard Component
```typescript
HRDashboard
├── Header (Title + Stats Cards)
├── Tabs Navigation
│   ├── Employees Tab → HREmployees component
│   ├── Documents Tab → HRDocuments component
│   └── Library Tab → HRDocumentLibrary component
└── Footer (optional)
```

### Data Flow
```
FactoryContext (State Management)
├── employees: Employee[]
├── hrDocuments: HRDocument[]
└── Functions:
    ├── addEmployee, updateEmployee, deleteEmployee
    └── updateDocumentStatus
```

---

## UI/UX Improvements

### 1. Modern Admin Layout
- Card-based design
- Clean spacing and typography
- Consistent color scheme
- Responsive grid layouts

### 2. Employee Management
- Table with sorting and filtering
- Modal dialogs for forms
- Action buttons with icons
- Status badges

### 3. Document Workflow
- Improved kanban columns
- Better card design
- Smooth status transitions
- Clear action buttons

### 4. Document Library
- Grid/List toggle view
- Category filtering
- Search functionality
- Document preview (future)

---

## Migration Strategy

### Phase 1: Structure Setup
1. Create `src/app/components/hr/` folder
2. Create `backend/app/models/hr.py`
3. Create `backend/app/services/hr_service.py`
4. Create `backend/app/api/routes/hr.py`

### Phase 2: Employee Management
1. Add Employee types and interfaces
2. Create Employee components
3. Create Employee API endpoints
4. Add to FactoryContext
5. Test employee CRUD

### Phase 3: Document Refactoring
1. Extract DocumentWorkflow component
2. Extract DocumentLibrary component
3. Create HRDocuments page
4. Create HRDocumentLibrary page
5. Update translations

### Phase 4: Dashboard Integration
1. Create HRDashboard with tabs
2. Integrate all pages
3. Update HRDepartment.tsx
4. Update routes
5. Final testing

---

## Key Decisions

### 1. Tab Navigation vs Route Navigation
**Decision**: Use Tabs within HRDashboard
**Reason**: Keeps HR module self-contained, simpler state management

### 2. Keep or Replace HRDepartment.tsx
**Decision**: Replace content (import HRDashboard)
**Reason**: Maintains route compatibility, cleaner code

### 3. Backend Route Structure
**Decision**: Create new `/hr` routes, keep `/documents` for compatibility
**Reason**: Clear separation, backward compatibility

### 4. Data Storage
**Decision**: Keep in-memory (FactoryContext) for now
**Reason**: Matches current architecture, easy to migrate to API later

### 5. Employee Fields
**Decision**: Start with basic fields (name, email, phone, position, department, hire date, status)
**Reason**: MVP approach, can extend later

---

## Files Summary

### New Files (Frontend): 9
1. `src/app/components/hr/types.ts`
2. `src/app/components/hr/HRDashboard.tsx`
3. `src/app/components/hr/HREmployees.tsx`
4. `src/app/components/hr/HRDocuments.tsx`
5. `src/app/components/hr/HRDocumentLibrary.tsx`
6. `src/app/components/hr/components/EmployeeTable.tsx`
7. `src/app/components/hr/components/EmployeeForm.tsx`
8. `src/app/components/hr/components/DocumentWorkflow.tsx`
9. `src/app/components/hr/components/DocumentLibraryGrid.tsx`

### Modified Files (Frontend): 3
1. `src/app/components/HRDepartment.tsx` - Replace with HRDashboard
2. `src/app/context/FactoryContext.tsx` - Add employee state
3. `src/locales/uz.json` & `ru.json` - Add translations

### New Files (Backend): 3
1. `backend/app/models/hr.py`
2. `backend/app/api/routes/hr.py`
3. `backend/app/services/hr_service.py`

### Modified Files (Backend): 3
1. `backend/app/main.py` - Register HR routes
2. `backend/app/models/__init__.py` - Export HR models
3. `backend/app/services/__init__.py` - Export HR service

### Total: 15 files to create, 6 files to modify

---

## Testing Checklist

- [ ] Employee CRUD operations work
- [ ] Document workflow status changes work
- [ ] Document library displays correctly
- [ ] Tab navigation works
- [ ] Search and filters work
- [ ] Translations are correct
- [ ] Responsive design works
- [ ] No console errors
- [ ] Existing HR functionality still works
- [ ] Other modules (Maintenance, Warehouse, etc.) unaffected

---

## Future Enhancements (Out of Scope)

- Employee profile pages
- Document upload/attach to employees
- Advanced search and filters
- Export functionality
- Email notifications
- Role-based access control
- Database integration
- File attachments
- Document versioning

---

## Notes

1. **No Breaking Changes**: All existing functionality preserved
2. **Backward Compatible**: `/documents` route still works
3. **Isolated Changes**: Only HR module affected
4. **Pattern Consistency**: Follows Maintenance module patterns
5. **Extensible**: Easy to add features later




