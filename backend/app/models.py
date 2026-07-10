from datetime import datetime, date
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(20), default="guest")  # "guest" | "host"
    is_host = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    listings = relationship("Listing", back_populates="host")
    bookings = relationship("Booking", back_populates="guest")
    reviews = relationship("Review", back_populates="guest")
    favorites = relationship("Favorite", back_populates="user")
    sent_messages = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")
    guest_conversations = relationship(
        "Conversation", back_populates="guest", foreign_keys="Conversation.guest_id"
    )
    host_conversations = relationship(
        "Conversation", back_populates="host", foreign_keys="Conversation.host_id"
    )


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    location_city = Column(String(100), nullable=False, index=True)
    location_area = Column(String(100), nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    price_per_night = Column(Float, nullable=False)
    property_type = Column(String(50), nullable=False, index=True)
    vibe = Column(String(50), nullable=False, default="Trending", index=True)
    max_guests = Column(Integer, nullable=False)
    bedrooms = Column(Integer, nullable=False)
    beds = Column(Integer, nullable=False)
    bathrooms = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    host = relationship("User", back_populates="listings")
    photos = relationship(
        "ListingPhoto", back_populates="listing", cascade="all, delete-orphan"
    )
    amenities = relationship(
        "ListingAmenity", back_populates="listing", cascade="all, delete-orphan"
    )
    bookings = relationship("Booking", back_populates="listing")
    reviews = relationship("Review", back_populates="listing")
    favorites = relationship("Favorite", back_populates="listing")
    conversations = relationship("Conversation", back_populates="listing")


class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = (UniqueConstraint("guest_id", "host_id", "listing_id", name="uq_conversation"),)

    id = Column(Integer, primary_key=True, index=True)
    guest_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    guest = relationship("User", back_populates="guest_conversations", foreign_keys=[guest_id])
    host = relationship("User", back_populates="host_conversations", foreign_keys=[host_id])
    listing = relationship("Listing", back_populates="conversations")
    messages = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan"
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages")


class ListingPhoto(Base):
    __tablename__ = "listing_photos"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    url = Column(String(500), nullable=False)
    sort_order = Column(Integer, default=0)

    listing = relationship("Listing", back_populates="photos")


class Amenity(Base):
    __tablename__ = "amenities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)


class ListingAmenity(Base):
    __tablename__ = "listing_amenities"

    listing_id = Column(Integer, ForeignKey("listings.id"), primary_key=True)
    amenity_id = Column(Integer, ForeignKey("amenities.id"), primary_key=True)

    listing = relationship("Listing", back_populates="amenities")
    amenity = relationship("Amenity")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    guest_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    guests_count = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)
    refund_amount = Column(Float, nullable=True)
    status = Column(String(20), default="confirmed")  # confirmed | cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    listing = relationship("Listing", back_populates="bookings")
    guest = relationship("User", back_populates="bookings")
    review = relationship("Review", back_populates="booking", uselist=False)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    guest_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    listing = relationship("Listing", back_populates="reviews")
    guest = relationship("User", back_populates="reviews")
    booking = relationship("Booking", back_populates="review")


class Favorite(Base):
    __tablename__ = "favorites"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), primary_key=True)

    user = relationship("User", back_populates="favorites")
    listing = relationship("Listing", back_populates="favorites")
