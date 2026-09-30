from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: Optional[str] = None
    role: str = "student"

class UserResponse(UserBase):
    id: int
    role: str
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Student Flow Schemas
class StudentLoginRequest(BaseModel):
    email: EmailStr

class StudentVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

# Admin Flow Schemas
class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

class AdminVerify2FARequest(BaseModel):
    email: EmailStr
    code: str

class AdminSetup2FAResponse(BaseModel):
    secret: str
    qr_code_base64: str
    provisioning_uri: str
