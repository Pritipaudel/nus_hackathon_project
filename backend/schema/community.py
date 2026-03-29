import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class CommunityCategory(str, Enum):
    ANXIETY = "ANXIETY"
    DEPRESSION = "DEPRESSION"
    TRAUMA = "TRAUMA"
    STRESS = "STRESS"
    GENERAL = "GENERAL"


class ReactionType(str, Enum):
    UPVOTE = "UPVOTE"
    HELPFUL = "HELPFUL"


class CommunityGroupType(str, Enum):
    RELIGION = "RELIGION"
    ETHNICITY_CASTE = "ETHNICITY_CASTE"
    GENDER = "GENDER"
    RACE = "RACE"
    CUSTOM = "CUSTOM"


class CreatePostRequest(BaseModel):
    content: str = Field(min_length=1, max_length=5000)
    category: CommunityCategory = CommunityCategory.GENERAL
    community_group_id: uuid.UUID | None = None


class CreatePostResponse(BaseModel):
    post_id: uuid.UUID


class PostMediaResponse(BaseModel):
    url: str
    media_type: str


class CommunityGroupResponse(BaseModel):
    id: uuid.UUID
    name: str
    group_type: CommunityGroupType
    value: str
    description: str | None = None
    created_by_user_id: uuid.UUID | None = None
    created_at: datetime
    member_count: int = Field(default=0, ge=0)

    model_config = ConfigDict(from_attributes=True)


class MyCommunityGroupResponse(CommunityGroupResponse):
    is_creator: bool
    joined_at: datetime


class CreateCommunityGroupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    group_type: CommunityGroupType
    value: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)


class CommunityPostResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    username: str
    content: str
    category: CommunityCategory
    community_group: CommunityGroupResponse | None = None
    is_verified: bool
    created_at: datetime
    media_urls: list[PostMediaResponse]
    reaction_count: int
    flag_count: int


class CommunityTrendingPostResponse(BaseModel):
    id: uuid.UUID
    content: str
    trend_score: float


class ReactPostRequest(BaseModel):
    reaction_type: ReactionType


class ActionStatusResponse(BaseModel):
    status: str


class FlagPostRequest(BaseModel):
    reason: str = Field(min_length=2, max_length=1000)


class CommunityInviteCreatedResponse(BaseModel):
    token: str
    group_id: uuid.UUID
    invited_by_user_id: uuid.UUID
    expires_at: datetime
    invite_path: str = Field(
        description="Frontend path with token and user_id (inviter) query params",
    )


class AcceptCommunityInviteRequest(BaseModel):
    token: str = Field(min_length=8, max_length=120)


class CommunityInvitePreviewResponse(BaseModel):
    group_id: uuid.UUID
    group_name: str
    expires_at: datetime
    invited_by_user_id: uuid.UUID | None = None
    inviter_display_name: str | None = None


class PostListQuery(BaseModel):
    category: CommunityCategory | None = None
    community_group_id: uuid.UUID | None = None
    group_type: CommunityGroupType | None = None
    group_value: str | None = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)


class CommunityPostListItem(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    username: str
    content: str
    category: CommunityCategory
    community_group: CommunityGroupResponse | None = None
    is_verified: bool
    created_at: datetime
    media_urls: list[PostMediaResponse]
    reaction_count: int
    flag_count: int

    model_config = ConfigDict(from_attributes=True)
