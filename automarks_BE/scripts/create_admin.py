import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.auth.models import User, UserRole
from app.auth.utils import get_password_hash
from app.auth.models import Base

def create_admin(email, password):
    db: Session = SessionLocal()
    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User {email} already exists. Updating to Admin.")
            existing_user.role = UserRole.ADMIN.value
            existing_user.password_hash = get_password_hash(password)
            existing_user.is_verified = True
        else:
            new_admin = User(
                email=email,
                role=UserRole.ADMIN.value,
                password_hash=get_password_hash(password),
                is_verified=True
            )
            db.add(new_admin)
        
        db.commit()
        print(f"Successfully created/updated admin user: {email}")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python scripts/create_admin.py <email> <password>")
    else:
        create_admin(sys.argv[1], sys.argv[2])
