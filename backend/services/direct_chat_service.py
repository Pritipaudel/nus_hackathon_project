import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.models.user import USER_HEALTH_WORKER_ROLE, USER_PATIENT_ROLE, User
from backend.repository.direct_message_repository import DirectMessageRepository
from backend.repository.health_worker_repository import HealthWorkerRepository
from backend.repository.user_repository import UserRepository
from backend.schema.direct_chat import ChatContactResponse, DirectMessageResponse


def _assert_worker_patient_pair_can_chat(
    db: Session, user_a: User, user_b: User
) -> None:
    # Use scheduled meetings as the source of truth (not User.role). Mis-set roles
    # would break worker/patient inference and block chat even when a meeting exists.
    if not HealthWorkerRepository(db).users_have_shared_meeting(user_a.id, user_b.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only message someone you have a scheduled session with.",
        )


def list_chat_contacts(db: Session, current_user: User) -> list[ChatContactResponse]:
    hw_repo = HealthWorkerRepository(db)
    if current_user.role == USER_HEALTH_WORKER_ROLE:
        patients = hw_repo.list_patients_for_worker(current_user.id)
        return [
            ChatContactResponse(
                user_id=p.id,
                display_name=f"{p.first_name} {p.last_name}".strip() or p.anonymous_username,
                anonymous_username=p.anonymous_username,
                peer_role="patient",
            )
            for p in patients
        ]

    if current_user.role == USER_PATIENT_ROLE:
        meetings = hw_repo.list_user_meetings(current_user.id)
        seen: set[uuid.UUID] = set()
        out: list[ChatContactResponse] = []
        for m in meetings:
            wid = m.health_worker_id
            if wid in seen:
                continue
            seen.add(wid)
            hw = hw_repo.get_health_worker(wid)
            if hw is None:
                continue
            out.append(
                ChatContactResponse(
                    user_id=wid,
                    display_name=hw.username,
                    anonymous_username=None,
                    peer_role="health_worker",
                )
            )
        return out

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Unsupported role for chat.",
    )


def list_thread_messages(
    db: Session, current_user: User, other_user_id: uuid.UUID
) -> list[DirectMessageResponse]:
    other = UserRepository(db).get_by_id(str(other_user_id))
    if other is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    _assert_worker_patient_pair_can_chat(db, current_user, other)
    rows = DirectMessageRepository(db).list_between(current_user.id, other_user_id)
    return [DirectMessageResponse.model_validate(r) for r in rows]


def send_direct_message(
    db: Session, current_user: User, recipient_id: uuid.UUID, body: str
) -> DirectMessageResponse:
    stripped = body.strip()
    if not stripped:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message body cannot be empty.",
        )
    if len(stripped) > 2000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message is too long.",
        )
    other = UserRepository(db).get_by_id(str(recipient_id))
    if other is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found.",
        )
    _assert_worker_patient_pair_can_chat(db, current_user, other)
    row = DirectMessageRepository(db).create(
        sender_id=current_user.id,
        recipient_id=recipient_id,
        body=stripped,
    )
    return DirectMessageResponse.model_validate(row)
