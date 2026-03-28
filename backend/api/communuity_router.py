import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.repository.community_repository import CommunityRepository
from backend.schema.community import (
    ActionStatusResponse,
    CommunityCategory,
    CommunityGroupResponse,
    CommunityGroupType,
    CommunityPostResponse,
    CommunityTrendingPostResponse,
    CreateCommunityGroupRequest,
    CreatePostResponse,
    FlagPostRequest,
    PostMediaResponse,
    ReactPostRequest,
)
from backend.services.community_service import create_community_group, create_post
from backend.services.community_service import delete_post as delete_post_service

communuity_router = APIRouter(prefix="/community", tags=["community"])


def _post_to_response(repo: CommunityRepository, post) -> CommunityPostResponse:
    reaction_count = repo.get_post_reaction_count(post.id)
    flag_count = repo.get_post_flag_count(post.id)
    group = (
        CommunityGroupResponse.model_validate(post.community_group)
        if post.community_group
        else None
    )
    return CommunityPostResponse(
        id=post.id,
        user_id=post.user_id,
        username=f"anonymous-{str(post.user_id)[:8]}",
        content=post.content,
        category=CommunityCategory(post.category),
        community_group=group,
        is_verified=False,
        created_at=post.created_at,
        media_urls=[
            PostMediaResponse(url=media.media_url, media_type=media.media_type)
            for media in post.media
        ],
        reaction_count=reaction_count,
        flag_count=flag_count,
    )


@communuity_router.post(
    "/posts",
    response_model=CreatePostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a community post",
    description=(
        "Create a new post in the community feed. Supports optional media uploads "
        "(photos/videos) and optional tagging to a community group."
    ),
    response_description="Created post identifier",
    responses={
        201: {"description": "Post created"},
        401: {"description": "Authentication required"},
        404: {"description": "Community group not found"},
    },
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "required": ["content"],
                        "properties": {
                            "content": {"type": "string"},
                            "category": {"type": "string", "default": "GENERAL"},
                            "community_group_id": {
                                "type": "string",
                                "format": "uuid",
                                "nullable": True,
                            },
                            "files": {
                                "type": "array",
                                "items": {"type": "string", "format": "binary"},
                                "description": "Optional photo/video files for this post",
                            },
                        },
                    }
                }
            },
        }
    },
)
def create_community_post(
    content: str = Form(..., description="Post text content"),
    category: CommunityCategory = Form(
        default=CommunityCategory.GENERAL,
        description="Mental health category of the post",
    ),
    community_group_id: uuid.UUID | None = Form(
        default=None,
        description="Optional community group id to tag this post",
    ),
    files: list[UploadFile] = File(
        default=None,
        description="Optional photo/video files for this post",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = create_post(
        db=db,
        current_user=current_user,
        content=content,
        category=category.value,
        community_group_id=community_group_id,
        media_files=files,
    )
    return CreatePostResponse(post_id=post.id)


@communuity_router.post(
    "/groups",
    response_model=CommunityGroupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a community group",
    description=(
        "Create a new group for community segmentation (for example religion, "
        "ethnicity-caste, gender, race, or custom)."
    ),
    response_description="Created community group",
    responses={
        201: {"description": "Group created"},
        401: {"description": "Authentication required"},
        409: {"description": "Group with same type and value already exists"},
    },
)
def create_group(
    body: CreateCommunityGroupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = create_community_group(
        db=db,
        current_user=current_user,
        name=body.name,
        group_type=body.group_type.value,
        value=body.value,
        description=body.description,
    )
    return CommunityGroupResponse.model_validate(group)


@communuity_router.get("/groups", response_model=list[CommunityGroupResponse])
def list_groups(
    group_type: CommunityGroupType | None = Query(
        default=None,
        description="Optional filter by group type",
    ),
    db: Session = Depends(get_db),
):
    """List available community groups, optionally filtered by type."""
    groups = CommunityRepository(db).list_groups(
        group_type=group_type.value if group_type else None
    )
    return [CommunityGroupResponse.model_validate(group) for group in groups]


@communuity_router.get(
    "/posts",
    response_model=list[CommunityPostResponse],
    summary="List community posts",
    description=(
        "List community feed posts with optional filters by category and community "
        "group metadata."
    ),
    response_description="Paginated-style post list (controlled by page/limit)",
)
def list_community_posts(
    category: CommunityCategory | None = Query(
        default=None,
        description="Optional filter by post category",
    ),
    community_group_id: uuid.UUID | None = Query(
        default=None,
        description="Optional filter by exact community group id",
    ),
    group_type: CommunityGroupType | None = Query(
        default=None,
        description="Optional filter by community group type",
    ),
    group_value: str | None = Query(
        default=None,
        description="Optional filter by community group value",
    ),
    page: int = Query(default=1, ge=1, description="1-based page number"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    repo = CommunityRepository(db)
    posts = repo.list_posts(
        category=category.value if category else None,
        community_group_id=community_group_id,
        group_type=group_type.value if group_type else None,
        group_value=group_value,
        user_id=None,
        page=page,
        limit=limit,
    )
    return [_post_to_response(repo, post) for post in posts]


@communuity_router.get(
    "/users/{user_id}/posts",
    response_model=list[CommunityPostResponse],
    summary="List posts for a specific user",
    description=(
        "List posts authored by a specific user id, with the same optional filters "
        "available in the global feed endpoint."
    ),
    response_description="Filtered list of posts for the given user",
)
def list_user_posts(
    user_id: uuid.UUID,
    category: CommunityCategory | None = Query(
        default=None,
        description="Optional filter by post category",
    ),
    community_group_id: uuid.UUID | None = Query(
        default=None,
        description="Optional filter by exact community group id",
    ),
    group_type: CommunityGroupType | None = Query(
        default=None,
        description="Optional filter by community group type",
    ),
    group_value: str | None = Query(
        default=None,
        description="Optional filter by community group value",
    ),
    page: int = Query(default=1, ge=1, description="1-based page number"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    repo = CommunityRepository(db)
    posts = repo.list_posts(
        category=category.value if category else None,
        community_group_id=community_group_id,
        group_type=group_type.value if group_type else None,
        group_value=group_value,
        user_id=user_id,
        page=page,
        limit=limit,
    )
    return [_post_to_response(repo, post) for post in posts]


@communuity_router.get(
    "/posts/trending",
    response_model=list[CommunityTrendingPostResponse],
    summary="List trending posts",
    description="Returns posts ranked by internal trend score.",
    response_description="Trending post list with trend score",
)
def list_trending_posts(
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
        description="Maximum number of trending posts to return",
    ),
    db: Session = Depends(get_db),
):
    rows = CommunityRepository(db).list_trending_posts(limit=limit)
    return [
        CommunityTrendingPostResponse(
            id=post.id,
            content=post.content,
            trend_score=float(score),
        )
        for post, score in rows
    ]


@communuity_router.get(
    "/posts/{post_id}",
    response_model=CommunityPostResponse,
    summary="Get post by id",
    description="Fetch a single community post by its unique id.",
    response_description="Post details",
    responses={404: {"description": "Post not found"}},
)
def get_post_by_id(
    post_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    repo = CommunityRepository(db)
    post = repo.get_post(post_id)
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    return _post_to_response(repo, post)


@communuity_router.delete(
    "/posts/{post_id}",
    response_model=ActionStatusResponse,
    summary="Delete post by id",
    description="Delete a post. Only the post owner can delete their post.",
    response_description="Delete status",
    responses={
        401: {"description": "Authentication required"},
        403: {"description": "You are not the post owner"},
        404: {"description": "Post not found"},
    },
)
def delete_post_by_id(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_post_service(db=db, current_user=current_user, post_id=post_id)
    return ActionStatusResponse(status="deleted")


@communuity_router.post(
    "/posts/{post_id}/react",
    response_model=ActionStatusResponse,
    summary="React to a post",
    description=(
        "Add or update the current user's reaction on a post. One reaction per user "
        "is stored per post."
    ),
    response_description="Reaction operation status",
    responses={
        401: {"description": "Authentication required"},
        404: {"description": "Post not found"},
    },
)
def react_to_post(
    post_id: uuid.UUID,
    body: ReactPostRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = CommunityRepository(db)
    post = repo.get_post(post_id)
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )

    repo.upsert_reaction(
        post_id=post_id, user_id=current_user.id, reaction_type=body.reaction_type.value
    )
    return ActionStatusResponse(status="added")


@communuity_router.post(
    "/posts/{post_id}/flag",
    response_model=ActionStatusResponse,
    summary="Flag a post",
    description="Flag a post for moderation with a reason.",
    response_description="Flag operation status",
    responses={
        401: {"description": "Authentication required"},
        404: {"description": "Post not found"},
    },
)
def flag_post(
    post_id: uuid.UUID,
    body: FlagPostRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = CommunityRepository(db)
    post = repo.get_post(post_id)
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )

    repo.add_flag(post_id=post_id, user_id=current_user.id, reason=body.reason)
    return ActionStatusResponse(status="flagged")
