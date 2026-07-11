from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Booking, Listing, ListingPhoto, User
from app.schemas import BookingOut, ListingCardOut
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
