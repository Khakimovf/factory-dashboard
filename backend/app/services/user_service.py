"""User service for business logic."""
import uuid
from datetime import datetime
from typing import List, Optional
from app.models.user import User, UserCreate, UserRole, PasswordUpdate
from app.models.audit import AuditLog
from app.repositories.user_repository import UserRepository
from app.repositories.audit_repository import AuditRepository

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserService:
    """Service for user management."""
    
    def __init__(self, user_repo: UserRepository, audit_repo: AuditRepository):
        self.user_repo = user_repo
        self.audit_repo = audit_repo
    
    def register_user(self, user_create: UserCreate, admin_id: str, admin_username: str) -> User:
        """Register a new user and log the action."""
        # Unique username check
        if self.user_repo.get_by_username(user_create.username):
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Bu username allaqachon mavjud")

        new_user = User(
            id=str(uuid.uuid4()),
            username=user_create.username,
            full_name=user_create.full_name,
            employee_id=user_create.employee_id,
            role=user_create.role,
            is_first_login=True,
            password_hash=pwd_context.hash(user_create.password)
        )
        created_user = self.user_repo.create(new_user)
        
        # Log action
        self.audit_repo.create(AuditLog(
            id=str(uuid.uuid4()),
            user_id=admin_id,
            username=admin_username,
            action="CREATE_USER",
            module="ADMIN",
            status="SUCCESS",
            details={
                "target_username": created_user.username,
                "target_role": created_user.role
            },
            target_id=created_user.id,
            new_value=user_create.dict(exclude={"password"})
        ))
        
        return created_user
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        return self.user_repo.get_by_username(username)
    
    def update_password(self, user_id: str, password_update: PasswordUpdate) -> bool:
        """Update user password and clear first login flag."""
        user = self.user_repo.get_by_id(user_id)
        if not user or not pwd_context.verify(password_update.old_password, user.password_hash):
            return False
        
        user.password_hash = pwd_context.hash(password_update.new_password)
        user.is_first_login = False
        self.user_repo.update(user_id, user)
        
        # Log action
        self.audit_repo.create(AuditLog(
            id=str(uuid.uuid4()),
            user_id=user.id,
            username=user.username,
            action="CHANGE_PASSWORD",
            module="AUTH",
            status="SUCCESS",
            details={"type": "self_service"},
            target_id=user.id
        ))
        
        return True

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash."""
        return pwd_context.verify(plain_password, hashed_password)
    
    def list_users(self) -> List[User]:
        """List all users."""
        return self.user_repo.get_all()
    
    def get_audit_logs(self) -> List[AuditLog]:
        """Get all audit logs."""
        return self.audit_repo.get_all()
