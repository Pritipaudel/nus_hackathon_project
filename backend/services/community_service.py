import io
import json
import mimetypes
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode

from fastapi import HTTPException, UploadFile, status
from minio.error import S3Error
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.core.minio_client import MINIO_ENDPOINT, minio_client
from backend.models.community import CommunityPost, MediaType
from backend.models.user import User
from backend.repository.community_repository import CommunityRepository
from backend.repository.user_repository import UserRepository
from backend.schema.community import (
    CommunityGroupType,
    CommunityInviteCreatedResponse,
    CommunityInvitePreviewResponse,
    MyCommunityGroupResponse,
)

COMMUNITY_MEDIA_BUCKET = "community-media"


def _public_read_policy(bucket_name: str) -> str:
    return json.dumps(
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket_name}/*"],
                }
            ],
        }
    )


def _ensure_bucket_exists(bucket_name: str) -> None:
    if not minio_client.bucket_exists(bucket_name):
        minio_client.make_bucket(bucket_name)
    # Keep media publicly readable so URLs can be loaded directly without presigned links.
    minio_client.set_bucket_policy(bucket_name, _public_read_policy(bucket_name))


def _detect_media_type(content_type: str | None, filename: str | None) -> MediaType:
    resolved_type = content_type
    if not resolved_type and filename:
        resolved_type, _ = mimetypes.guess_type(filename)

    if not resolved_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to determine uploaded media type",
        )

    if resolved_type.startswith("image/"):
        return MediaType.PHOTO
    if resolved_type.startswith("video/"):
        return MediaType.VIDEO

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Only image and video files are allowed",
    )


def _build_object_name(
    user_id: uuid.UUID,
    filename: str | None,
    content_type: str | None,
) -> str:
    suffix = Path(filename or "").suffix
    if not suffix and content_type:
        suffix = mimetypes.guess_extension(content_type) or ""
    if not suffix:
        suffix = ".bin"
    return f"{user_id}/{uuid.uuid4()}{suffix}"


def _public_object_url(bucket_name: str, object_name: str) -> str:
    return f"http://{MINIO_ENDPOINT}/{bucket_name}/{object_name}"


def _upload_media_to_minio(
    media_file: UploadFile,
    user_id: uuid.UUID,
) -> tuple[str, str, str]:
    media_type = _detect_media_type(media_file.content_type, media_file.filename)
    object_name = _build_object_name(
        user_id, media_file.filename, media_file.content_type
    )

    file_bytes = media_file.file.read()
    byte_stream = io.BytesIO(file_bytes)

    _ensure_bucket_exists(COMMUNITY_MEDIA_BUCKET)
    try:
        minio_client.put_object(
            COMMUNITY_MEDIA_BUCKET,
            object_name,
            byte_stream,
            length=len(file_bytes),
            content_type=media_file.content_type or "application/octet-stream",
        )
    except S3Error as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to upload media",
        ) from exc

    return (
        media_type.value,
        object_name,
        _public_object_url(COMMUNITY_MEDIA_BUCKET, object_name),
    )


def create_post(
    db: Session,
    current_user: User,
    content: str,
    category: str,
    community_group_id: uuid.UUID | None = None,
    media_files: list[UploadFile] | None = None,
) -> CommunityPost:
    user = UserRepository(db).get_by_id(str(current_user.id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    repo = CommunityRepository(db)
    if community_group_id is not None and repo.get_group(community_group_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community group not found",
        )

    post = repo.create_post(
        user_id=current_user.id,
        content=content,
        category=category,
        community_group_id=community_group_id,
    )

    for media_file in media_files or []:
        media_type, object_key, media_url = _upload_media_to_minio(
            media_file,
            current_user.id,
        )
        repo.add_media(
            post_id=post.id,
            media_type=media_type,
            object_key=object_key,
            media_url=media_url,
        )

    saved_post = repo.get_post(post.id)
    if saved_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )
    return saved_post


def create_community_group(
    db: Session,
    current_user: User,
    name: str,
    group_type: str,
    value: str,
    description: str | None,
):
    repo = CommunityRepository(db)
    normalized_value = value.strip()
    if repo.get_group_by_type_and_value(group_type=group_type, value=normalized_value):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Community group with this type and value already exists",
        )
    group = repo.create_group(
        name=name.strip(),
        group_type=group_type,
        value=normalized_value,
        description=description.strip() if description else None,
        created_by_user_id=current_user.id,
    )
    if repo.get_group_membership(current_user.id, group.id) is None:
        repo.add_group_membership(current_user.id, group.id)
    return group


def join_community_group(
    db: Session,
    current_user: User,
    group_id: uuid.UUID,
):
    repo = CommunityRepository(db)
    group = repo.get_group(group_id)
    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community group not found",
        )
    existing = repo.get_group_membership(current_user.id, group_id)
    if existing is None:
        repo.add_group_membership(current_user.id, group_id)
    member_count = repo.count_group_members(group_id)
    is_creator = group.created_by_user_id == current_user.id
    mship = repo.get_group_membership(current_user.id, group_id)
    assert mship is not None
    return MyCommunityGroupResponse(
        id=group.id,
        name=group.name,
        group_type=CommunityGroupType(group.group_type),
        value=group.value,
        description=group.description,
        created_by_user_id=group.created_by_user_id,
        created_at=group.created_at,
        member_count=member_count,
        is_creator=is_creator,
        joined_at=mship.joined_at,
    )


def leave_community_group(
    db: Session,
    current_user: User,
    group_id: uuid.UUID,
) -> None:
    repo = CommunityRepository(db)
    if repo.get_group(group_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community group not found",
        )
    if not repo.remove_group_membership(current_user.id, group_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not a member of this group",
        )


def list_my_community_groups(
    db: Session,
    current_user: User,
):
    repo = CommunityRepository(db)
    rows = repo.list_my_community_groups(current_user.id)
    if not rows:
        return []
    group_ids = [g.id for g, _ in rows]
    count_map = repo.count_members_for_groups(group_ids)

    out: list[MyCommunityGroupResponse] = []
    for group, mship in rows:
        mc = count_map.get(group.id, 0)
        out.append(
            MyCommunityGroupResponse(
                id=group.id,
                name=group.name,
                group_type=CommunityGroupType(group.group_type),
                value=group.value,
                description=group.description,
                created_by_user_id=group.created_by_user_id,
                created_at=group.created_at,
                member_count=mc,
                is_creator=group.created_by_user_id == current_user.id,
                joined_at=mship.joined_at,
            )
        )
    return out


def create_community_group_invite(
    db: Session,
    current_user: User,
    group_id: uuid.UUID,
    expires_in_days: int,
) -> CommunityInviteCreatedResponse:
    repo = CommunityRepository(db)
    group = repo.get_group(group_id)
    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community group not found",
        )
    if repo.get_group_membership(current_user.id, group_id) is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member of this group to create an invite link",
        )

    expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)
    last_error: Exception | None = None
    for _ in range(8):
        token = secrets.token_urlsafe(32)
        try:
            repo.create_group_invite_record(
                community_group_id=group_id,
                invited_by_user_id=current_user.id,
                token=token,
                expires_at=expires_at,
            )
            invite_path = (
                "/join-group?"
                + urlencode({"token": token, "user_id": str(current_user.id)})
            )
            return CommunityInviteCreatedResponse(
                token=token,
                group_id=group_id,
                invited_by_user_id=current_user.id,
                expires_at=expires_at,
                invite_path=invite_path,
            )
        except IntegrityError as exc:
            last_error = exc
            db.rollback()
            continue

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Could not generate invite; try again",
    ) from last_error


def preview_community_invite(db: Session, token: str) -> CommunityInvitePreviewResponse:
    from backend.repository.user_repository import UserRepository

    raw = token.strip()
    if not raw:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invite",
        )
    repo = CommunityRepository(db)
    inv = repo.get_invite_by_token(raw)
    if inv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired invite",
        )
    if datetime.now(timezone.utc) > inv.expires_at:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This invite has expired",
        )
    group = inv.community_group
    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community group not found",
        )

    inviter_display: str | None = None
    if inv.invited_by_user_id is not None:
        u = UserRepository(db).get_by_id(str(inv.invited_by_user_id))
        if u is not None:
            inviter_display = f"{u.first_name} {u.last_name}".strip() or (
                u.anonymous_username or u.email
            )

    return CommunityInvitePreviewResponse(
        group_id=group.id,
        group_name=group.name,
        expires_at=inv.expires_at,
        invited_by_user_id=inv.invited_by_user_id,
        inviter_display_name=inviter_display,
    )


def accept_community_invite(
    db: Session,
    current_user: User,
    token: str,
) -> MyCommunityGroupResponse:
    raw = token.strip()
    if not raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="token is required",
        )
    repo = CommunityRepository(db)
    inv = repo.get_invite_by_token(raw)
    if inv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired invite",
        )
    if datetime.now(timezone.utc) > inv.expires_at:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This invite has expired",
        )
    return join_community_group(db, current_user, inv.community_group_id)


def delete_post(
    db: Session,
    current_user: User,
    post_id: uuid.UUID,
) -> None:
    repo = CommunityRepository(db)
    post = repo.get_post(post_id)
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own posts",
        )

    # Remove media objects first; keep delete robust even if one object is missing.
    for media in post.media:
        try:
            minio_client.remove_object(COMMUNITY_MEDIA_BUCKET, media.object_key)
        except S3Error:
            continue

    repo.delete_post(post)
