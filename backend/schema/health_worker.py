import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class HealthWorkerResponse(BaseModel):
    id: uuid.UUID
    username: str
    organization: str
    title: str | None = None
    bio: str | None = None
    specialties: list[str] = []
    languages: list[str] = []
    availability: str | None = "available"
    sessions_count: int = 0
    photo_url: str | None = None
    community_id: uuid.UUID | None = None
    community_name: str | None = None
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)


class ScheduleMeetingRequest(BaseModel):
    health_worker_id: uuid.UUID
    scheduled_at: datetime


class ScheduleMeetingResponse(BaseModel):
    meeting_id: uuid.UUID
    meeting_link: str


class MeetingResponse(BaseModel):
    id: uuid.UUID
    health_worker_id: uuid.UUID
    scheduled_at: datetime
    status: str
    meeting_link: str

    model_config = ConfigDict(from_attributes=True)


class TrainingProgramResponse(BaseModel):
    id: uuid.UUID
    title: str
    organization: str
    description: str | None = None
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)


class EnrollTrainingRequest(BaseModel):
    program_id: uuid.UUID


class EnrollTrainingResponse(BaseModel):
    status: str
    enrollment_id: uuid.UUID


class CreateCertificationRequest(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    organization: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=2000)


class CertificationResponse(BaseModel):
    id: uuid.UUID
    title: str
    organization: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AssignCertificationRequest(BaseModel):
    user_id: uuid.UUID
    certification_id: uuid.UUID
    verified: bool = True


class AssignCertificationResponse(BaseModel):
    status: str
    user_certification_id: uuid.UUID


class UserCertificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    certification_id: uuid.UUID
    issued_at: datetime
    verified: bool
    certification: CertificationResponse


class ActionStatusResponse(BaseModel):
    status: str
