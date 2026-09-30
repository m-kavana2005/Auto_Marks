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
    Build the database URL from environment variables.
    Supports DATABASE_URL override for container / cloud deployments.
    Falls back to SQLite for local development when PostgreSQL is not configured.
    """
    # Allow a full connection string override (Heroku, Render, Docker, etc.)
    full_url = os.getenv("DATABASE_URL")
    if full_url:
        # Heroku-style postgres:// needs to be postgresql://
        if full_url.startswith("postgres://"):
            full_url = full_url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif full_url.startswith("postgresql://"):
            full_url = full_url.replace("postgresql://", "postgresql+psycopg2://", 1)

        if "localhost" in full_url or "127.0.0.1" in full_url:
            postgres_config_present = any(
                os.getenv(var) not in (None, "")
                for var in ("POSTGRES_HOST", "POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_PORT")
            )
            if not postgres_config_present:
                print("[DB] Local DATABASE_URL detected; falling back to SQLite")
                return "sqlite:///./vtu_results.db"

        return full_url

    db_type = (os.getenv("DB_TYPE") or "sqlite").strip().lower()

    if db_type in {"", "sqlite"}:
        # SQLite database file path (relative to project root)
        return "sqlite:///./vtu_results.db"

    # If PostgreSQL was requested but no explicit connection settings are supplied,
    # fall back to SQLite so local development works without a running server.
    postgres_host = (os.getenv("POSTGRES_HOST") or "").strip()
    postgres_user = (os.getenv("POSTGRES_USER") or "").strip()
    postgres_password = os.getenv("POSTGRES_PASSWORD") or ""
    is_explicit_postgres = bool(
        (postgres_host and postgres_host not in {"localhost", "127.0.0.1", "0.0.0.0"})
        or (postgres_user and postgres_user != "postgres")
        or postgres_password
    )

    if not is_explicit_postgres:
        print("[DB] PostgreSQL not explicitly configured; falling back to SQLite")
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
    print(f"[DB] Database Type: SQLite")
    print(f"[DB] Connecting to: {DATABASE_URL}")
    connect_args = {"check_same_thread": False}  # Needed for SQLite with multi-threading
else:
    # Log masked password for Postgres
    _display_url = DATABASE_URL.split("@")[1] if "@" in DATABASE_URL else "database"
    print(f"[DB] Database Type: PostgreSQL")
    print(f"[DB] Connecting to: {_display_url}")
    
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
