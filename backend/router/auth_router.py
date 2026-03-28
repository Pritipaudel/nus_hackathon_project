from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.repository.user_repository import UserRepository
from backend.schema.auth import (
    AuthResponse,
    LoginRequest,
    SignupRequest,
    TokenResponse,
    UserResponse,
)
from backend.services.auth_service import (
    authenticate_user,
    create_access_token,
    hash_password,
)

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    if repo.email_exists(body.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    user = repo.create(
        email=body.email,
        first_name=body.first_name,
        last_name=body.last_name,
        hashed_password=hash_password(body.password),
    )
    token = create_access_token(str(user.id))
    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(access_token=token),
        is_first_login=True,
    )


@auth_router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    user = repo.get_by_email(body.email)
    try:
        authenticate_user(user, body.password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc
    token = create_access_token(str(user.id))
    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(access_token=token),
        is_first_login=not user.is_onboarded,
    )


@auth_router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@auth_router.patch("/onboarding/complete", response_model=UserResponse)
def complete_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.is_onboarded:
        return UserResponse.model_validate(current_user)
    updated = UserRepository(db).complete_onboarding(str(current_user.id))
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.model_validate(updated)
