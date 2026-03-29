import uuid

from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.models.direct_message import DirectMessage


class DirectMessageRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_between(self, user_a: uuid.UUID, user_b: uuid.UUID) -> list[DirectMessage]:
        return (
            self.db.query(DirectMessage)
            .filter(
                or_(
                    (DirectMessage.sender_id == user_a)
                    & (DirectMessage.recipient_id == user_b),
                    (DirectMessage.sender_id == user_b)
                    & (DirectMessage.recipient_id == user_a),
                )
            )
            .order_by(DirectMessage.created_at.asc())
            .all()
        )

    def create(
        self, sender_id: uuid.UUID, recipient_id: uuid.UUID, body: str
    ) -> DirectMessage:
        row = DirectMessage(sender_id=sender_id, recipient_id=recipient_id, body=body)
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row
