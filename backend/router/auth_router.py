from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.repository.user_repository import UserRepository
from backend.schema.auth import (
    AuthResponse,
    LoginRequest,
    OnboardHealthWorkerRequest,
    OnboardHealthWorkerResponse,
    OnboardedHealthWorkerResponse,
    SignupRequest,
    TokenResponse,
    UserResponse,
    to_db_role,
)
from backend.services.auth_service import (
    authenticate_user,
    onboard_health_worker,
    create_access_token,
    hash_password,
)

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post(
    "/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED
)
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
        anonymous_username=body.anonymous_username,
        hashed_password=hash_password(body.password),
        role=to_db_role(body.role),
    )
    token = create_access_token(str(user.id), role=user.role)
    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(access_token=token),
        is_first_login=not user.is_onboarded,
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
    token = create_access_token(str(user.id), role=user.role)
    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(access_token=token),
        is_first_login=not user.is_onboarded,
    )


@auth_router.post("/token", response_model=TokenResponse)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)
    user = repo.get_by_email(form_data.username)
    try:
        authenticate_user(user, form_data.password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    token = create_access_token(str(user.id), role=user.role)
    return TokenResponse(access_token=token)


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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return UserResponse.model_validate(updated)


@auth_router.post(
    "/onboard-health-workers",
    response_model=OnboardHealthWorkerResponse,
)
def onboard_health_workers(
    body: OnboardHealthWorkerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updated_user, health_worker = onboard_health_worker(
        db=db,
        current_user=current_user,
        username=body.username,
        organization=body.organization,
        community_id=body.community_id,
    )
    token = create_access_token(str(updated_user.id), role=updated_user.role)
    return OnboardHealthWorkerResponse(
        user=UserResponse.model_validate(updated_user),
        health_worker=OnboardedHealthWorkerResponse(
            id=health_worker.id,
            username=health_worker.username,
            organization=health_worker.organization,
            community_id=health_worker.community_id,
            community_name=(
                health_worker.community_group.value
                if health_worker.community_group
                else None
            ),
            is_verified=health_worker.is_verified,
        ),
        tokens=TokenResponse(access_token=token),
    )
