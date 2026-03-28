import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from backend.models.user import DEFAULT_USER_ROLE, UserRole


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    anonymous_username: str | None = Field(default=None, min_length=2, max_length=120)
    role: UserRole = DEFAULT_USER_ROLE


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    anonymous_username: str
    first_name: str
    last_name: str
    role: UserRole
    is_active: bool
    is_onboarded: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse
    is_first_login: bool


class OnboardHealthWorkerRequest(BaseModel):
    username: str = Field(min_length=2, max_length=120)
    organization: str = Field(min_length=2, max_length=200)
    community_id: uuid.UUID


class OnboardedHealthWorkerResponse(BaseModel):
    id: uuid.UUID
    username: str
    organization: str
    community_id: uuid.UUID | None = None
    community_name: str | None = None
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)


class OnboardHealthWorkerResponse(BaseModel):
    user: UserResponse
    health_worker: OnboardedHealthWorkerResponse
    tokens: TokenResponse
