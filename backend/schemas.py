from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

class LoginResponse(BaseModel):
    user: UserResponse
    verification_sent: bool
    message: str

class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str


class SignupResponse(BaseModel):
    message: str
    verification_token: Optional[str] = None


class VerifyLoginRequest(BaseModel):
    email: EmailStr
    token: str


class VerifyLoginResponse(BaseModel):
    user: UserResponse
    message: str


class LeaveCreate(BaseModel):
    name: str
    reason: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    user_id: Optional[int] = None
    email: Optional[EmailStr] = None

class LeaveResponse(BaseModel):
    id: int
    name: str
    email: Optional[EmailStr] = None
    user_id: Optional[int] = None
    reason: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        orm_mode = True

class LeaveStatusUpdate(BaseModel):
    status: str