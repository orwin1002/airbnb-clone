from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User

# Mock auth: client sends X-User-Id header after login
def get_current_user(
    x_user_id: int | None = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> User:
    if x_user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_optional_user(
    x_user_id: int | None = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> User | None:
    if x_user_id is None:
        return None
    return db.query(User).filter(User.id == x_user_id).first()
