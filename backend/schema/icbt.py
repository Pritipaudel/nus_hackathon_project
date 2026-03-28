import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ICBTCommunityMetadataResponse(BaseModel):
    community_id: uuid.UUID = Field(description="Community group UUID")
    community_name: str = Field(description="Display name of the community group")
    community_group_type: str = Field(
        description="Community group type such as RELIGION, GENDER, RACE"
    )
    total_users_using: int = Field(
        description="Total distinct users from this community enrolled in the program",
        ge=0,
    )
    total_users_completed: int = Field(
        description="Total distinct users from this community who completed the program",
        ge=0,
    )
    total_users_in_progress: int = Field(
        description="Total distinct users from this community still in progress",
        ge=0,
    )


class ICBTProgramResponse(BaseModel):
    id: uuid.UUID = Field(description="ICBT program UUID")
    title: str = Field(description="Program title")
    description: Optional[str] = Field(default=None, description="Program description")
    difficulty_level: Optional[str] = Field(
        default=None,
        description="Difficulty label, for example Beginner/Intermediate/Advanced",
    )
    duration_days: Optional[int] = Field(
        default=None,
        description="Estimated duration in days",
        ge=0,
    )
    url: Optional[str] = Field(default=None, description="Program landing page URL")
    community_metadata: list[ICBTCommunityMetadataResponse] = Field(
        default_factory=list,
        description="Community-level usage and completion stats for this program",
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "83a4a9ed-31cb-4f8c-b4fd-ef785880a44c",
                "title": "Anxiety Foundations",
                "description": "A guided iCBT track for anxiety management.",
                "difficulty_level": "Beginner",
                "duration_days": 21,
                "url": "https://example.org/icbt/anxiety-foundations",
                "community_metadata": [
                    {
                        "community_id": "8ab6aeca-6d0b-4273-9156-60ca8dd10cef",
                        "community_name": "Tamil Hindu",
                        "community_group_type": "RELIGION",
                        "total_users_using": 12,
                        "total_users_completed": 8,
                        "total_users_in_progress": 4,
                    }
                ],
            }
        },
    )


class EnrollICBTProgramRequest(BaseModel):
    program_id: uuid.UUID = Field(description="Program UUID to enroll in")
    community_id: uuid.UUID | None = Field(
        default=None,
        description="Optional community UUID used for community-scoped enrollment",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "program_id": "83a4a9ed-31cb-4f8c-b4fd-ef785880a44c",
                "community_id": "8ab6aeca-6d0b-4273-9156-60ca8dd10cef",
            }
        }
    )


class SetICBTProgramCommunitiesRequest(BaseModel):
    community_ids: list[uuid.UUID] = Field(
        min_length=1,
        description="List of community UUIDs that this program targets",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "community_ids": [
                    "8ab6aeca-6d0b-4273-9156-60ca8dd10cef",
                    "6f972f30-462f-4666-830c-4d3f30ec1ff8",
                ]
            }
        }
    )


class SetICBTProgramCommunitiesResponse(BaseModel):
    program_id: uuid.UUID = Field(description="Program UUID")
    community_ids: list[uuid.UUID] = Field(
        description="Final assigned community UUIDs for the program"
    )


class EnrollICBTProgramResponse(BaseModel):
    enrollment_id: uuid.UUID = Field(description="Enrollment record UUID")
    status: str = Field(description="Enrollment status: ACTIVE or COMPLETED")
    program_id: uuid.UUID = Field(description="Program UUID")
    progress_percent: int = Field(
        description="Current progress in percentage", ge=0, le=100
    )
    community_id: uuid.UUID | None = Field(
        default=None,
        description="Community UUID used for enrollment, if any",
    )


class UpdateICBTProgressRequest(BaseModel):
    progress_percent: int = Field(
        ge=0,
        le=100,
        description="New progress value in percentage",
    )

    model_config = ConfigDict(json_schema_extra={"example": {"progress_percent": 75}})


class UpdateICBTProgressResponse(BaseModel):
    enrollment_id: uuid.UUID = Field(description="Enrollment record UUID")
    program_id: uuid.UUID = Field(description="Program UUID")
    status: str = Field(description="ACTIVE if <100, COMPLETED at 100")
    progress_percent: int = Field(
        description="Current progress in percentage", ge=0, le=100
    )
    completed_at: datetime | None = Field(
        default=None,
        description="Completion timestamp, present only when status is COMPLETED",
    )


class MyICBTProgramResponse(BaseModel):
    enrollment_id: uuid.UUID = Field(description="Enrollment record UUID")
    program_id: uuid.UUID = Field(description="Program UUID")
    title: str = Field(description="Program title")
    description: Optional[str] = Field(default=None, description="Program description")
    difficulty_level: Optional[str] = Field(
        default=None,
        description="Difficulty label",
    )
    duration_days: Optional[int] = Field(
        default=None, description="Estimated duration in days"
    )
    url: Optional[str] = Field(default=None, description="Program landing page URL")
    status: str = Field(description="Enrollment status: ACTIVE or COMPLETED")
    progress_percent: int = Field(description="Progress in percentage", ge=0, le=100)
    community_id: uuid.UUID | None = Field(default=None, description="Community UUID")
    community_name: str | None = Field(
        default=None, description="Community display name"
    )
    started_at: datetime = Field(description="Enrollment start timestamp")
    last_activity_at: datetime = Field(description="Most recent update timestamp")
    completed_at: datetime | None = Field(
        default=None,
        description="Completion timestamp if completed",
    )

    model_config = ConfigDict(from_attributes=True)
