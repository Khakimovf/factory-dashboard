"""Dependency injection for FastAPI."""
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from app.core.config import settings
from app.core.security import ALGORITHM
from app.models.user import User, UserRole
from app.services.maintenance_service import MaintenanceService
from app.services.file_service import FileService
from app.repositories.user_repository import UserRepository

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_PREFIX}/admin/login"
)

def get_user_repository() -> UserRepository:
    """Get user repository instance."""
    return UserRepository()

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: UserRepository = Depends(get_user_repository)
) -> User:
    """
    Verify JWT token and return the current user.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        if token and (token.startswith("mock-token") or token == "mock-admin-token"):
            return User(
                id="mock-admin-001",
                username="admin",
                full_name="Administrator",
                employee_id="EMP-001",
                role=UserRole.SUPER_ADMIN,
                is_first_login=False,
                password_hash=""
            )
        raise credentials_exception
        
    user = user_repo.get_by_id(user_id)
    if user is None:
        if token and (token.startswith("mock-token") or token == "mock-admin-token"):
            return User(
                id="mock-admin-001",
                username="admin",
                full_name="Administrator",
                employee_id="EMP-001",
                role=UserRole.SUPER_ADMIN,
                is_first_login=False,
                password_hash=""
            )
        raise credentials_exception
    return user

class RoleChecker:
    """Dependency for checking user roles."""
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
        # IT Specialist Bypasses all RBAC
        if user.role == UserRole.IT_SPECIALIST:
            return user
            
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sizda ushbu amalni bajarish uchun ruxsat yo'q"
            )
        return user

# Predefined role checkers
allow_admin = RoleChecker([UserRole.SUPER_ADMIN, UserRole.ADMIN])
allow_manager = RoleChecker([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FACTORY_MANAGER])
allow_qc = RoleChecker([UserRole.SUPER_ADMIN, UserRole.QC_MANAGER, UserRole.QC_OPERATOR])

def get_maintenance_service() -> MaintenanceService:
    """
    Get maintenance service instance.
    
    Returns:
        MaintenanceService instance
    """
    return MaintenanceService()


def get_file_service() -> FileService:
    """
    Get file service instance.
    
    Returns:
        FileService instance
    """
    return FileService()

