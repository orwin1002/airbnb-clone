from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


# --- Auth ---
class LoginRequest(BaseModel):
    email: str
    password: str


class DemoLoginRequest(BaseModel):
    email: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str = Field(min_length=6)
    is_host: bool = False


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_host: bool
    identity_verified: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Listings ---
class PhotoOut(BaseModel):
    id: int
    url: str
    sort_order: int

    model_config = {"from_attributes": True}


class AmenityOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class HostOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class ListingCardOut(BaseModel):
    id: int
    title: str
    location_city: str
    location_area: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    price_per_night: float
    property_type: str
    vibe: str
    max_guests: int
    photo_url: Optional[str] = None
    avg_rating: Optional[float] = None
    review_count: int = 0
    is_guest_favourite: bool = False


class ListingListResponse(BaseModel):
    items: list[ListingCardOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class ReviewOut(BaseModel):
    id: int
    rating: int
    comment: str
    guest_name: str
    created_at: datetime


class ListingDetailOut(BaseModel):
    id: int
    title: str
    description: str
    location_city: str
    location_area: str
    lat: Optional[float]
    lng: Optional[float]
    price_per_night: float
    property_type: str
    vibe: str
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: int
    photos: list[PhotoOut]
    amenities: list[AmenityOut]
    host: HostOut
    avg_rating: Optional[float] = None
    review_count: int = 0
    created_at: datetime


class ListingCreate(BaseModel):
    title: str
    description: str
    location_city: str
    location_area: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    price_per_night: float
    property_type: str = "Entire home"
    vibe: str = "Trending"
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: int
    photo_urls: list[str] = []
    amenity_names: list[str] = []


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location_city: Optional[str] = None
    location_area: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    price_per_night: Optional[float] = None
    property_type: Optional[str] = None
    vibe: Optional[str] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    beds: Optional[int] = None
    bathrooms: Optional[int] = None
    photo_urls: Optional[list[str]] = None
    amenity_names: Optional[list[str]] = None


class AvailabilityRange(BaseModel):
    check_in: date
    check_out: date


# --- Bookings ---
class BookingCreate(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests_count: int = Field(ge=1)


class BookingOut(BaseModel):
    id: int
    listing_id: int
    listing_title: str
    listing_photo: Optional[str] = None
    location_city: str
    host_id: int
    check_in: date
    check_out: date
    guests_count: int
    total_price: float
    refund_amount: Optional[float] = None
    refund_percent: Optional[int] = None
    status: str
    created_at: datetime
    has_review: bool = False
    can_review: bool = False


# --- Reviews ---
class ReviewCreate(BaseModel):
    listing_id: int
    booking_id: int
    rating: int = Field(ge=1, le=5)
    comment: str


# --- Favorites ---
class FavoriteOut(BaseModel):
    listing: ListingCardOut


# --- Messages ---
class ConversationCreate(BaseModel):
    listing_id: int


class ConversationOut(BaseModel):
    id: int
    listing_id: int
    listing_title: str
    listing_photo: Optional[str] = None
    other_user_name: str
    other_user_id: int
    last_message: Optional[str] = None
    last_message_at: datetime
    unread_count: int = 0


class MessageCreate(BaseModel):
    body: str


class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_name: str
    body: str
    created_at: datetime
    is_mine: bool = False
