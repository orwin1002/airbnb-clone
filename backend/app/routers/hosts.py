from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Booking, Listing, ListingPhoto, Review, User
from app.review_utils import host_review_out
from app.schemas import BookingOut, HostReviewOut, ListingCardOut
from app.routers.bookings import _booking_out
from app.routers.listings import _listing_card

router = APIRouter(prefix="/hosts", tags=["hosts"])


@router.get("/me/listings", response_model=list[ListingCardOut])
def my_listings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listings = (
        db.query(Listing)
        .filter(Listing.host_id == current_user.id)
        .order_by(Listing.created_at.desc())
        .all()
    )
    return [_listing_card(l, db) for l in listings]


@router.get("/me/bookings", response_model=list[BookingOut])
def host_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookings = (
        db.query(Booking)
        .join(Listing, Listing.id == Booking.listing_id)
        .options(joinedload(Booking.listing), joinedload(Booking.guest))
        .filter(Listing.host_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    results = []
    for booking in bookings:
        photo = (
            db.query(ListingPhoto)
            .filter(ListingPhoto.listing_id == booking.listing_id)
            .order_by(ListingPhoto.sort_order)
            .first()
        )
        results.append(
            _booking_out(booking, booking.listing, photo.url if photo else None, db)
        )
    return results


@router.get("/me/reviews", response_model=list[HostReviewOut])
def host_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Review, User.name, Listing.id, Listing.title)
        .join(Listing, Review.listing_id == Listing.id)
        .join(User, Review.guest_id == User.id)
        .filter(Listing.host_id == current_user.id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [
        host_review_out(review, guest_name, listing_id, listing_title, db, current_user.id)
        for review, guest_name, listing_id, listing_title in rows
    ]
