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
from backend.core.dependencies import get_current_user, get_optional_current_user
from backend.models.user import User
from backend.repository.community_repository import CommunityRepository
from backend.schema.community import (
    AcceptCommunityInviteRequest,
    ActionStatusResponse,
    CommunityCategory,
    CommunityGroupResponse,
    CommunityGroupType,
    CommunityInviteCreatedResponse,
    CommunityInvitePreviewResponse,
    CommunityPostResponse,
    CommunityTrendingPostResponse,
    CreateCommunityGroupRequest,
    CreatePostResponse,
    FlagPostRequest,
    MyCommunityGroupResponse,
    PostMediaResponse,
    ReactionType,
    ReactPostRequest,
)
from backend.services.community_service import (
    accept_community_invite,
    create_community_group,
    create_community_group_invite,
    create_post,
    join_community_group,
    leave_community_group,
    list_my_community_groups,
    preview_community_invite,
)
from backend.services.community_service import delete_post as delete_post_service

communuity_router = APIRouter(prefix="/community", tags=["community"])


def _post_display_username(post) -> str:
    """Prefer the author's stored anonymous_username; otherwise a stable anonymous handle."""
    author = getattr(post, "user", None)
    if author is not None:
        name = (author.anonymous_username or "").strip()
        if name:
            return name
    uid_hex = str(post.user_id).replace("-", "")
    return f"anonymous-{uid_hex[:8]}"


def _post_to_response(
    repo: CommunityRepository,
    post,
    viewer: User | None = None,
) -> CommunityPostResponse:
    reaction_count = repo.get_post_reaction_count(post.id)
    flag_count = repo.get_post_flag_count(post.id)
    group = (
        CommunityGroupResponse.model_validate(post.community_group)
        if post.community_group
        else None
    )
    my_reaction: ReactionType | None = None
    if viewer is not None:
        rt = repo.get_user_reaction_for_post(post.id, viewer.id)
        if rt:
            try:
                my_reaction = ReactionType(rt)
            except ValueError:
                my_reaction = None
    return CommunityPostResponse(
        id=post.id,
        user_id=post.user_id,
        username=_post_display_username(post),
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
        my_reaction=my_reaction,
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
    repo = CommunityRepository(db)
    member_count = repo.count_group_members(group.id)
    base = CommunityGroupResponse.model_validate(group)
    return base.model_copy(update={"member_count": member_count})


@communuity_router.get(
    "/groups/mine",
    response_model=list[MyCommunityGroupResponse],
    summary="List community groups I joined or created",
)
def list_my_community_group_memberships(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_my_community_groups(db=db, current_user=current_user)


@communuity_router.post(
    "/groups/{group_id}/join",
    response_model=MyCommunityGroupResponse,
    summary="Join a community group",
)
def join_group(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return join_community_group(db=db, current_user=current_user, group_id=group_id)


@communuity_router.delete(
    "/groups/{group_id}/leave",
    response_model=ActionStatusResponse,
    summary="Leave a community group",
)
def leave_group(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    leave_community_group(db=db, current_user=current_user, group_id=group_id)
    return ActionStatusResponse(status="left")


@communuity_router.post(
    "/groups/{group_id}/invites",
    response_model=CommunityInviteCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an invite link for a community group",
    description=(
        "Members can generate a shareable link. The invite path includes `token` and "
        "`user_id` (inviter) query parameters for the join page."
    ),
)
def create_group_invite(
    group_id: uuid.UUID,
    expires_in_days: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_community_group_invite(
        db=db,
        current_user=current_user,
        group_id=group_id,
        expires_in_days=expires_in_days,
    )


@communuity_router.get(
    "/invites/preview",
    response_model=CommunityInvitePreviewResponse,
    summary="Preview a community invite (no auth)",
)
def get_invite_preview(
    token: str = Query(..., min_length=8, max_length=120),
    db: Session = Depends(get_db),
):
    return preview_community_invite(db=db, token=token)


@communuity_router.post(
    "/invites/accept",
    response_model=MyCommunityGroupResponse,
    summary="Accept invite and join group",
)
def accept_invite(
    body: AcceptCommunityInviteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return accept_community_invite(db=db, current_user=current_user, token=body.token)


@communuity_router.get("/groups", response_model=list[CommunityGroupResponse])
def list_groups(
    group_type: CommunityGroupType | None = Query(
        default=None,
        description="Optional filter by group type",
    ),
    db: Session = Depends(get_db),
):
    """List available community groups, optionally filtered by type."""
    repo = CommunityRepository(db)
    rows = repo.list_groups_with_member_counts(
        group_type=group_type.value if group_type else None
    )
    return [
        CommunityGroupResponse(
            id=g.id,
            name=g.name,
            group_type=CommunityGroupType(g.group_type),
            value=g.value,
            description=g.description,
            created_by_user_id=g.created_by_user_id,
            created_at=g.created_at,
            member_count=int(mc),
        )
        for g, mc in rows
    ]


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
    viewer: User | None = Depends(get_optional_current_user),
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
    return [_post_to_response(repo, post, viewer) for post in posts]


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
    viewer: User | None = Depends(get_optional_current_user),
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
    return [_post_to_response(repo, post, viewer) for post in posts]


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
    viewer: User | None = Depends(get_optional_current_user),
):
    repo = CommunityRepository(db)
    post = repo.get_post(post_id)
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    return _post_to_response(repo, post, viewer)


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
