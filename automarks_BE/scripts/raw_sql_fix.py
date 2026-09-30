import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database import engine
from sqlalchemy import text

try:
    print("Trying to create users table manually...")
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                role VARCHAR(20) NOT NULL,
                password_hash VARCHAR(500),
                is_verified BOOLEAN DEFAULT FALSE,
                totp_secret VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()
    print("Users table created or already exists.")
except Exception as e:
    print(f"FAILED to create users table: {e}")

try:
    print("Trying to create otps table manually...")
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS otps (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
                otp_hash VARCHAR(500) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                attempts INTEGER DEFAULT 0
            )
        """))
        conn.commit()
    print("Otps table created or already exists.")
except Exception as e:
    print(f"FAILED to create otps table: {e}")
