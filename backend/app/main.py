import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.database import Base, SessionLocal, engine, migrate_schema
from app.seed import seed_database
from app.routers import auth, bookings, favorites, hosts, listings, messages, reviews

Base.metadata.create_all(bind=engine)
migrate_schema()

app = FastAPI(title="Airbnb Clone API", version="1.0.0")

origins = [o.strip() for o in os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(listings.router)
app.include_router(bookings.router)
app.include_router(hosts.router)
app.include_router(reviews.router)
app.include_router(favorites.router)
app.include_router(messages.router)


@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/")
def root():
    return RedirectResponse(url="/docs")


@app.get("/health")
def health():
    return {"status": "ok"}
