from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Review, ReviewLike, User
from app.schemas import HostReviewOut, ReviewOut


def review_like_count(db: Session, review_id: int) -> int:
    return (
        db.query(func.count(ReviewLike.user_id))
        .filter(ReviewLike.review_id == review_id)
        .scalar()
        or 0
    )


def user_liked_review(db: Session, review_id: int, user_id: int | None) -> bool:
    if user_id is None:
        return False
    return (
        db.query(ReviewLike)
        .filter(ReviewLike.review_id == review_id, ReviewLike.user_id == user_id)
        .first()
        is not None
    )


def review_out(
    review: Review,
    guest_name: str,
    db: Session,
    current_user_id: int | None = None,
) -> ReviewOut:
    return ReviewOut(
        id=review.id,
        guest_id=review.guest_id,
        rating=review.rating,
        comment=review.comment,
        guest_name=guest_name,
        created_at=review.created_at,
        like_count=review_like_count(db, review.id),
        liked_by_me=user_liked_review(db, review.id, current_user_id),
        host_reply=review.host_reply,
        host_reply_at=review.host_reply_at,
    )


def host_review_out(
    review: Review,
    guest_name: str,
    listing_id: int,
    listing_title: str,
    db: Session,
    current_user_id: int | None = None,
) -> HostReviewOut:
    base = review_out(review, guest_name, db, current_user_id)
    return HostReviewOut(
        **base.model_dump(),
        listing_id=listing_id,
        listing_title=listing_title,
    )
