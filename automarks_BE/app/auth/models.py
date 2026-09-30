from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    STUDENT = "student"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "auth_users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    role = Column(String(20), nullable=False, default=UserRole.STUDENT.value)
    password_hash = Column(String(500), nullable=True) # Null for students (OTP only)
    is_verified = Column(Boolean, default=False)
    totp_secret = Column(String(100), nullable=True) # For Admin 2FA
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    otps = relationship("OTP", back_populates="user", cascade="all, delete-orphan")

class OTP(Base):
    __tablename__ = "auth_otps"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False)
    otp_hash = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    attempts = Column(Integer, default=0)

    # Relationships
    user = relationship("User", back_populates="otps")
