from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from backend.core.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.community import CommunityPost
from backend.models.health_worker import HealthWorker, Meeting, UserCertification
from backend.models.icbt import UserICBTProgramProgress
from backend.models.user import User
from backend.schema.dashboard import (
    DashboardCertification,
    DashboardMeeting,
    DashboardProgram,
    DashboardResponse,
)


class WorkerDashboardStats(BaseModel):
    total_health_workers: int
    upcoming_meetings_count: int
    total_community_posts: int

dashboard_router = APIRouter(prefix="/auth/me", tags=["dashboard"])


@dashboard_router.get("/dashboard", response_model=DashboardResponse)
def get_my_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    progress_rows = (
        db.query(UserICBTProgramProgress)
        .options(joinedload(UserICBTProgramProgress.program))
        .filter(UserICBTProgramProgress.user_id == current_user.id)
        .order_by(UserICBTProgramProgress.last_activity_at.desc())
        .all()
    )

    now = datetime.now(timezone.utc)
    meetings = (
        db.query(Meeting)
        .options(joinedload(Meeting.health_worker))
        .filter(
            Meeting.user_id == current_user.id,
            Meeting.scheduled_at >= now,
        )
        .order_by(Meeting.scheduled_at.asc())
        .limit(5)
        .all()
    )

    user_certs = (
        db.query(UserCertification)
        .options(joinedload(UserCertification.certification))
        .filter(UserCertification.user_id == current_user.id)
        .order_by(UserCertification.issued_at.desc())
        .all()
    )

    active = [r for r in progress_rows if r.status == "ACTIVE"]
    completed = [r for r in progress_rows if r.status == "COMPLETED"]

    overall = 0
    if progress_rows:
        overall = sum(r.progress_percent for r in progress_rows) // len(progress_rows)

    active_programmes = [
        DashboardProgram(
            program_id=r.program_id,
            title=r.program.title if r.program else "Unknown",
            difficulty_level=r.program.difficulty_level if r.program else None,
            duration_days=r.program.duration_days if r.program else None,
            status=r.status,
            progress_percent=r.progress_percent,
            started_at=r.started_at,
            completed_at=r.completed_at,
        )
        for r in active
    ]

    completed_programmes = [
        DashboardProgram(
            program_id=r.program_id,
            title=r.program.title if r.program else "Unknown",
            difficulty_level=r.program.difficulty_level if r.program else None,
            duration_days=r.program.duration_days if r.program else None,
            status=r.status,
            progress_percent=r.progress_percent,
            started_at=r.started_at,
            completed_at=r.completed_at,
        )
        for r in completed
    ]

    upcoming_meetings = [
        DashboardMeeting(
            id=m.id,
            health_worker_id=m.health_worker_id,
            worker_name=m.health_worker.username if m.health_worker else None,
            scheduled_at=m.scheduled_at,
            status=m.status,
            meeting_link=m.meeting_link,
        )
        for m in meetings
    ]

    latest_cert = None
    if user_certs:
        c = user_certs[0]
        latest_cert = DashboardCertification(
            id=c.id,
            title=c.certification.title,
            organization=c.certification.organization,
            issued_at=c.issued_at,
            verified=c.verified,
        )

    return DashboardResponse(
        overall_progress=overall,
        programmes_enrolled=len(progress_rows),
        programmes_completed=len(completed),
        upcoming_meetings_count=len(meetings),
        certifications_count=len(user_certs),
        active_programmes=active_programmes,
        completed_programmes=completed_programmes,
        upcoming_meetings=upcoming_meetings,
        latest_certification=latest_cert,
    )


@dashboard_router.get("/worker-dashboard", response_model=WorkerDashboardStats)
def get_worker_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    total_workers = db.query(HealthWorker).count()

    upcoming = (
        db.query(Meeting)
        .filter(Meeting.scheduled_at >= now)
        .count()
    )

    total_posts = db.query(CommunityPost).count()

    return WorkerDashboardStats(
        total_health_workers=total_workers,
        upcoming_meetings_count=upcoming,
        total_community_posts=total_posts,
    )
