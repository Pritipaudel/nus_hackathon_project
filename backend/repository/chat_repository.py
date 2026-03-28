import uuid

from sqlalchemy.orm import Session, joinedload

from backend.models.chat import ChatMessage, ChatSession, ChatSessionStatus


class ChatRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_open_session(
        self,
        patient_id: uuid.UUID,
        health_worker_id: uuid.UUID,
    ) -> ChatSession | None:
        return (
            self.db.query(ChatSession)
            .options(
                joinedload(ChatSession.patient),
                joinedload(ChatSession.health_worker),
            )
            .filter(
                ChatSession.patient_id == patient_id,
                ChatSession.health_worker_id == health_worker_id,
                ChatSession.status == ChatSessionStatus.OPEN.value,
            )
            .order_by(ChatSession.created_at.desc())
            .first()
        )

    def create_session(
        self,
        patient_id: uuid.UUID,
        health_worker_id: uuid.UUID,
    ) -> ChatSession:
        chat_session = ChatSession(
            patient_id=patient_id,
            health_worker_id=health_worker_id,
            status=ChatSessionStatus.OPEN.value,
        )
        self.db.add(chat_session)
        self.db.commit()
        self.db.refresh(chat_session)
        return self.get_session(chat_session.id)

    def get_session(self, session_id: uuid.UUID) -> ChatSession | None:
        return (
            self.db.query(ChatSession)
            .options(
                joinedload(ChatSession.patient),
                joinedload(ChatSession.health_worker),
            )
            .filter(ChatSession.id == session_id)
            .first()
        )

    def create_message(
        self,
        chat_session_id: uuid.UUID,
        sender_id: uuid.UUID,
        sender_role: str,
        content: str,
    ) -> ChatMessage:
        message = ChatMessage(
            chat_session_id=chat_session_id,
            sender_id=sender_id,
            sender_role=sender_role,
            content=content,
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def list_messages(
        self,
        chat_session_id: uuid.UUID,
        limit: int = 50,
    ) -> list[ChatMessage]:
        return (
            self.db.query(ChatMessage)
            .filter(ChatMessage.chat_session_id == chat_session_id)
            .order_by(ChatMessage.created_at.asc())
            .limit(limit)
            .all()
        )
