from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Conversation, Listing, ListingPhoto, Message, User
from app.schemas import ConversationCreate, ConversationOut, MessageCreate, MessageOut

router = APIRouter(prefix="/messages", tags=["messages"])


def _photo_url(db: Session, listing_id: int) -> str | None:
    photo = (
        db.query(ListingPhoto)
        .filter(ListingPhoto.listing_id == listing_id)
        .order_by(ListingPhoto.sort_order)
        .first()
    )
    return photo.url if photo else None


def _conversation_out(conv: Conversation, current_user: User, db: Session) -> ConversationOut:
    last = max(conv.messages, key=lambda m: m.created_at) if conv.messages else None
    unread = (
        db.query(func.count(Message.id))
        .filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user.id,
            Message.read_at.is_(None),
        )
        .scalar()
        or 0
    )
    other = conv.host if current_user.id == conv.guest_id else conv.guest
    return ConversationOut(
        id=conv.id,
        listing_id=conv.listing_id,
        listing_title=conv.listing.title,
        listing_photo=_photo_url(db, conv.listing_id),
        other_user_name=other.name,
        other_user_id=other.id,
        last_message=last.body if last else None,
        last_message_at=last.created_at if last else conv.updated_at,
        unread_count=unread,
    )


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conversations = (
        db.query(Conversation)
        .options(
            joinedload(Conversation.listing),
            joinedload(Conversation.guest),
            joinedload(Conversation.host),
            joinedload(Conversation.messages),
        )
        .filter(or_(Conversation.guest_id == current_user.id, Conversation.host_id == current_user.id))
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return [_conversation_out(c, current_user, db) for c in conversations]


@router.post("/conversations", response_model=ConversationOut, status_code=201)
def start_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == payload.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.host_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot message yourself about your own listing")

    existing = (
        db.query(Conversation)
        .options(
            joinedload(Conversation.listing),
            joinedload(Conversation.guest),
            joinedload(Conversation.host),
            joinedload(Conversation.messages),
        )
        .filter(
            Conversation.guest_id == current_user.id,
            Conversation.host_id == listing.host_id,
            Conversation.listing_id == listing.id,
        )
        .first()
    )
    if existing:
        return _conversation_out(existing, current_user, db)

    conv = Conversation(guest_id=current_user.id, host_id=listing.host_id, listing_id=listing.id)
    db.add(conv)
    db.commit()
    conv = (
        db.query(Conversation)
        .options(
            joinedload(Conversation.listing),
            joinedload(Conversation.guest),
            joinedload(Conversation.host),
            joinedload(Conversation.messages),
        )
        .filter(Conversation.id == conv.id)
        .first()
    )
    return _conversation_out(conv, current_user, db)


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def get_messages(conversation_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if current_user.id not in (conv.guest_id, conv.host_id):
        raise HTTPException(status_code=403, detail="Not your conversation")

    db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user.id,
        Message.read_at.is_(None),
    ).update({Message.read_at: datetime.utcnow()})
    db.commit()

    rows = (
        db.query(Message, User.name)
        .join(User, User.id == Message.sender_id)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return [
        MessageOut(
            id=m.id,
            conversation_id=m.conversation_id,
            sender_id=m.sender_id,
            sender_name=name,
            body=m.body,
            created_at=m.created_at,
            is_mine=m.sender_id == current_user.id,
        )
        for m, name in rows
    ]


@router.post("/conversations/{conversation_id}/messages", response_model=MessageOut, status_code=201)
def send_message(
    conversation_id: int,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if current_user.id not in (conv.guest_id, conv.host_id):
        raise HTTPException(status_code=403, detail="Not your conversation")

    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    msg = Message(conversation_id=conversation_id, sender_id=current_user.id, body=body)
    conv.updated_at = datetime.utcnow()
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return MessageOut(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        sender_name=current_user.name,
        body=msg.body,
        created_at=msg.created_at,
        is_mine=True,
    )
