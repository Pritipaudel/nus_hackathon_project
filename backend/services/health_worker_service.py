import io
import json
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from backend.core.minio_client import MINIO_ENDPOINT, minio_client
from backend.repository.health_worker_repository import HealthWorkerRepository
from backend.repository.user_repository import UserRepository

WORKER_PHOTO_BUCKET = "worker-photos"


def _ensure_photo_bucket() -> None:
    if not minio_client.bucket_exists(WORKER_PHOTO_BUCKET):
        minio_client.make_bucket(WORKER_PHOTO_BUCKET)
    policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"AWS": ["*"]},
            "Action": ["s3:GetObject"],
            "Resource": [f"arn:aws:s3:::{WORKER_PHOTO_BUCKET}/*"],
        }],
    })
    minio_client.set_bucket_policy(WORKER_PHOTO_BUCKET, policy)


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


def list_worker_meetings(
    db: Session,
    worker_user_id: uuid.UUID,
):
    return HealthWorkerRepository(db).list_worker_meetings(worker_user_id=worker_user_id)


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


def list_all_certifications(db: Session):
    return HealthWorkerRepository(db).list_all_certifications()


async def upload_worker_photo(
    db: Session,
    worker_user_id: uuid.UUID,
    file: UploadFile,
) -> str:
    """Upload a photo to MinIO and save the public URL on the HealthWorker row."""
    import mimetypes as _mime
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        guessed, _ = _mime.guess_type(file.filename or "")
        content_type = guessed or "image/jpeg"
        if not content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are allowed.",
            )

    _ensure_photo_bucket()

    ext = content_type.split("/")[-1].replace("jpeg", "jpg")
    object_name = f"{worker_user_id}.{ext}"

    data = await file.read()
    minio_client.put_object(
        bucket_name=WORKER_PHOTO_BUCKET,
        object_name=object_name,
        data=io.BytesIO(data),
        length=len(data),
        content_type=content_type,
    )

    photo_url = f"http://{MINIO_ENDPOINT}/{WORKER_PHOTO_BUCKET}/{object_name}"

    repo = HealthWorkerRepository(db)
    hw = repo.update_photo_url(worker_id=worker_user_id, photo_url=photo_url)
    if hw is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health worker profile not found. Complete onboarding first.",
        )

    return photo_url


def list_worker_patients(db: Session, worker_user_id: uuid.UUID):
    from backend.schema.health_worker import WorkerPatientResponse
    patients = HealthWorkerRepository(db).list_patients_for_worker(worker_user_id=worker_user_id)
    return [
        WorkerPatientResponse(
            user_id=p.id,
            first_name=p.first_name,
            last_name=p.last_name,
            anonymous_username=p.anonymous_username,
            email=p.email,
        )
        for p in patients
    ]


def get_worker_patient_profile(
    db: Session,
    worker_user_id: uuid.UUID,
    patient_user_id: uuid.UUID,
):
    from collections import Counter

    from backend.repository.community_repository import CommunityRepository
    from backend.schema.health_worker import (
        PatientProfileCommunityItem,
        PatientProfileIcbtItem,
        PatientProfileMoodSlice,
        WorkerPatientProfileResponse,
    )
    from backend.services.icbt_service import list_user_icbt_programs

    hw_repo = HealthWorkerRepository(db)
    if not hw_repo.worker_has_patient_meeting(worker_user_id, patient_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view patients who have booked a session with you.",
        )

    patient = UserRepository(db).get_by_id(str(patient_user_id))
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    icbt_rows = list_user_icbt_programs(db=db, user_id=patient_user_id)
    icbt_items = [
        PatientProfileIcbtItem(
            program_id=r.program_id,
            title=r.title,
            progress_percent=r.progress_percent,
            status=str(r.status),
            community_name=r.community_name,
        )
        for r in icbt_rows
    ]
    overall = None
    if icbt_items:
        overall = sum(p.progress_percent for p in icbt_items) // len(icbt_items)

    posts = CommunityRepository(db).list_posts(
        category=None,
        community_group_id=None,
        group_type=None,
        group_value=None,
        user_id=patient_user_id,
        page=1,
        limit=100,
    )

    group_map: dict[uuid.UUID, tuple[str, str | None]] = {}
    for row in icbt_rows:
        if row.community_id and row.community_name:
            group_map[row.community_id] = (row.community_name, None)

    cat_counter: Counter[str] = Counter()
    for post in posts:
        cat_counter[post.category] += 1
        if post.community_group_id and post.community_group:
            gid = post.community_group_id
            if gid not in group_map:
                group_map[gid] = (
                    post.community_group.name,
                    post.community_group.value,
                )

    community_items = [
        PatientProfileCommunityItem(
            community_group_id=gid,
            name=name,
            value=val,
        )
        for gid, (name, val) in sorted(group_map.items(), key=lambda x: x[1][0])
    ]

    mood_slices = [
        PatientProfileMoodSlice(category=c, count=n)
        for c, n in cat_counter.most_common()
    ]

    mood_summary = None
    if mood_slices:
        top = mood_slices[0]
        mood_summary = (
            f"Recent community posts are mostly tagged as {top.category.replace('_', ' ').title()} "
            f"({top.count} post{'s' if top.count != 1 else ''})."
        )
    elif not posts:
        mood_summary = "No community posts yet — mood signals will appear when they share in groups."

    return WorkerPatientProfileResponse(
        user_id=patient.id,
        first_name=patient.first_name,
        last_name=patient.last_name,
        anonymous_username=patient.anonymous_username,
        email=patient.email,
        icbt_programs=icbt_items,
        community_groups=community_items,
        mood_by_category=mood_slices,
        posts_count=len(posts),
        overall_icbt_progress_percent=overall,
        mood_summary=mood_summary,
    )
