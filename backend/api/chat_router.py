import json
import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from pydantic import ValidationError
from sqlalchemy.orm import Session

from backend.core.database import SessionLocal, get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.repository.user_repository import UserRepository
from backend.schema.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatSessionResponse,
    StartAnonymousChatRequest,
)
from backend.services.auth_service import decode_access_token
from backend.services.chat_service import (
    get_chat_session_for_user,
    list_chat_messages_for_user,
    persist_chat_message,
    serialize_message_for_viewer,
    start_or_get_anonymous_chat,
)

chat_router = APIRouter(tags=["chat"])


class _ChatConnectionManager:
    def __init__(self):
        self.active_connections: dict[uuid.UUID, dict[uuid.UUID, WebSocket]] = {}

    def connect(self, session_id: uuid.UUID, user_id: uuid.UUID, websocket: WebSocket):
        session_connections = self.active_connections.setdefault(session_id, {})
        session_connections[user_id] = websocket

    def disconnect(self, session_id: uuid.UUID, user_id: uuid.UUID):
        session_connections = self.active_connections.get(session_id)
        if not session_connections:
            return

        session_connections.pop(user_id, None)
        if not session_connections:
            self.active_connections.pop(session_id, None)

    def get_session_connections(
        self, session_id: uuid.UUID
    ) -> dict[uuid.UUID, WebSocket]:
        return self.active_connections.get(session_id, {})


chat_connection_manager = _ChatConnectionManager()


@chat_router.post(
    "/chat/sessions",
    response_model=ChatSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start anonymous chat with a health worker",
)
def start_chat_session(
    body: StartAnonymousChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat_session = start_or_get_anonymous_chat(
        db=db,
        patient_user=current_user,
        health_worker_id=body.health_worker_id,
    )

    return ChatSessionResponse(
        session_id=chat_session.id,
        health_worker_id=chat_session.health_worker_id,
        health_worker_name=chat_session.health_worker.username,
        patient_alias=current_user.anonymous_username,
        status=chat_session.status,
    )


@chat_router.get(
    "/chat/sessions/{session_id}/messages",
    response_model=list[ChatMessageResponse],
    summary="List chat messages for a session",
)
def get_chat_messages(
    session_id: uuid.UUID,
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat_session = get_chat_session_for_user(
        db=db,
        session_id=session_id,
        current_user=current_user,
    )
    messages = list_chat_messages_for_user(
        db=db,
        session_id=session_id,
        current_user=current_user,
        limit=limit,
    )

    return [
        ChatMessageResponse.model_validate(
            serialize_message_for_viewer(
                chat_session=chat_session,
                message=message,
                viewer_user_id=current_user.id,
            )
        )
        for message in messages
    ]


@chat_router.websocket("/chat/ws/{session_id}")
async def websocket_chat(
    websocket: WebSocket,
    session_id: uuid.UUID,
    token: str = Query(..., description="JWT token"),
):
    try:
        user_id, _role = decode_access_token(token)
    except ValueError:
        await websocket.close(code=1008, reason="Invalid token")
        return

    db = SessionLocal()
    user: User | None = None
    try:
        user = UserRepository(db).get_by_id(user_id)
        if user is None:
            await websocket.close(code=1008, reason="User not found")
            return

        chat_session = get_chat_session_for_user(
            db=db,
            session_id=session_id,
            current_user=user,
        )
    except HTTPException:
        await websocket.close(code=1008, reason="Unauthorized chat access")
        db.close()
        return

    await websocket.accept()
    chat_connection_manager.connect(
        session_id=session_id,
        user_id=user.id,
        websocket=websocket,
    )

    try:
        while True:
            raw_data = await websocket.receive_text()

            try:
                message_payload = json.loads(raw_data)
                request = ChatMessageRequest.model_validate(message_payload)
            except (json.JSONDecodeError, ValidationError):
                await websocket.send_json(
                    {
                        "type": "error",
                        "detail": 'Invalid message payload. Expected: {"content": "..."}',
                    }
                )
                continue

            try:
                chat_session, message = persist_chat_message(
                    db=db,
                    session_id=session_id,
                    current_user=user,
                    content=request.content,
                )
            except HTTPException as exc:
                await websocket.send_json(
                    {
                        "type": "error",
                        "detail": getattr(exc, "detail", "Unable to send message"),
                    }
                )
                continue

            for (
                recipient_user_id,
                recipient_ws,
            ) in chat_connection_manager.get_session_connections(session_id).items():
                payload = serialize_message_for_viewer(
                    chat_session=chat_session,
                    message=message,
                    viewer_user_id=recipient_user_id,
                )
                await recipient_ws.send_json(payload)

    except WebSocketDisconnect:
        pass
    finally:
        chat_connection_manager.disconnect(session_id=session_id, user_id=user.id)
        db.close()
