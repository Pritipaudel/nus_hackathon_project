import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.repository.health_worker_repository import HealthWorkerRepository
from backend.repository.user_repository import UserRepository


def _build_meeting_link(meeting_id: uuid.UUID) -> str:
    return f"https://meet.demo.local/{meeting_id}"


def list_health_workers(
    db: Session,
    community_id: uuid.UUID | None,
):
    return HealthWorkerRepository(db).list_health_workers(community_id=community_id)


def schedule_meeting(
    db: Session,
    user_id: uuid.UUID,
    health_worker_id: uuid.UUID,
    scheduled_at: datetime,
):
    if scheduled_at.tzinfo is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="scheduled_at must include timezone information",
        )

    if scheduled_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="scheduled_at must be in the future",
        )

    repo = HealthWorkerRepository(db)
    if repo.get_health_worker(health_worker_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health worker not found",
        )

    meeting_link = _build_meeting_link(uuid.uuid4())
    return repo.create_meeting(
        user_id=user_id,
        health_worker_id=health_worker_id,
        scheduled_at=scheduled_at,
        meeting_link=meeting_link,
    )


def list_user_meetings(
    db: Session,
    user_id: uuid.UUID,
):
    return HealthWorkerRepository(db).list_user_meetings(user_id=user_id)


def list_training_programs(db: Session):
    return HealthWorkerRepository(db).list_training_programs()


def enroll_training_program(
    db: Session,
    user_id: uuid.UUID,
    program_id: uuid.UUID,
):
    repo = HealthWorkerRepository(db)
    if repo.get_training_program(program_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training program not found",
        )

    existing = repo.get_training_enrollment(user_id=user_id, program_id=program_id)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already enrolled in this training program",
        )

    return repo.create_training_enrollment(user_id=user_id, program_id=program_id)


def create_certification(
    db: Session,
    title: str,
    organization: str,
    description: str | None,
):
    repo = HealthWorkerRepository(db)
    normalized_title = title.strip()
    normalized_org = organization.strip()

    existing = repo.find_certification_by_title_org(
        title=normalized_title,
        organization=normalized_org,
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Certification already exists for this organization",
        )

    return repo.create_certification(
        title=normalized_title,
        organization=normalized_org,
        description=description.strip() if description else None,
    )


def assign_certification_to_user(
    db: Session,
    user_id: uuid.UUID,
    certification_id: uuid.UUID,
    verified: bool,
):
    if UserRepository(db).get_by_id(str(user_id)) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    repo = HealthWorkerRepository(db)
    if repo.get_certification(certification_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found",
        )

    existing = repo.get_user_certification(
        user_id=user_id,
        certification_id=certification_id,
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already has this certification",
        )

    return repo.create_user_certification(
        user_id=user_id,
        certification_id=certification_id,
        verified=verified,
    )


def list_certifications_by_user(
    db: Session,
    user_id: uuid.UUID,
):
    if UserRepository(db).get_by_id(str(user_id)) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return HealthWorkerRepository(db).list_user_certifications(user_id=user_id)
