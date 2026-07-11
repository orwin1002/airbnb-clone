from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "sqlite:///./airbnb.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def migrate_schema() -> None:
    inspector = inspect(engine)
    if "bookings" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("bookings")}
        if "refund_amount" not in cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN refund_amount FLOAT"))
    if "users" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("users")}
        if "password_hash" not in cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
        if "identity_verified" not in cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN identity_verified BOOLEAN DEFAULT 0"))
                conn.execute(text("UPDATE users SET identity_verified = 0 WHERE identity_verified IS NULL"))
    if "reviews" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("reviews")}
        with engine.begin() as conn:
            if "host_reply" not in cols:
                conn.execute(text("ALTER TABLE reviews ADD COLUMN host_reply TEXT"))
            if "host_reply_at" not in cols:
                conn.execute(text("ALTER TABLE reviews ADD COLUMN host_reply_at DATETIME"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
