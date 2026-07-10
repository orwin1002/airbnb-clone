from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Booking, Review, User
from app.schemas import ReviewCreate, ReviewOut

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewOut, status_code=201)
def create_review(
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.guest_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your booking")
    if booking.listing_id != payload.listing_id:
        raise HTTPException(status_code=400, detail="Listing mismatch")
    if booking.status != "confirmed":
        raise HTTPException(status_code=400, detail="Cannot review cancelled booking")
    if booking.check_out >= date.today():
        raise HTTPException(
            status_code=400,
            detail="Reviews are only allowed after checkout",
        )

    existing = db.query(Review).filter(Review.booking_id == payload.booking_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Review already exists")

    review = Review(
        listing_id=payload.listing_id,
        guest_id=current_user.id,
        booking_id=payload.booking_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return ReviewOut(
        id=review.id,
        rating=review.rating,
        comment=review.comment,
        guest_name=current_user.name,
        created_at=review.created_at,
    )
