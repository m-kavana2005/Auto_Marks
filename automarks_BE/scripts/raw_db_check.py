import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn_str = f"dbname='{os.getenv('POSTGRES_DB', 'vtu_results')}' user='{os.getenv('POSTGRES_USER', 'postgres')}' password='{os.getenv('POSTGRES_PASSWORD', '')}' host='{os.getenv('POSTGRES_HOST', 'localhost')}'"

try:
    print(f"Connecting to: {os.getenv('POSTGRES_DB', 'vtu_results')} at {os.getenv('POSTGRES_HOST', 'localhost')}")
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    cur.execute("SELECT current_schema()")
    print(f"Current Schema: {cur.fetchone()[0]}")
    
    cur.execute("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'")
    tables = cur.fetchall()
    print("Tables in 'public' schema:")
    for t in tables:
        print(f" - {t[0]}")
        
    cur.close()
    conn.close()
except Exception as e:
    print(f"RAW PASYCOPG2 DIAGNOSTIC FAILED: {e}")
