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

    model_config = ConfigDict(from_attributes=True)


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
