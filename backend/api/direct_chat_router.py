import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.schema.direct_chat import (
    ChatContactResponse,
    DirectMessageResponse,
    SendDirectMessageRequest,
)
from backend.services.direct_chat_service import (
    list_chat_contacts,
    list_thread_messages,
    send_direct_message,
)

direct_chat_router = APIRouter(prefix="/chat", tags=["chat"])


@direct_chat_router.get(
    "/contacts",
    response_model=list[ChatContactResponse],
    summary="People you can message (linked by a meeting)",
)
def get_chat_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_chat_contacts(db=db, current_user=current_user)


@direct_chat_router.get(
    "/messages",
    response_model=list[DirectMessageResponse],
    summary="Messages between you and another user",
)
def get_chat_messages(
    peer: uuid.UUID = Query(..., description="Other user id in the conversation"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_thread_messages(db=db, current_user=current_user, other_user_id=peer)


@direct_chat_router.post(
    "/messages",
    response_model=DirectMessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Send a direct message",
)
def post_chat_message(
    body: SendDirectMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return send_direct_message(
        db=db,
        current_user=current_user,
        recipient_id=body.recipient_id,
        body=body.body,
    )
