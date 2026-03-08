"""Admin routes for user management."""
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import User, UserCreate, UserLogin, PasswordUpdate, UserRole
from app.models.audit import AuditLog
from app.services.user_service import UserService
from app.repositories.user_repository import UserRepository
from app.repositories.audit_repository import AuditRepository
from app.core.security import create_access_token
from app.core.dependencies import get_current_user, allow_admin, allow_manager

router = APIRouter(prefix="/admin", tags=["admin"])

# Singleton repositories/services for mock
user_repo = UserRepository()
audit_repo = AuditRepository()
user_service = UserService(user_repo, audit_repo)

@router.post("/login")
async def login(login_data: UserLogin):
    """Authenticated login returning JWT."""
    user = user_service.get_user_by_username(login_data.username)
    if user and user_service.verify_password(login_data.password, user.password_hash):
        access_token = create_access_token(subject=user.id)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "full_name": user.full_name,
                "is_first_login": user.is_first_login
            }
        }
    raise HTTPException(status_code=401, detail="Noto'g'ri username yoki parol")

@router.post("/users", response_model=User, dependencies=[Depends(allow_admin)])
async def create_user(
    user_create: UserCreate, 
    current_admin: User = Depends(get_current_user)
):
    """Create a new user (Restricted to Admin)."""
    return user_service.register_user(user_create, current_admin.id, current_admin.username)

@router.get("/users", response_model=List[User], dependencies=[Depends(allow_admin)])
async def list_users():
    """List all users (Restricted to Admin)."""
    return user_service.list_users()

@router.get("/audit", response_model=List[AuditLog], dependencies=[Depends(allow_admin)])
async def get_audit_logs():
    """Get audit logs (Restricted to Admin)."""
    return user_service.get_audit_logs()

@router.post("/update-password/{user_id}")
async def update_password(
    user_id: str, 
    password_update: PasswordUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update user password (User must be owner or Admin)."""
    if current_user.id != user_id and current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")
        
    success = user_service.update_password(user_id, password_update)
    if success:
        return {"status": "success"}
    raise HTTPException(status_code=400, detail="Parolni yangilab bo'lmadi")
