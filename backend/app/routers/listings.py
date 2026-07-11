from datetime import date
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
from app.models import Amenity, Booking, Conversation, Favorite, Listing, ListingAmenity, ListingPhoto, Message, Review, User
from app.review_utils import review_out
from app.schemas import (
    AvailabilityRange,
    ListingCardOut,
    ListingCreate,
    ListingDetailOut,
    ListingListResponse,
    ListingUpdate,
    PhotoOut,
    AmenityOut,
    HostOut,
    ReviewOut,
)

router = APIRouter(prefix="/listings", tags=["listings"])
PAGE_SIZE = 20


def _listing_card(listing: Listing, db: Session) -> ListingCardOut:
    photo = (
        db.query(ListingPhoto)
        .filter(ListingPhoto.listing_id == listing.id)
        .order_by(ListingPhoto.sort_order)
        .first()
    )
    stats = (
        db.query(func.avg(Review.rating), func.count(Review.id))
        .filter(Review.listing_id == listing.id)
        .first()
    )
    avg_rating = round(float(stats[0]), 1) if stats[0] else None
    review_count = stats[1] or 0
    is_guest_favourite = avg_rating is not None and avg_rating >= 4.7 and review_count >= 3
    return ListingCardOut(
        id=listing.id,
        title=listing.title,
        location_city=listing.location_city,
        location_area=listing.location_area,
        lat=listing.lat,
        lng=listing.lng,
        price_per_night=listing.price_per_night,
        property_type=listing.property_type,
        vibe=listing.vibe,
        max_guests=listing.max_guests,
        photo_url=photo.url if photo else None,
        avg_rating=avg_rating,
        review_count=review_count,
        is_guest_favourite=is_guest_favourite,
    )


def _get_or_create_amenities(db: Session, names: list[str]) -> list[Amenity]:
    amenities: list[Amenity] = []
    seen: set[str] = set()
    for raw in names:
        name = raw.strip()
        if not name or name.lower() in seen:
            continue
        seen.add(name.lower())
        amenity = db.query(Amenity).filter(func.lower(Amenity.name) == name.lower()).first()
        if not amenity:
            amenity = Amenity(name=name)
            db.add(amenity)
            db.flush()
        amenities.append(amenity)
    return amenities


def _filter_by_amenities(query, db: Session, amenities_param: str):
    names = [n.strip().lower() for n in amenities_param.split(",") if n.strip()]
    if not names:
        return query
    matching = (
        db.query(ListingAmenity.listing_id)
        .join(Amenity, Amenity.id == ListingAmenity.amenity_id)
        .filter(func.lower(Amenity.name).in_(names))
        .group_by(ListingAmenity.listing_id)
        .having(func.count(func.distinct(func.lower(Amenity.name))) == len(names))
    )
    return query.filter(Listing.id.in_(matching))


@router.get("", response_model=ListingListResponse)
def list_listings(
    q: str | None = None,
    city: str | None = None,
    check_in: date | None = None,
    check_out: date | None = None,
    guests: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    property_type: str | None = None,
    vibe: str | None = None,
    amenities: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(PAGE_SIZE, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Listing)
    search = (q or city or "").strip()
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Listing.title.ilike(pattern),
                Listing.location_city.ilike(pattern),
                Listing.location_area.ilike(pattern),
                Listing.description.ilike(pattern),
                Listing.vibe.ilike(pattern),
                Listing.property_type.ilike(pattern),
            )
        )
    if guests:
        query = query.filter(Listing.max_guests >= guests)
    if min_price is not None:
        query = query.filter(Listing.price_per_night >= min_price)
    if max_price is not None:
        query = query.filter(Listing.price_per_night <= max_price)
    if property_type:
        query = query.filter(Listing.property_type == property_type)
    if vibe:
        query = query.filter(Listing.vibe == vibe)
    if amenities:
        query = _filter_by_amenities(query, db, amenities)
    if check_in and check_out:
        if check_out <= check_in:
            raise HTTPException(status_code=400, detail="check_out must be after check_in")
        overlapping = (
            db.query(Booking.listing_id)
            .filter(
                Booking.status == "confirmed",
                Booking.check_in < check_out,
                Booking.check_out > check_in,
            )
            .distinct()
        )
        query = query.filter(~Listing.id.in_(overlapping))
    total = query.count()
    listings = (
        query.order_by(Listing.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return ListingListResponse(
        items=[_listing_card(l, db) for l in listings],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, ceil(total / page_size)),
    )


@router.get("/{listing_id}", response_model=ListingDetailOut)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = (
        db.query(Listing)
        .options(joinedload(Listing.host), joinedload(Listing.photos))
        .filter(Listing.id == listing_id)
        .first()
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    amenity_rows = (
        db.query(Amenity)
        .join(ListingAmenity, ListingAmenity.amenity_id == Amenity.id)
        .filter(ListingAmenity.listing_id == listing_id)
        .all()
    )
    stats = (
        db.query(func.avg(Review.rating), func.count(Review.id))
        .filter(Review.listing_id == listing_id)
        .first()
    )
    return ListingDetailOut(
        id=listing.id,
        title=listing.title,
        description=listing.description,
        location_city=listing.location_city,
        location_area=listing.location_area,
        lat=listing.lat,
        lng=listing.lng,
        price_per_night=listing.price_per_night,
        property_type=listing.property_type,
        vibe=listing.vibe,
        max_guests=listing.max_guests,
        bedrooms=listing.bedrooms,
        beds=listing.beds,
        bathrooms=listing.bathrooms,
        photos=[PhotoOut.model_validate(p) for p in sorted(listing.photos, key=lambda x: x.sort_order)],
        amenities=[AmenityOut.model_validate(a) for a in amenity_rows],
        host=HostOut.model_validate(listing.host),
        avg_rating=round(float(stats[0]), 1) if stats[0] else None,
        review_count=stats[1] or 0,
        created_at=listing.created_at,
    )


@router.post("", response_model=ListingDetailOut, status_code=201)
def create_listing(payload: ListingCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_host:
        raise HTTPException(status_code=403, detail="Only hosts can create listings")
    listing = Listing(
        host_id=current_user.id,
        title=payload.title,
        description=payload.description,
        location_city=payload.location_city,
        location_area=payload.location_area,
        lat=payload.lat,
        lng=payload.lng,
        price_per_night=payload.price_per_night,
        property_type=payload.property_type,
        vibe=payload.vibe,
        max_guests=payload.max_guests,
        bedrooms=payload.bedrooms,
        beds=payload.beds,
        bathrooms=payload.bathrooms,
    )
    db.add(listing)
    db.flush()
    for i, url in enumerate(payload.photo_urls):
        db.add(ListingPhoto(listing_id=listing.id, url=url, sort_order=i))
    for amenity in _get_or_create_amenities(db, payload.amenity_names):
        db.add(ListingAmenity(listing_id=listing.id, amenity_id=amenity.id))
    db.commit()
    return get_listing(listing.id, db)


@router.put("/{listing_id}", response_model=ListingDetailOut)
def update_listing(
    listing_id: int,
    payload: ListingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "photo_urls" and value is not None:
            db.query(ListingPhoto).filter(ListingPhoto.listing_id == listing_id).delete()
            for i, url in enumerate(value):
                db.add(ListingPhoto(listing_id=listing_id, url=url, sort_order=i))
        elif field == "amenity_names" and value is not None:
            db.query(ListingAmenity).filter(ListingAmenity.listing_id == listing_id).delete()
            for amenity in _get_or_create_amenities(db, value):
                db.add(ListingAmenity(listing_id=listing_id, amenity_id=amenity.id))
        elif field not in ("photo_urls", "amenity_names"):
            setattr(listing, field, value)
    db.commit()
    return get_listing(listing_id, db)


@router.delete("/{listing_id}", status_code=204)
def delete_listing(listing_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    conv_ids = [
        c.id for c in db.query(Conversation).filter(Conversation.listing_id == listing_id).all()
    ]
    if conv_ids:
        db.query(Message).filter(Message.conversation_id.in_(conv_ids)).delete(synchronize_session=False)
        db.query(Conversation).filter(Conversation.listing_id == listing_id).delete(synchronize_session=False)

    db.query(Favorite).filter(Favorite.listing_id == listing_id).delete(synchronize_session=False)
    db.query(Review).filter(Review.listing_id == listing_id).delete(synchronize_session=False)
    db.query(Booking).filter(Booking.listing_id == listing_id).delete(synchronize_session=False)
    db.delete(listing)
    db.commit()


@router.get("/{listing_id}/availability", response_model=list[AvailabilityRange])
def get_availability(listing_id: int, db: Session = Depends(get_db)):
    if not db.query(Listing).filter(Listing.id == listing_id).first():
        raise HTTPException(status_code=404, detail="Listing not found")
    bookings = db.query(Booking).filter(Booking.listing_id == listing_id, Booking.status == "confirmed").all()
    return [AvailabilityRange(check_in=b.check_in, check_out=b.check_out) for b in bookings]


@router.get("/{listing_id}/reviews", response_model=list[ReviewOut])
def get_reviews(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    rows = (
        db.query(Review, User.name)
        .join(User, User.id == Review.guest_id)
        .filter(Review.listing_id == listing_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    user_id = current_user.id if current_user else None
    return [review_out(r, name, db, user_id) for r, name in rows]
