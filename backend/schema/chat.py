import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class StartAnonymousChatRequest(BaseModel):
    health_worker_id: uuid.UUID


class ChatSessionResponse(BaseModel):
    session_id: uuid.UUID
    health_worker_id: uuid.UUID
    health_worker_name: str
    patient_alias: str
    status: str


class ChatMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    chat_session_id: uuid.UUID
    sender_role: str
    sender_display_name: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
