
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

from app.database import get_database_url
from app.models import User, Base
from sqlalchemy.orm import sessionmaker

db_url = get_database_url()
print(f"Connecting to: {db_url}")

engine = create_engine(db_url)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    users = db.query(User).all()
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"ID: {u.id} | Email: {u.email} | Verified: {u.is_verified}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
