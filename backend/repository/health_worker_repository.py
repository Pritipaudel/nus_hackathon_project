import uuid

from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from backend.models.health_worker import (
    Certification,
    HealthWorker,
    Meeting,
    TrainingEnrollment,
    TrainingProgram,
    UserCertification,
)
from backend.models.user import User


class HealthWorkerRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_health_workers(
        self,
        community_id: uuid.UUID | None = None,
    ) -> list[HealthWorker]:
        query = self.db.query(HealthWorker).options(
            joinedload(HealthWorker.community_group)
        )
        if community_id:
            query = query.filter(HealthWorker.community_id == community_id)
        return query.order_by(HealthWorker.created_at.desc()).all()

    def get_health_worker(self, worker_id: uuid.UUID) -> HealthWorker | None:
        return (
            self.db.query(HealthWorker)
            .options(joinedload(HealthWorker.community_group))
            .filter(HealthWorker.id == worker_id)
            .first()
        )

    def upsert_health_worker_profile(
        self,
        user_id: uuid.UUID,
        username: str,
        organization: str,
        community_id: uuid.UUID,
    ) -> HealthWorker:
        health_worker = self.get_health_worker(user_id)
        if health_worker is None:
            health_worker = HealthWorker(
                id=user_id,
                username=username,
                organization=organization,
                community_id=community_id,
            )
            self.db.add(health_worker)
        else:
            health_worker.username = username
            health_worker.organization = organization
            health_worker.community_id = community_id

        self.db.flush()
        return health_worker

    def create_meeting(
        self,
        user_id: uuid.UUID,
        health_worker_id: uuid.UUID,
        scheduled_at,
        meeting_link: str,
    ) -> Meeting:
        meeting = Meeting(
            user_id=user_id,
            health_worker_id=health_worker_id,
            scheduled_at=scheduled_at,
            meeting_link=meeting_link,
        )
        self.db.add(meeting)
        self.db.commit()
        self.db.refresh(meeting)
        return meeting

    def list_user_meetings(self, user_id: uuid.UUID) -> list[Meeting]:
        return (
            self.db.query(Meeting)
            .filter(Meeting.user_id == user_id)
            .order_by(Meeting.scheduled_at.desc())
            .all()
        )

    def list_worker_meetings(self, worker_user_id: uuid.UUID) -> list[Meeting]:
        """Return all meetings where this user IS the health worker.
        Since HealthWorker.id == User.id (enforced by seed and onboarding),
        we filter Meeting.health_worker_id == worker_user_id directly.
        """
        return (
            self.db.query(Meeting)
            .filter(Meeting.health_worker_id == worker_user_id)
            .order_by(Meeting.scheduled_at.asc())
            .all()
        )

    def list_training_programs(self) -> list[TrainingProgram]:
        return (
            self.db.query(TrainingProgram)
            .order_by(TrainingProgram.created_at.desc())
            .all()
        )

    def get_training_program(self, program_id: uuid.UUID) -> TrainingProgram | None:
        return (
            self.db.query(TrainingProgram)
            .filter(TrainingProgram.id == program_id)
            .first()
        )

    def get_training_enrollment(
        self,
        user_id: uuid.UUID,
        program_id: uuid.UUID,
    ) -> TrainingEnrollment | None:
        return (
            self.db.query(TrainingEnrollment)
            .filter(
                TrainingEnrollment.user_id == user_id,
                TrainingEnrollment.program_id == program_id,
            )
            .first()
        )

    def create_training_enrollment(
        self,
        user_id: uuid.UUID,
        program_id: uuid.UUID,
    ) -> TrainingEnrollment:
        enrollment = TrainingEnrollment(user_id=user_id, program_id=program_id)
        self.db.add(enrollment)
        self.db.commit()
        self.db.refresh(enrollment)
        return enrollment

    def create_certification(
        self,
        title: str,
        organization: str,
        description: str | None,
    ) -> Certification:
        certification = Certification(
            title=title,
            organization=organization,
            description=description,
        )
        self.db.add(certification)
        self.db.commit()
        self.db.refresh(certification)
        return certification

    def get_certification(self, certification_id: uuid.UUID) -> Certification | None:
        return (
            self.db.query(Certification)
            .filter(Certification.id == certification_id)
            .first()
        )

    def find_certification_by_title_org(
        self,
        title: str,
        organization: str,
    ) -> Certification | None:
        return (
            self.db.query(Certification)
            .filter(
                Certification.title == title,
                Certification.organization == organization,
            )
            .first()
        )

    def get_user_certification(
        self,
        user_id: uuid.UUID,
        certification_id: uuid.UUID,
    ) -> UserCertification | None:
        return (
            self.db.query(UserCertification)
            .filter(
                UserCertification.user_id == user_id,
                UserCertification.certification_id == certification_id,
            )
            .first()
        )

    def create_user_certification(
        self,
        user_id: uuid.UUID,
        certification_id: uuid.UUID,
        verified: bool,
    ) -> UserCertification:
        user_certification = UserCertification(
            user_id=user_id,
            certification_id=certification_id,
            verified=verified,
        )
        self.db.add(user_certification)
        self.db.commit()
        self.db.refresh(user_certification)
        return user_certification

    def list_user_certifications(self, user_id: uuid.UUID) -> list[UserCertification]:
        return (
            self.db.query(UserCertification)
            .options(joinedload(UserCertification.certification))
            .filter(UserCertification.user_id == user_id)
            .order_by(UserCertification.issued_at.desc())
            .all()
        )

    def update_photo_url(self, worker_id: uuid.UUID, photo_url: str) -> HealthWorker | None:
        hw = self.db.query(HealthWorker).filter(HealthWorker.id == worker_id).first()
        if hw:
            hw.photo_url = photo_url
            self.db.commit()
            self.db.refresh(hw)
        return hw

    def list_all_certifications(self) -> list[Certification]:
        return (
            self.db.query(Certification)
            .order_by(Certification.created_at.desc())
            .all()
        )

    def worker_has_patient_meeting(
        self, worker_user_id: uuid.UUID, patient_user_id: uuid.UUID
    ) -> bool:
        return (
            self.db.query(Meeting.id)
            .filter(
                Meeting.health_worker_id == worker_user_id,
                Meeting.user_id == patient_user_id,
            )
            .first()
            is not None
        )

    def list_patients_for_worker(self, worker_user_id: uuid.UUID) -> list[User]:
        """Return distinct patients who have a meeting with this health worker.

        The HealthWorker record for a logged-in worker is created with id == user.id
        (via upsert_health_worker_profile or the seed), so Meeting.health_worker_id
        directly matches the worker's User.id.
        """
        subquery = (
            self.db.query(Meeting.user_id)
            .filter(Meeting.health_worker_id == worker_user_id)
            .distinct()
            .subquery()
        )
        return (
            self.db.query(User)
            .filter(User.id.in_(subquery))
            .order_by(User.first_name)
            .all()
        )
