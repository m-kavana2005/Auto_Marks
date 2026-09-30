import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database import init_db, engine
from app.models import Base as ModelsBase
from app.auth.models import User, OTP
from sqlalchemy import text

try:
    print("Initializing database...")
    init_db()
    print("Database initialized successfully.")
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"))
        tables = [row[0] for row in result]
        print(f"Tables in public schema: {tables}")
except Exception as e:
    print(f"Error during manual init: {e}")
