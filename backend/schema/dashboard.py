import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DashboardProgram(BaseModel):
    program_id: uuid.UUID
    title: str
    difficulty_level: Optional[str]
    duration_days: Optional[int]
    status: str
    progress_percent: int
    started_at: datetime
    completed_at: Optional[datetime]


class DashboardMeeting(BaseModel):
    id: uuid.UUID
    health_worker_id: uuid.UUID
    worker_name: Optional[str]
    scheduled_at: datetime
    status: str
    meeting_link: str


class DashboardCertification(BaseModel):
    id: uuid.UUID
    title: str
    organization: str
    issued_at: datetime
    verified: bool


class DashboardResponse(BaseModel):
    overall_progress: int
    programmes_enrolled: int
    programmes_completed: int
    upcoming_meetings_count: int
    certifications_count: int
    active_programmes: list[DashboardProgram]
    completed_programmes: list[DashboardProgram]
    upcoming_meetings: list[DashboardMeeting]
    latest_certification: Optional[DashboardCertification]
