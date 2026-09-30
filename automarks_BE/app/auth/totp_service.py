import pyotp
import qrcode
import io
import base64

def generate_totp_secret():
    return pyotp.random_base32()

def get_provisioning_uri(email: str, secret: str):
    return pyotp.totp.TOTP(secret).provisioning_uri(
        name=email, 
        issuer_name="AutoMarks"
    )

def generate_qr_code_base64(provisioning_uri: str):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(provisioning_uri)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return img_str

def verify_totp_code(secret: str, code: str):
    totp = pyotp.TOTP(secret)
    return totp.verify(code)
