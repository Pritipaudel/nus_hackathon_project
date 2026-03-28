import uuid
from datetime import datetime
from typing import Literal, cast

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from backend.models.user import DEFAULT_USER_ROLE, UserRole

ApiUserRole = Literal["USER_PATIENT", "USER_HEALTH_WORKER"]

API_TO_DB_ROLE: dict[ApiUserRole, UserRole] = {
    "USER_PATIENT": "USER-PATIENT",
    "USER_HEALTH_WORKER": "USER-HEALTH-WORKER",
}

DB_TO_API_ROLE: dict[UserRole, ApiUserRole] = {
    "USER-PATIENT": "USER_PATIENT",
    "USER-HEALTH-WORKER": "USER_HEALTH_WORKER",
}


def to_db_role(role: str | UserRole | ApiUserRole) -> UserRole:
    if isinstance(role, str) and role in API_TO_DB_ROLE:
        return API_TO_DB_ROLE[cast(ApiUserRole, role)]
    if isinstance(role, str) and role in DB_TO_API_ROLE:
        return cast(UserRole, role)
    raise ValueError("Invalid role")


def to_api_role(role: str | UserRole | ApiUserRole) -> ApiUserRole:
    if isinstance(role, str) and role in DB_TO_API_ROLE:
        return DB_TO_API_ROLE[cast(UserRole, role)]
    if isinstance(role, str) and role in API_TO_DB_ROLE:
        return cast(ApiUserRole, role)
    raise ValueError("Invalid role")


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    anonymous_username: str | None = Field(default=None, min_length=2, max_length=120)
    role: ApiUserRole = DB_TO_API_ROLE[DEFAULT_USER_ROLE]

    @field_validator("role", mode="before")
    @classmethod
    def normalize_role(cls, value: str) -> ApiUserRole:
        return to_api_role(value)


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
    role: ApiUserRole
    is_active: bool
    is_onboarded: bool
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("role", mode="before")
    @classmethod
    def normalize_role(cls, value: str) -> ApiUserRole:
        return to_api_role(value)


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
