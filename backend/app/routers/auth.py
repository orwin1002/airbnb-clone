from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import DemoLoginRequest, LoginRequest, RegisterRequest, UserOut
from app.security import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

DEMO_EMAILS = {
    "alex@example.com",
    "emma@example.com",
    "liam@example.com",
    "noah@example.com",
    "olivia@example.com",
    "priya@example.com",
    "sarah@example.com",
    "marcus@example.com",
    "james@example.com",
    "david@example.com",
}


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = User(
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
        role="host" if payload.is_host else "guest",
        is_host=payload.is_host,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=UserOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user


@router.post("/demo-login", response_model=UserOut)
def demo_login(payload: DemoLoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found")
    if email not in DEMO_EMAILS and user.password_hash:
        raise HTTPException(status_code=403, detail="Use email and password to sign in")
    return user


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/verify-identity", response_model=UserOut)
def verify_identity(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Mock identity verification — marks the user as verified after a simulated review."""
    if current_user.identity_verified:
        return current_user
    current_user.identity_verified = True
    db.commit()
    db.refresh(current_user)
    return current_user
