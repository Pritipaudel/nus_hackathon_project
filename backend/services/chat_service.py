import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.models.chat import (
    ChatMessage,
    ChatSenderRole,
    ChatSession,
    ChatSessionStatus,
)
from backend.models.user import USER_PATIENT_ROLE, User
from backend.repository.chat_repository import ChatRepository
from backend.repository.health_worker_repository import HealthWorkerRepository


def _is_patient_participant(chat_session: ChatSession, user: User) -> bool:
    return chat_session.patient_id == user.id


def _is_worker_participant(chat_session: ChatSession, user: User) -> bool:
    return chat_session.health_worker_id == user.id


def _ensure_chat_access(chat_session: ChatSession | None, user: User) -> ChatSession:
    if chat_session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found",
        )

    if not (
        _is_patient_participant(chat_session, user)
        or _is_worker_participant(chat_session, user)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this chat session",
        )

    return chat_session


def _sender_role_for_user(chat_session: ChatSession, user: User) -> ChatSenderRole:
    if _is_patient_participant(chat_session, user):
        return ChatSenderRole.PATIENT
    if _is_worker_participant(chat_session, user):
        return ChatSenderRole.HEALTH_WORKER
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You are not a participant in this chat session",
    )


def _sender_display_name(
    chat_session: ChatSession,
    message: ChatMessage,
    viewer_user_id: uuid.UUID,
) -> str:
    is_worker_view = viewer_user_id == chat_session.health_worker_id

    if message.sender_id == chat_session.patient_id:
        # Keep patient identity anonymous for health workers.
        return chat_session.patient.anonymous_username if is_worker_view else "You"

    if message.sender_id == chat_session.health_worker_id:
        return "You" if is_worker_view else chat_session.health_worker.username

    return "Unknown"


def start_or_get_anonymous_chat(
    db: Session,
    patient_user: User,
    health_worker_id: uuid.UUID,
) -> ChatSession:
    if patient_user.role != USER_PATIENT_ROLE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can start anonymous chat sessions",
        )

    worker = HealthWorkerRepository(db).get_health_worker(health_worker_id)
    if worker is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health worker not found",
        )

    repo = ChatRepository(db)
    existing_session = repo.find_open_session(
        patient_id=patient_user.id,
        health_worker_id=health_worker_id,
    )
    if existing_session is not None:
        return existing_session

    return repo.create_session(
        patient_id=patient_user.id,
        health_worker_id=health_worker_id,
    )


def get_chat_session_for_user(
    db: Session,
    session_id: uuid.UUID,
    current_user: User,
) -> ChatSession:
    chat_session = ChatRepository(db).get_session(session_id)
    return _ensure_chat_access(chat_session=chat_session, user=current_user)


def list_chat_messages_for_user(
    db: Session,
    session_id: uuid.UUID,
    current_user: User,
    limit: int,
) -> list[ChatMessage]:
    chat_session = get_chat_session_for_user(
        db=db,
        session_id=session_id,
        current_user=current_user,
    )

    if chat_session.status != ChatSessionStatus.OPEN.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Chat session is closed",
        )

    return ChatRepository(db).list_messages(chat_session_id=session_id, limit=limit)


def persist_chat_message(
    db: Session,
    session_id: uuid.UUID,
    current_user: User,
    content: str,
) -> tuple[ChatSession, ChatMessage]:
    normalized_content = content.strip()
    if not normalized_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty",
        )

    if len(normalized_content) > 2000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message content must be <= 2000 characters",
        )

    chat_session = get_chat_session_for_user(
        db=db,
        session_id=session_id,
        current_user=current_user,
    )

    if chat_session.status != ChatSessionStatus.OPEN.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Chat session is closed",
        )

    sender_role = _sender_role_for_user(chat_session=chat_session, user=current_user)

    message = ChatRepository(db).create_message(
        chat_session_id=session_id,
        sender_id=current_user.id,
        sender_role=sender_role.value,
        content=normalized_content,
    )
    return chat_session, message


def serialize_message_for_viewer(
    chat_session: ChatSession,
    message: ChatMessage,
    viewer_user_id: uuid.UUID,
) -> dict:
    return {
        "id": str(message.id),
        "chat_session_id": str(message.chat_session_id),
        "sender_role": message.sender_role,
        "sender_display_name": _sender_display_name(
            chat_session=chat_session,
            message=message,
            viewer_user_id=viewer_user_id,
        ),
        "content": message.content,
        "created_at": message.created_at.isoformat(),
    }
