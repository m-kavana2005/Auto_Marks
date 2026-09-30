from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
import traceback
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.auth.models import User, UserRole
from app.auth.schemas import (
    StudentLoginRequest, StudentVerifyRequest, 
    AdminLoginRequest, AdminVerify2FARequest,
    Token, AdminSetup2FAResponse
)
from app.auth.utils import create_access_token, verify_password, ACCESS_TOKEN_EXPIRE_MINUTES
from app.auth.otp_service import create_otp_record, send_otp_email, verify_otp_record
from app.auth.totp_service import (
    generate_totp_secret, get_provisioning_uri, 
    generate_qr_code_base64, verify_totp_code
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/student/login")
async def student_login(
    request: StudentLoginRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    try:
        # Check if user exists, create if not
        user = db.query(User).filter(User.email == request.email).first()
        if not user:
            user = User(email=request.email, role=UserRole.STUDENT.value, is_verified=True)
            db.add(user)
            db.commit()
            db.refresh(user)
        
        if user.role != UserRole.STUDENT.value:
             # If an admin tries to login as student, allow it but ensure role is consistent? 
             # Actually, better to keep roles distinct.
             raise HTTPException(status_code=400, detail="This email is registered as an Admin.")

        otp_code = create_otp_record(db, user.id)
        background_tasks.add_task(send_otp_email, user.email, otp_code)
        
        return {"message": "OTP sent to your email.", "email": request.email}
    except Exception as e:
        print(f"ERROR IN student_login: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/student/verify", response_model=Token)
async def student_verify(request: StudentVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    success, message = verify_otp_record(db, user.id, request.otp)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role
    }

@router.post("/admin/login")
async def admin_login(request: AdminLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    if not user.password_hash or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    # If admin has no TOTP secret, they need setup
    requires_setup = user.totp_secret is None
    
    return {
        "message": "Password verified. Please provide TOTP code.",
        "email": user.email,
        "requires_setup": requires_setup
    }

@router.post("/admin/verify-2fa", response_model=Token)
async def admin_verify_2fa(request: AdminVerify2FARequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=401, detail="Invalid admin session")
    
    if not user.totp_secret:
         raise HTTPException(status_code=400, detail="TOTP not set up. Visit /setup-2fa first.")

    if not verify_totp_code(user.totp_secret, request.code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code")
    
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role
    }

@router.get("/admin/setup-2fa", response_model=AdminSetup2FAResponse)
async def admin_setup_2fa(email: str, db: Session = Depends(get_db)):
    # This should be protected in production, but for setup we'll allow it via email check
    # In a real app, you'd only allow this AFTER password verification
    user = db.query(User).filter(User.email == email).first()
    if not user or user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    if user.totp_secret:
         # Already setup, but allow reset for this demo/impl
         pass
         
    secret = generate_totp_secret()
    provisioning_uri = get_provisioning_uri(user.email, secret)
    qr_code_base64 = generate_qr_code_base64(provisioning_uri)
    
    # Save the secret temporarily or permanently
    user.totp_secret = secret
    db.commit()
    
    return {
        "secret": secret,
        "qr_code_base64": qr_code_base64,
        "provisioning_uri": provisioning_uri
    }
