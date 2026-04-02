
import os
import sqlite3
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def check_sqlite():
    db_path = "vtu_results.db"
    if os.path.exists(db_path):
        print(f"--- Checking SQLite ({db_path}) ---")
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT id, email, full_name, is_verified FROM users")
            rows = cursor.fetchall()
            for r in rows:
                print(f"ID: {r[0]} | Email: {r[1]} | Name: {r[2]} | Verified: {r[3]}")
            conn.close()
        except Exception as e:
            print(f"SQLite error: {e}")
    else:
        print("SQLite file not found.")

def check_postgres():
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    db_name = os.getenv("POSTGRES_DB", "vtu_results")
    url = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{db_name}"
    
    print(f"--- Checking Postgres ({host}:{port}/{db_name}) ---")
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT id, email, full_name, is_verified FROM users"))
            for r in result:
                print(f"ID: {r[0]} | Email: {r[1]} | Name: {r[2]} | Verified: {r[3]}")
    except Exception as e:
        print(f"Postgres error: {e}")

check_sqlite()
print("\n")
check_postgres()
