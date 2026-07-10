from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Favorite, Listing, User
from app.schemas import FavoriteOut, ListingCardOut
from app.routers.listings import _listing_card

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.post("/{listing_id}", status_code=201)
def add_favorite(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    existing = (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id, Favorite.listing_id == listing_id)
        .first()
    )
    if existing:
        return {"message": "Already favorited"}

    db.add(Favorite(user_id=current_user.id, listing_id=listing_id))
    db.commit()
    return {"message": "Added to favorites"}


@router.delete("/{listing_id}", status_code=204)
def remove_favorite(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fav = (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id, Favorite.listing_id == listing_id)
        .first()
    )
    if fav:
        db.delete(fav)
        db.commit()


@router.get("/me", response_model=list[ListingCardOut])
def my_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favorites = (
        db.query(Listing)
        .join(Favorite, Favorite.listing_id == Listing.id)
        .filter(Favorite.user_id == current_user.id)
        .all()
    )
    return [_listing_card(l, db) for l in favorites]
