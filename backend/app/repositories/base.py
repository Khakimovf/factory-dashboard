"""Base repository interface."""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, List

T = TypeVar('T')
ID = TypeVar('ID')


class BaseRepository(ABC, Generic[T, ID]):
    """Base repository interface."""
    
    @abstractmethod
    def create(self, entity: T) -> T:
        """Create a new entity."""
        pass
    
    @abstractmethod
    def get_by_id(self, entity_id: ID) -> Optional[T]:
        """Get entity by ID."""
        pass
    
    @abstractmethod
    def get_all(self, **filters) -> List[T]:
        """Get all entities with optional filters."""
        pass
    
    @abstractmethod
    def update(self, entity_id: ID, entity: T) -> Optional[T]:
        """Update an entity."""
        pass
    
    @abstractmethod
    def delete(self, entity_id: ID) -> bool:
        """Delete an entity."""
        pass

