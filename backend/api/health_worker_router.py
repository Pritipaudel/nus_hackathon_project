import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.schema.health_worker import (
    AssignCertificationRequest,
    AssignCertificationResponse,
    CertificationResponse,
    CreateCertificationRequest,
    EnrollTrainingRequest,
    EnrollTrainingResponse,
    HealthWorkerResponse,
    MeetingResponse,
    ScheduleMeetingRequest,
    ScheduleMeetingResponse,
    TrainingProgramResponse,
    UserCertificationResponse,
)
from backend.services.health_worker_service import (
    assign_certification_to_user,
    create_certification,
    enroll_training_program,
    list_certifications_by_user,
    list_health_workers,
    list_training_programs,
    list_user_meetings,
    schedule_meeting,
)

health_worker_router = APIRouter(tags=["health_workers"])


@health_worker_router.get(
    "/health_workers",
    response_model=list[HealthWorkerResponse],
    summary="List health workers",
)
def get_health_workers(
    community_id: uuid.UUID | None = Query(
        default=None,
        description="Optional community group id filter",
    ),
    db: Session = Depends(get_db),
):
    workers = list_health_workers(db=db, community_id=community_id)
    def _split(value: str | None) -> list[str]:
        if not value:
            return []
        return [s.strip() for s in value.split(",") if s.strip()]

    return [
        HealthWorkerResponse(
            id=worker.id,
            username=worker.username,
            organization=worker.organization,
            title=worker.title,
            bio=worker.bio,
            specialties=_split(worker.specialties),
            languages=_split(worker.languages),
            availability=worker.availability or "available",
            sessions_count=worker.sessions_count or 0,
            photo_url=worker.photo_url,
            community_id=worker.community_id,
            community_name=(
                worker.community_group.value if worker.community_group else None
            ),
            is_verified=worker.is_verified,
        )
        for worker in workers
    ]


@health_worker_router.post(
    "/meetings",
    response_model=ScheduleMeetingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule meeting",
)
def create_meeting(
    body: ScheduleMeetingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting = schedule_meeting(
        db=db,
        user_id=current_user.id,
        health_worker_id=body.health_worker_id,
        scheduled_at=body.scheduled_at,
    )
    return ScheduleMeetingResponse(
        meeting_id=meeting.id, meeting_link=meeting.meeting_link
    )


@health_worker_router.get(
    "/meetings/my",
    response_model=list[MeetingResponse],
    summary="List current user meetings",
)
def get_my_meetings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meetings = list_user_meetings(db=db, user_id=current_user.id)
    return [MeetingResponse.model_validate(meeting) for meeting in meetings]


@health_worker_router.get(
    "/training/programs",
    response_model=list[TrainingProgramResponse],
    summary="List training programs",
)
def get_training_programs(
    db: Session = Depends(get_db),
):
    programs = list_training_programs(db=db)
    return [TrainingProgramResponse.model_validate(program) for program in programs]


@health_worker_router.post(
    "/training/enroll",
    response_model=EnrollTrainingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Enroll in training program",
)
def enroll_training(
    body: EnrollTrainingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enrollment = enroll_training_program(
        db=db,
        user_id=current_user.id,
        program_id=body.program_id,
    )
    return EnrollTrainingResponse(status="enrolled", enrollment_id=enrollment.id)


@health_worker_router.post(
    "/training/certifications",
    response_model=CertificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create certification",
)
def create_training_certification(
    body: CreateCertificationRequest,
    db: Session = Depends(get_db),
):
    certification = create_certification(
        db=db,
        title=body.title,
        organization=body.organization,
        description=body.description,
    )
    return CertificationResponse.model_validate(certification)


@health_worker_router.post(
    "/training/certifications/assign",
    response_model=AssignCertificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Assign certification to user",
)
def assign_certification(
    body: AssignCertificationRequest,
    db: Session = Depends(get_db),
):
    user_cert = assign_certification_to_user(
        db=db,
        user_id=body.user_id,
        certification_id=body.certification_id,
        verified=body.verified,
    )
    return AssignCertificationResponse(
        status="assigned",
        user_certification_id=user_cert.id,
    )


@health_worker_router.get(
    "/training/users/{user_id}/certifications",
    response_model=list[UserCertificationResponse],
    summary="List certifications by user",
)
def list_user_certifications(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    user_certifications = list_certifications_by_user(db=db, user_id=user_id)
    return [
        UserCertificationResponse(
            id=row.id,
            user_id=row.user_id,
            certification_id=row.certification_id,
            issued_at=row.issued_at,
            verified=row.verified,
            certification=CertificationResponse.model_validate(row.certification),
        )
        for row in user_certifications
    ]
