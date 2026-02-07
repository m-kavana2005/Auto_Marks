"""
Migration script to add current_file and current_file_index columns to upload_logs table
Run this script to update the database schema
"""
from sqlalchemy import text
from app.database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    """Add new columns to upload_logs table"""
    with engine.connect() as conn:
        try:
            # Add current_file column
            conn.execute(text("""
                ALTER TABLE upload_logs 
                ADD COLUMN current_file VARCHAR(255) NULL
            """))
            logger.info("✓ Added current_file column")
        except Exception as e:
            if "Duplicate column name" in str(e):
                logger.info("✓ current_file column already exists")
            else:
                logger.error(f"Error adding current_file: {e}")
        
        try:
            # Add current_file_index column
            conn.execute(text("""
                ALTER TABLE upload_logs 
                ADD COLUMN current_file_index INT DEFAULT 0
            """))
            logger.info("✓ Added current_file_index column")
        except Exception as e:
            if "Duplicate column name" in str(e):
                logger.info("✓ current_file_index column already exists")
            else:
                logger.error(f"Error adding current_file_index: {e}")
        
        conn.commit()
        logger.info("✅ Migration completed successfully!")

if __name__ == "__main__":
    migrate()
