import os
import random
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.auth.models import OTP, User
from app.auth.utils import get_password_hash, verify_password
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# SMTP Config
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

def generate_otp():
    return str(random.randint(100000, 999999))

async def send_otp_email(email: str, otp: str):
    """
    Sends OTP via SMTP. Falls back to console logging if credentials are missing or send fails.
    """
    if not SMTP_EMAIL or not SMTP_PASSWORD or "your_email" in SMTP_EMAIL:
        logger.warning(f"SMTP Credentials not configured. Login OTP for {email} is: {otp}")
        print(f"\n[AUTH DEBUG] OTP for {email}: {otp}\n")
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = f"AutoMarks System <{SMTP_EMAIL}>"
        msg['To'] = email
        msg['Subject'] = "AutoMarks OTP Verification"

        body = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4f46e5;">AutoMarks Verification</h2>
            <p>Your One-Time Password (OTP) for login is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; padding: 10px 0;">
                {otp}
            </div>
            <p style="color: #64748b; font-size: 14px;">Valid for 5 minutes. Do not share this code.</p>
        </div>
        """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        # Fallback for dev/testing
        logger.warning(f"FALLBACK: OTP for {email} is: {otp}")
        print(f"\n[AUTH FALLBACK] OTP for {email}: {otp}\n")
        return False

def create_otp_record(db: Session, user_id: int):
    # Expire old OTPs for this user
    db.query(OTP).filter(OTP.user_id == user_id).delete()
    
    otp_code = generate_otp()
    otp_hash = get_password_hash(otp_code)
    
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    new_otp = OTP(
        user_id=user_id,
        otp_hash=otp_hash,
        expires_at=expires_at
    )
    db.add(new_otp)
    db.commit()
    
    return otp_code

def verify_otp_record(db: Session, user_id: int, otp_code: str):
    otp_record = db.query(OTP).filter(
        OTP.user_id == user_id,
        OTP.expires_at > datetime.utcnow()
    ).first()
    
    if not otp_record:
        return False, "OTP expired or not found"
    
    if otp_record.attempts >= 3:
        return False, "Too many attempts. Request a new OTP."
    
    if verify_password(otp_code, otp_record.otp_hash):
        db.delete(otp_record)
        db.commit()
        return True, "Success"
    else:
        otp_record.attempts += 1
        db.commit()
        return False, "Invalid OTP"
