from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
from app.models import Booking, Listing, Review, ReviewLike, User
from app.review_utils import host_review_out, review_like_count, review_out
from app.schemas import GuestReviewOut, HostReviewOut, ReviewCreate, ReviewOut, ReviewReplyCreate, ReviewWatchOut

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

    return review_out(review, current_user.name, db, current_user.id)


@router.post("/{review_id}/like", response_model=ReviewOut)
def toggle_review_like(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = (
        db.query(Review)
        .options(joinedload(Review.guest))
        .filter(Review.id == review_id)
        .first()
    )
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    existing = (
        db.query(ReviewLike)
        .filter(ReviewLike.review_id == review_id, ReviewLike.user_id == current_user.id)
        .first()
    )
    if existing:
        db.delete(existing)
    else:
        db.add(ReviewLike(review_id=review_id, user_id=current_user.id))
    db.commit()

    return review_out(review, review.guest.name, db, current_user.id)


@router.post("/{review_id}/reply", response_model=HostReviewOut)
def reply_to_review(
    review_id: int,
    payload: ReviewReplyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = (
        db.query(Review)
        .options(joinedload(Review.guest), joinedload(Review.listing))
        .filter(Review.id == review_id)
        .first()
    )
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.listing.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the listing host can reply")

    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=400, detail="Reply cannot be empty")

    review.host_reply = body
    review.host_reply_at = datetime.utcnow()
    db.commit()
    db.refresh(review)

    return host_review_out(
        review,
        review.guest.name,
        review.listing_id,
        review.listing.title,
        db,
        current_user.id,
    )


@router.get("/me/tracked", response_model=list[ReviewWatchOut])
def tracked_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reviews the user hosts or wrote — used for notification sync."""
    rows = (
        db.query(Review, User.name, Listing.id, Listing.title, Listing.host_id)
        .join(Listing, Review.listing_id == Listing.id)
        .join(User, Review.guest_id == User.id)
        .filter(
            or_(
                Listing.host_id == current_user.id,
                Review.guest_id == current_user.id,
            )
        )
        .order_by(Review.created_at.desc())
        .all()
    )
    return [
        ReviewWatchOut(
            id=review.id,
            listing_id=listing_id,
            listing_title=listing_title,
            guest_id=review.guest_id,
            guest_name=guest_name,
            host_id=host_id,
            rating=review.rating,
            comment=review.comment,
            like_count=review_like_count(db, review.id),
            host_reply=review.host_reply,
            host_reply_at=review.host_reply_at,
            created_at=review.created_at,
        )
        for review, guest_name, listing_id, listing_title, host_id in rows
    ]


@router.get("/me/written", response_model=list[GuestReviewOut])
def my_written_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reviews the current user wrote as a guest."""
    rows = (
        db.query(Review, User.name, Listing.id, Listing.title)
        .join(Listing, Review.listing_id == Listing.id)
        .join(User, Review.guest_id == User.id)
        .filter(Review.guest_id == current_user.id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [
        GuestReviewOut(
            **review_out(review, guest_name, db, current_user.id).model_dump(),
            listing_id=listing_id,
            listing_title=listing_title,
        )
        for review, guest_name, listing_id, listing_title in rows
    ]


