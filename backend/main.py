import hashlib
import os
import smtplib
from uuid import uuid4
from email.message import EmailMessage
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine
import models
import schemas

app = FastAPI()

allowed_origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

SMTP_SERVER = os.getenv("SMTP_SERVER", "127.0.0.1")
SMTP_PORT = int(os.getenv("SMTP_PORT", "1025"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "0") == "1"
EMAIL_FROM = os.getenv("EMAIL_FROM", "no-reply@leaveflow.local")

verification_tokens = {}


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash


def send_email(message: EmailMessage) -> bool:
    try:
        if SMTP_USE_SSL:
            with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
                if SMTP_USERNAME and SMTP_PASSWORD:
                    server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(message)
        else:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                if SMTP_USERNAME and SMTP_PASSWORD:
                    server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(message)
        return True
    except Exception as exc:
        print(f"[WARNING] Failed to send email: {exc}")
        return False


def send_verification_email(to_email: str, token: str) -> bool:
    message = EmailMessage()
    message["Subject"] = "LeaveFlow verification code"
    message["From"] = EMAIL_FROM
    message["To"] = to_email
    message.set_content(
        f"Hello,\n\nYour LeaveFlow login verification code is: {token}\n\n"
        "If you did not request this login, please ignore this email.\n"
    )
    return send_email(message)


def send_leave_status_email(to_email: str, leave, status: str) -> bool:
    if not to_email:
        return False

    status_label = "approved" if status == "approved" else "rejected"
    message = EmailMessage()
    message["Subject"] = f"LeaveFlow leave request {status_label}"
    message["From"] = EMAIL_FROM
    message["To"] = to_email
    message.set_content(
        "Hello,\n\n"
        f"Your leave request for '{leave.reason}' has been {status_label}.\n"
        f"Dates: {leave.start_date or 'N/A'} to {leave.end_date or 'N/A'}\n"
        "Thank you for using LeaveFlow.\n"
    )
    return send_email(message)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "Backend works"}


@app.post("/login", response_model=schemas.LoginResponse)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user_record = db.query(models.User).filter(models.User.email == request.email).first()
    if not user_record:
        raise HTTPException(status_code=404, detail="No account found. Please sign up first.")

    if not verify_password(request.password, user_record.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password.")

    token = str(uuid4()).split("-")[0].upper()
    verification_tokens[request.email] = token

    verification_sent = send_verification_email(request.email, token)
    show_token = os.getenv("DEV_SHOW_TOKEN", "1") == "1"

    response = {
        "user": {
            "id": user_record.id,
            "name": f"{user_record.first_name} {user_record.last_name}".strip(),
            "email": user_record.email,
            "role": user_record.role,
        },
        "verification_sent": verification_sent,
        "message": "Verification code sent to your email." if verification_sent else "Verification email could not be sent. Please try again.",
    }

    if show_token or not verification_sent:
        response["verification_token"] = token

    return response


@app.post("/verify-login", response_model=schemas.VerifyLoginResponse)
def verify_login(request: schemas.VerifyLoginRequest, db: Session = Depends(get_db)):
    expected_token = verification_tokens.get(request.email)
    if not expected_token or expected_token != request.token:
        raise HTTPException(status_code=401, detail="Invalid or expired verification code.")

    user_record = db.query(models.User).filter(models.User.email == request.email).first()
    if not user_record:
        raise HTTPException(status_code=404, detail="Account not found.")

    verification_tokens.pop(request.email, None)
    return {
        "user": {
            "id": user_record.id,
            "name": f"{user_record.first_name} {user_record.last_name}".strip(),
            "email": user_record.email,
            "role": user_record.role,
        },
        "message": "Login verified successfully.",
    }


@app.post("/signup", response_model=schemas.SignupResponse)
def signup(request: schemas.SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user_record = models.User(
        first_name=request.first_name.strip(),
        last_name=request.last_name.strip(),
        email=request.email,
        password_hash=hash_password(request.password),
        role="admin" if "admin" in request.email.lower() else "employee",
    )
    db.add(user_record)
    db.commit()
    db.refresh(user_record)

    token = str(uuid4()).split("-")[0].upper()
    verification_tokens[request.email] = token
    verification_sent = send_verification_email(request.email, token)

    return {
        "message": "Account created. Verification code sent to your email." if verification_sent else "Account created, but email could not be sent.",
        "verification_token": token if os.getenv("DEV_SHOW_TOKEN", "1") == "1" or not verification_sent else None,
    }


@app.get("/leaves")
def list_leaves(email: str = None, db: Session = Depends(get_db)):
    query = db.query(models.LeaveRequest)
    if email:
        query = query.filter(models.LeaveRequest.email == email)
    leaves = query.order_by(models.LeaveRequest.created_at.desc()).all()
    return leaves


@app.post("/leave", response_model=schemas.LeaveResponse)
def create_leave(request: schemas.LeaveCreate, db: Session = Depends(get_db)):
    new_leave = models.LeaveRequest(
        name=request.name,
        email=request.email,
        user_id=request.user_id,
        reason=request.reason,
        start_date=request.start_date,
        end_date=request.end_date,
        status="pending",
    )

    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    return new_leave


@app.put("/leave/{leave_id}/status")
def update_leave_status(leave_id: int, request: schemas.LeaveStatusUpdate, db: Session = Depends(get_db)):
    leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    previous_status = leave.status
    leave.status = request.status
    db.commit()
    db.refresh(leave)

    if request.status in {"approved", "rejected"} and previous_status != request.status and leave.email:
        send_leave_status_email(leave.email, leave, request.status)

    return leave
