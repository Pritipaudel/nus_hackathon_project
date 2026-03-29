import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChatContactResponse(BaseModel):
    user_id: uuid.UUID
    display_name: str
    anonymous_username: str | None = None
    peer_role: str

    model_config = ConfigDict(from_attributes=True)


class DirectMessageResponse(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID
    recipient_id: uuid.UUID
    body: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SendDirectMessageRequest(BaseModel):
    recipient_id: uuid.UUID
    body: str = Field(..., min_length=1, max_length=2000)
