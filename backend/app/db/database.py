from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Use a local SQLite database for development, can be easily swapped to postgresql://
SQLALCHEMY_DATABASE_URL = "sqlite:///./wms.db"
# Example PostgreSQL string: "postgresql://user:password@localhost/wms"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
