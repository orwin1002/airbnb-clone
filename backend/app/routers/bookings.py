from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Booking, Listing, ListingPhoto, Review, User
from app.schemas import BookingCreate, BookingOut

router = APIRouter(prefix="/bookings", tags=["bookings"])

CLEANING_FEE = 50.0
SERVICE_FEE_RATE = 0.12
LATE_CANCEL_HOURS = 24


def _has_overlap(
    db: Session, listing_id: int, check_in: date, check_out: date, exclude_id: int | None = None
) -> bool:
    query = db.query(Booking).filter(
        Booking.listing_id == listing_id,
        Booking.status == "confirmed",
        Booking.check_in < check_out,
        Booking.check_out > check_in,
    )
    if exclude_id:
        query = query.filter(Booking.id != exclude_id)
    return query.first() is not None


def _compute_total(price_per_night: float, check_in: date, check_out: date) -> float:
    nights = (check_out - check_in).days
    if nights <= 0:
        raise HTTPException(status_code=400, detail="Invalid date range")
    subtotal = price_per_night * nights
    service_fee = subtotal * SERVICE_FEE_RATE
    return round(subtotal + CLEANING_FEE + service_fee, 2)


def _refund_info(booking: Booking, now: datetime | None = None) -> tuple[float, int]:
    """Return (refund_amount, refund_percent). 50% if cancelling within 24h of check-in."""
    now = now or datetime.utcnow()
    check_in_dt = datetime.combine(booking.check_in, datetime.min.time())
    hours_until = (check_in_dt - now).total_seconds() / 3600
    percent = 50 if hours_until < LATE_CANCEL_HOURS else 100
    amount = round(booking.total_price * (percent / 100), 2)
    return amount, percent


def _booking_out(
    booking: Booking,
    listing: Listing,
    photo_url: str | None,
    db: Session,
    today: date | None = None,
) -> BookingOut:
    today = today or date.today()
    has_review = (
        db.query(Review).filter(Review.booking_id == booking.id).first() is not None
    )
    can_review = (
        booking.status == "confirmed"
        and booking.check_out < today
        and not has_review
    )
    refund_amount = booking.refund_amount
    refund_percent = None
    if booking.status == "cancelled" and refund_amount is not None:
        refund_percent = round((refund_amount / booking.total_price) * 100) if booking.total_price else 100
    elif booking.status == "confirmed":
        _, refund_percent = _refund_info(booking)

    return BookingOut(
        id=booking.id,
        listing_id=listing.id,
        listing_title=listing.title,
        listing_photo=photo_url,
        location_city=listing.location_city,
        host_id=listing.host_id,
        check_in=booking.check_in,
        check_out=booking.check_out,
        guests_count=booking.guests_count,
        total_price=booking.total_price,
        refund_amount=refund_amount,
        refund_percent=refund_percent,
        status=booking.status,
        created_at=booking.created_at,
        has_review=has_review,
        can_review=can_review,
    )


@router.post("", response_model=BookingOut, status_code=201)
def create_booking(
    payload: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == payload.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if payload.check_out <= payload.check_in:
        raise HTTPException(status_code=400, detail="check_out must be after check_in")
    if payload.guests_count > listing.max_guests:
        raise HTTPException(status_code=400, detail="Too many guests for this listing")
    if _has_overlap(db, listing.id, payload.check_in, payload.check_out):
        raise HTTPException(status_code=409, detail="Dates are not available")

    total = _compute_total(listing.price_per_night, payload.check_in, payload.check_out)
    booking = Booking(
        listing_id=listing.id,
        guest_id=current_user.id,
        check_in=payload.check_in,
        check_out=payload.check_out,
        guests_count=payload.guests_count,
        total_price=total,
        status="confirmed",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    photo = (
        db.query(ListingPhoto)
        .filter(ListingPhoto.listing_id == listing.id)
        .order_by(ListingPhoto.sort_order)
        .first()
    )
    return _booking_out(booking, listing, photo.url if photo else None, db)


@router.get("/me", response_model=list[BookingOut])
def my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookings = (
        db.query(Booking)
        .options(joinedload(Booking.listing))
        .filter(Booking.guest_id == current_user.id)
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


@router.get("/{booking_id}/refund-preview")
def refund_preview(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.guest_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your booking")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking already cancelled")

    amount, percent = _refund_info(booking)
    return {
        "refund_amount": amount,
        "refund_percent": percent,
        "total_price": booking.total_price,
        "late_cancel": percent == 50,
    }


@router.patch("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.listing))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.guest_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your booking")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking already cancelled")

    refund_amount, _ = _refund_info(booking)
    booking.refund_amount = refund_amount
    booking.status = "cancelled"
    db.commit()
    db.refresh(booking)

    photo = (
        db.query(ListingPhoto)
        .filter(ListingPhoto.listing_id == booking.listing_id)
        .order_by(ListingPhoto.sort_order)
        .first()
    )
    return _booking_out(booking, booking.listing, photo.url if photo else None, db)
