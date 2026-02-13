"""
Database configuration and session management
PostgreSQL database setup for VTU Results System (Production-grade)
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from typing import Generator
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()


def get_database_url() -> str:
    """
    Build PostgreSQL database URL from environment variables.
    Supports DATABASE_URL override for container / cloud deployments.
    """
    # Allow a full connection string override (Heroku, Render, Docker, etc.)
    full_url = os.getenv("DATABASE_URL")
    if full_url:
        # Heroku-style postgres:// needs to be postgresql://
        if full_url.startswith("postgres://"):
            full_url = full_url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif full_url.startswith("postgresql://"):
            full_url = full_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return full_url

    db_type = os.getenv("DB_TYPE", "postgresql").lower()
    
    if db_type == "sqlite":
        # SQLite database file path (relative to project root)
        return "sqlite:///./vtu_results.db"

    user = os.getenv("POSTGRES_USER", "postgres")
    raw_password = os.getenv("POSTGRES_PASSWORD", "")
    password = quote_plus(raw_password)
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    database = os.getenv("POSTGRES_DB", "vtu_results")

    return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"


# Database URL
DATABASE_URL = get_database_url()

# Configure engine arguments based on DB type
connect_args = {}
pool_args = {}

if "sqlite" in DATABASE_URL:
    print(f"🔌 Database Type: SQLite")
    print(f"🔗 Connecting to: {DATABASE_URL}")
    connect_args = {"check_same_thread": False}  # Needed for SQLite with multi-threading
else:
    # Log masked password for Postgres
    _display_url = DATABASE_URL.split("@")[1] if "@" in DATABASE_URL else "database"
    print(f"🔌 Database Type: PostgreSQL")
    print(f"🔗 Connecting to: {_display_url}")
    
    # Production-grade pool settings for Postgres
    pool_args = {
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
        "pool_recycle": 1800,
        "pool_timeout": 30,
    }

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=os.getenv("DEBUG", "False").lower() == "true",
    **pool_args
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()


def get_db() -> Generator:
    """
    FastAPI dependency to get a database session.
    Yields a session and ensures it is closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database tables from ORM models.
    """
    Base.metadata.create_all(bind=engine)
