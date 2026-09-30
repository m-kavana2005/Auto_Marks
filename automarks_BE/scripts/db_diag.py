import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database import engine
from sqlalchemy import text

try:
    print(f"DEBUG: Engine URL: {engine.url}")
    with engine.connect() as conn:
        # Check current schema
        schema_res = conn.execute(text("SELECT current_schema()"))
        print(f"Current Schema: {schema_res.scalar()}")
        
        # List all tables in all schemas
        print("\nAll Tables (across all schemas):")
        res = conn.execute(text("SELECT schemaname, tablename FROM pg_catalog.pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')"))
        for row in res:
            print(f" - {row[0]}.{row[1]}")
            
except Exception as e:
    print(f"DIAGNOSTIC FAILED: {e}")
