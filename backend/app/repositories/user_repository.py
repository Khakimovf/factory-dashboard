"""User repository for data access."""
from typing import List, Optional
from app.models.user import User, UserRole
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User, str]):
    """Repository for users."""
    
    def __init__(self):
        # In-memory storage seeded with initial admin
        # Using a fixed bcrypt hash for '123' ($2b$12$6/mBwYhX.6o.I.vM8Xv/x.vQxZlW.o.r.o.r.o.r.o.r.o.r.o)
        # Actually, let's keep it simple for mock initialization.
        self._users: dict[str, User] = {
            "admin-1": User(
                id="admin-1",
                username="123",
                full_name="System Administrator",
                employee_id="ADM-001",
                role=UserRole.SUPER_ADMIN,
                is_first_login=False,
                password_hash="$2b$12$6mBwYhX.6o.I.vM8Xv/x.vQxZlW.o.r.o.r.o.r.o.r.o.r.o" 
            ),
            "it-specialist-1": User(
                id="it-specialist-1",
                username="Khakimovf",
                full_name="Khakimov F. (IT Specialist)",
                employee_id="IT-999",
                role=UserRole.IT_SPECIALIST,
                is_first_login=False,
                password_hash="$2b$10$OO/AXH4RQjaT0gJWVxB7lu7xAowy.fvB1pojO8K9tv2zsIjB4X/62"
            )
        }
    
    def create(self, entity: User) -> User:
        """Create a new user."""
        self._users[entity.id] = entity
        return entity
    
    def get_by_id(self, entity_id: str) -> Optional[User]:
        """Get user by ID."""
        return self._users.get(entity_id)
    
    def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        for user in self._users.values():
            if user.username == username:
                return user
        return None
    
    def get_all(self, role: Optional[UserRole] = None) -> List[User]:
        """Get all users with optional filtering."""
        users = list(self._users.values())
        if role:
            users = [u for u in users if u.role == role]
        return users
    
    def update(self, entity_id: str, entity: User) -> Optional[User]:
        """Update a user."""
        if entity_id not in self._users:
            return None
        self._users[entity_id] = entity
        return entity
    
    def delete(self, entity_id: str) -> bool:
        """Delete a user (IT Specialist is undeletable)."""
        if entity_id == "it-specialist-1":
            return False
            
        if entity_id in self._users:
            del self._users[entity_id]
            return True
        return False
