"""User models."""
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class UserRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    QC_MANAGER = "QC_MANAGER"
    QC_OPERATOR = "QC_OPERATOR"
    VGM_GUARD = "VGM_GUARD"
    CANTEEN_MANAGER = "CANTEEN_MANAGER"
    ADMIN = "ADMIN"
    WAREHOUSE_ADMIN = "WAREHOUSE_ADMIN"
    FACTORY_MANAGER = "FACTORY_MANAGER"
    IT_SPECIALIST = "IT_SPECIALIST"

class User(BaseModel):
    """User model."""
    id: str = Field(..., description="Unique user ID")
    username: str = Field(..., description="Unique username")
    full_name: str = Field(..., description="Full name of the employee")
    employee_id: str = Field(..., description="Employee ID / Tabel raqami")
    role: UserRole = Field(..., description="User role for RBAC")
    is_first_login: bool = Field(default=True, description="Whether this is the user's first login")
    password_hash: str = Field(..., description="Hashed password (mock for now)")

class UserCreate(BaseModel):
    """Model for creating a new user."""
    username: str
    full_name: str
    employee_id: str
    role: UserRole
    password: str

class UserLogin(BaseModel):
    """Model for user login."""
    username: str
    password: str

class PasswordUpdate(BaseModel):
    """Model for updating password."""
    old_password: str
    new_password: str
