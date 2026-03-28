import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.schema.icbt import (
    EnrollICBTProgramRequest,
    EnrollICBTProgramResponse,
    ICBTProgramResponse,
    MyICBTProgramResponse,
    SetICBTProgramCommunitiesRequest,
    SetICBTProgramCommunitiesResponse,
    UpdateICBTProgressRequest,
    UpdateICBTProgressResponse,
)
from backend.services.icbt_service import (
    enroll_user_in_program,
    list_icbt_programs_with_community_metadata,
    list_user_icbt_programs,
    set_program_communities,
    update_user_icbt_progress,
)

icbt_router = APIRouter(prefix="/icbt", tags=["ICBT"])


@icbt_router.get(
    "/programs",
    response_model=list[ICBTProgramResponse],
    summary="List ICBT programs (legacy alias)",
    description=(
        "Backward-compatible alias for `/icbt/list`. Returns all iCBT programs "
        "with per-community usage/completion metadata."
    ),
    response_description="List of iCBT programs",
)
def list_icbt_programs(db: Session = Depends(get_db)):
    """
    Backward-compatible endpoint for listing ICBT programs.
    """
    return list_icbt_programs_with_community_metadata(db=db)


@icbt_router.get(
    "/list",
    response_model=list[ICBTProgramResponse],
    summary="List ICBT programs",
    description=(
        "Returns iCBT programs with community-level metadata. "
        "Optionally filter by a specific `community_id`."
    ),
    response_description="Filtered list of iCBT programs",
    responses={
        404: {"description": "Community not found"},
    },
)
def list_icbt_programs_by_community(
    community_id: uuid.UUID | None = Query(
        default=None,
        description="Optional community UUID filter",
    ),
    db: Session = Depends(get_db),
):
    """
    List ICBT programs, optionally filtered by community.
    """
    return list_icbt_programs_with_community_metadata(
        db=db,
        community_id=community_id,
    )


@icbt_router.post(
    "/enroll",
    response_model=EnrollICBTProgramResponse,
    status_code=status.HTTP_200_OK,
    summary="Enroll current user in an ICBT program",
    description=(
        "Creates an enrollment for the authenticated user. If `community_id` is "
        "provided, it must be mapped to the selected program."
    ),
    response_description="Enrollment details",
    responses={
        400: {"description": "Program is not mapped to provided community"},
        401: {"description": "Authentication required"},
        404: {"description": "User, program, or community not found"},
        409: {"description": "User already enrolled in this program"},
    },
)
def enroll_icbt_program(
    body: EnrollICBTProgramRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enrollment = enroll_user_in_program(
        db=db,
        user_id=current_user.id,
        program_id=body.program_id,
        community_id=body.community_id,
    )
    return EnrollICBTProgramResponse(
        enrollment_id=enrollment.id,
        status=enrollment.status,
        program_id=enrollment.program_id,
        progress_percent=enrollment.progress_percent,
        community_id=enrollment.community_group_id,
    )


@icbt_router.put(
    "/programs/{program_id}/communities",
    response_model=SetICBTProgramCommunitiesResponse,
    summary="Set focused communities for a program",
    description=(
        "Replaces the complete set of communities targeted by a program. "
        "Use this to configure multi-community targeting for iCBT programs."
    ),
    response_description="Program-community mapping after update",
    responses={
        401: {"description": "Authentication required"},
        404: {"description": "Program or one/more communities not found"},
        422: {"description": "Invalid request body"},
    },
)
def set_icbt_program_communities(
    program_id: uuid.UUID,
    body: SetICBTProgramCommunitiesRequest,
    _current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assigned_ids = set_program_communities(
        db=db,
        program_id=program_id,
        community_ids=body.community_ids,
    )
    return SetICBTProgramCommunitiesResponse(
        program_id=program_id,
        community_ids=assigned_ids,
    )


@icbt_router.get(
    "/my-programs",
    response_model=list[MyICBTProgramResponse],
    summary="List current user's ICBT programs",
    description=(
        "Returns authenticated user's enrolled programs with personal progress, "
        "status, and timestamps."
    ),
    response_description="Current user's enrolled ICBT programs",
    responses={
        401: {"description": "Authentication required"},
    },
)
def list_my_icbt_programs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_user_icbt_programs(db=db, user_id=current_user.id)


@icbt_router.patch(
    "/programs/{program_id}/progress",
    response_model=UpdateICBTProgressResponse,
    summary="Update current user's program progress",
    description=(
        "Updates progress for the authenticated user's enrollment in the given "
        "program. Valid range is 0 to 100. Progress at 100 marks completion."
    ),
    response_description="Updated enrollment progress",
    responses={
        401: {"description": "Authentication required"},
        404: {"description": "Enrollment not found for user and program"},
        422: {"description": "Invalid progress value"},
    },
)
def update_icbt_program_progress(
    program_id: uuid.UUID,
    body: UpdateICBTProgressRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updated = update_user_icbt_progress(
        db=db,
        user_id=current_user.id,
        program_id=program_id,
        progress_percent=body.progress_percent,
    )
    return UpdateICBTProgressResponse(
        enrollment_id=updated.id,
        program_id=updated.program_id,
        status=updated.status,
        progress_percent=updated.progress_percent,
        completed_at=updated.completed_at,
    )
