
import sys
import os
from sqlalchemy import text

# Add parent directory to path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app.models import Result

def migrate_results_table():
    print("🚀 Starting database migration to fix constraints...")
    
    with engine.connect() as conn:
        # Check if table exists
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='results'"))
        if not result.fetchone():
            print("results table does not exist. Initializing new DB...")
            Base.metadata.create_all(bind=engine)
            print("✅ Done.")
            return

        print("📦 Backing up existing data...")
        # SQLite doesn't support dropping constraints, so we must recreate the table
        # 1. Rename existing table
        conn.execute(text("ALTER TABLE results RENAME TO results_old"))
        
        # 2. Create new table with updated constraints (from models.py)
        # We use Base.metadata.create_all but only for the specific table if possible,
        # or just let it skip existing ones.
        print("🔨 Creating new results table with updated constraints...")
        Base.metadata.create_all(bind=conn)
        
        # 3. Copy data
        print("REQ Copying data...")
        # Get columns from old table to ensure we map correctly
        # Assuming simple copy is fine as columns haven't changed name/type, only constraints
        columns = [c.name for c in Result.__table__.columns]
        cols_str = ", ".join(columns)
        
        conn.execute(text(f"INSERT INTO results ({cols_str}) SELECT {cols_str} FROM results_old"))
        
        # 4. Verify count
        old_count = conn.execute(text("SELECT COUNT(*) FROM results_old")).scalar()
        new_count = conn.execute(text("SELECT COUNT(*) FROM results")).scalar()
        
        print(f"📊 Migration stats: Old records: {old_count}, New records: {new_count}")
        
        if old_count == new_count:
            print("🗑️ Dropping backup table...")
            conn.execute(text("DROP TABLE results_old"))
            print("✅ Migration successful!")
        else:
            print("❌ Mismatch in record counts! Keeping results_old for manual inspection.")
            
        conn.commit()

if __name__ == "__main__":
    try:
        migrate_results_table()
    except Exception as e:
        print(f"❌ Migration failed: {e}")
