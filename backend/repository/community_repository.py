import uuid
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload, selectinload

from backend.models.community import (
    CommunityGroup,
    CommunityGroupInvite,
    CommunityGroupMembership,
    CommunityPost,
    CommunityPostFlag,
    CommunityPostMedia,
    CommunityPostReaction,
)


class CommunityRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_post(
        self,
        user_id: uuid.UUID,
        content: str,
        category: str,
        community_group_id: uuid.UUID | None = None,
    ) -> CommunityPost:
        post = CommunityPost(
            user_id=user_id,
            content=content,
            category=category,
            community_group_id=community_group_id,
        )
        self.db.add(post)
        self.db.commit()
        self.db.refresh(post)
        return post

    def create_group(
        self,
        name: str,
        group_type: str,
        value: str,
        description: str | None,
        created_by_user_id: uuid.UUID | None,
    ) -> CommunityGroup:
        group = CommunityGroup(
            name=name,
            group_type=group_type,
            value=value,
            description=description,
            created_by_user_id=created_by_user_id,
        )
        self.db.add(group)
        self.db.commit()
        self.db.refresh(group)
        return group

    def add_group_membership(
        self, user_id: uuid.UUID, community_group_id: uuid.UUID
    ) -> CommunityGroupMembership:
        row = CommunityGroupMembership(
            user_id=user_id, community_group_id=community_group_id
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    def remove_group_membership(
        self, user_id: uuid.UUID, community_group_id: uuid.UUID
    ) -> bool:
        q = self.db.query(CommunityGroupMembership).filter(
            CommunityGroupMembership.user_id == user_id,
            CommunityGroupMembership.community_group_id == community_group_id,
        )
        row = q.first()
        if row is None:
            return False
        self.db.delete(row)
        self.db.commit()
        return True

    def get_group_membership(
        self, user_id: uuid.UUID, community_group_id: uuid.UUID
    ) -> CommunityGroupMembership | None:
        return (
            self.db.query(CommunityGroupMembership)
            .filter(
                CommunityGroupMembership.user_id == user_id,
                CommunityGroupMembership.community_group_id == community_group_id,
            )
            .first()
        )

    def count_group_members(self, community_group_id: uuid.UUID) -> int:
        return (
            self.db.query(func.count(CommunityGroupMembership.id))
            .filter(
                CommunityGroupMembership.community_group_id == community_group_id
            )
            .scalar()
            or 0
        )

    def count_members_for_groups(
        self, group_ids: list[uuid.UUID]
    ) -> dict[uuid.UUID, int]:
        if not group_ids:
            return {}
        rows = (
            self.db.query(
                CommunityGroupMembership.community_group_id,
                func.count(CommunityGroupMembership.id),
            )
            .filter(CommunityGroupMembership.community_group_id.in_(group_ids))
            .group_by(CommunityGroupMembership.community_group_id)
            .all()
        )
        return {gid: int(c) for gid, c in rows}

    def list_my_community_groups(
        self, user_id: uuid.UUID
    ) -> list[tuple[CommunityGroup, CommunityGroupMembership]]:
        return (
            self.db.query(CommunityGroup, CommunityGroupMembership)
            .join(
                CommunityGroupMembership,
                CommunityGroup.id == CommunityGroupMembership.community_group_id,
            )
            .filter(CommunityGroupMembership.user_id == user_id)
            .order_by(CommunityGroupMembership.joined_at.desc())
            .all()
        )

    def list_groups_with_member_counts(
        self, group_type: str | None = None
    ) -> list[tuple[CommunityGroup, int]]:
        cnt = func.count(CommunityGroupMembership.id).label("mc")
        subq = (
            self.db.query(
                CommunityGroupMembership.community_group_id.label("gid"),
                cnt,
            )
            .group_by(CommunityGroupMembership.community_group_id)
            .subquery()
        )
        q = self.db.query(CommunityGroup, func.coalesce(subq.c.mc, 0)).outerjoin(
            subq, CommunityGroup.id == subq.c.gid
        )
        if group_type:
            q = q.filter(CommunityGroup.group_type == group_type)
        return q.order_by(CommunityGroup.created_at.desc()).all()

    def get_group(self, group_id: uuid.UUID) -> CommunityGroup | None:
        return (
            self.db.query(CommunityGroup).filter(CommunityGroup.id == group_id).first()
        )

    def get_group_by_type_and_value(
        self, group_type: str, value: str
    ) -> CommunityGroup | None:
        return (
            self.db.query(CommunityGroup)
            .filter(
                CommunityGroup.group_type == group_type, CommunityGroup.value == value
            )
            .first()
        )

    def list_groups(self, group_type: str | None = None) -> list[CommunityGroup]:
        query = self.db.query(CommunityGroup)
        if group_type:
            query = query.filter(CommunityGroup.group_type == group_type)
        return query.order_by(CommunityGroup.created_at.desc()).all()

    def add_media(
        self,
        post_id: uuid.UUID,
        media_type: str,
        object_key: str,
        media_url: str,
    ) -> CommunityPostMedia:
        media = CommunityPostMedia(
            post_id=post_id,
            media_type=media_type,
            object_key=object_key,
            media_url=media_url,
        )
        self.db.add(media)
        self.db.commit()
        self.db.refresh(media)
        return media

    def get_post(self, post_id: uuid.UUID) -> CommunityPost | None:
        return (
            self.db.query(CommunityPost)
            .options(
                joinedload(CommunityPost.media),
                joinedload(CommunityPost.community_group),
            )
            .filter(CommunityPost.id == post_id)
            .first()
        )

    def list_posts(
        self,
        category: str | None,
        community_group_id: uuid.UUID | None,
        group_type: str | None,
        group_value: str | None,
        user_id: uuid.UUID | None,
        page: int,
        limit: int,
    ) -> list[CommunityPost]:
        query = self.db.query(CommunityPost).options(
            joinedload(CommunityPost.media),
            joinedload(CommunityPost.community_group),
        )
        if category:
            query = query.filter(CommunityPost.category == category)
        if community_group_id:
            query = query.filter(CommunityPost.community_group_id == community_group_id)
        if user_id:
            query = query.filter(CommunityPost.user_id == user_id)
        if group_type or group_value:
            query = query.join(
                CommunityGroup, CommunityPost.community_group_id == CommunityGroup.id
            )
            if group_type:
                query = query.filter(CommunityGroup.group_type == group_type)
            if group_value:
                query = query.filter(CommunityGroup.value.ilike(group_value.strip()))
        return (
            query.order_by(CommunityPost.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

    def delete_post(self, post: CommunityPost) -> None:
        self.db.delete(post)
        self.db.commit()

    def upsert_reaction(
        self,
        post_id: uuid.UUID,
        user_id: uuid.UUID,
        reaction_type: str,
    ) -> CommunityPostReaction:
        reaction = (
            self.db.query(CommunityPostReaction)
            .filter(
                CommunityPostReaction.post_id == post_id,
                CommunityPostReaction.user_id == user_id,
            )
            .first()
        )
        if reaction is None:
            reaction = CommunityPostReaction(
                post_id=post_id,
                user_id=user_id,
                reaction_type=reaction_type,
            )
            self.db.add(reaction)
        else:
            reaction.reaction_type = reaction_type

        self.db.commit()
        self.db.refresh(reaction)
        return reaction

    def add_flag(
        self,
        post_id: uuid.UUID,
        user_id: uuid.UUID,
        reason: str,
    ) -> CommunityPostFlag:
        flag = (
            self.db.query(CommunityPostFlag)
            .filter(
                CommunityPostFlag.post_id == post_id,
                CommunityPostFlag.user_id == user_id,
            )
            .first()
        )
        if flag is not None:
            flag.reason = reason
        else:
            flag = CommunityPostFlag(post_id=post_id, user_id=user_id, reason=reason)
            self.db.add(flag)

        self.db.commit()
        self.db.refresh(flag)
        return flag

    def get_post_reaction_count(self, post_id: uuid.UUID) -> int:
        return (
            self.db.query(func.count(CommunityPostReaction.id))
            .filter(CommunityPostReaction.post_id == post_id)
            .scalar()
            or 0
        )

    def get_post_flag_count(self, post_id: uuid.UUID) -> int:
        return (
            self.db.query(func.count(CommunityPostFlag.id))
            .filter(CommunityPostFlag.post_id == post_id)
            .scalar()
            or 0
        )

    def list_trending_posts(self, limit: int = 20) -> list[tuple[CommunityPost, float]]:
        reaction_score = func.count(CommunityPostReaction.id) * 2
        flag_penalty = func.count(CommunityPostFlag.id) * 3
        trend_score = (reaction_score - flag_penalty).label("trend_score")

        rows = (
            self.db.query(CommunityPost, trend_score)
            .options(selectinload(CommunityPost.community_group))
            .outerjoin(
                CommunityPostReaction, CommunityPostReaction.post_id == CommunityPost.id
            )
            .outerjoin(CommunityPostFlag, CommunityPostFlag.post_id == CommunityPost.id)
            .group_by(CommunityPost.id)
            .order_by(trend_score.desc(), CommunityPost.created_at.desc())
            .limit(limit)
            .all()
        )
        return rows

    def create_group_invite_record(
        self,
        community_group_id: uuid.UUID,
        invited_by_user_id: uuid.UUID,
        token: str,
        expires_at: datetime,
    ) -> CommunityGroupInvite:
        row = CommunityGroupInvite(
            community_group_id=community_group_id,
            invited_by_user_id=invited_by_user_id,
            token=token,
            expires_at=expires_at,
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    def get_invite_by_token(self, token: str) -> CommunityGroupInvite | None:
        return (
            self.db.query(CommunityGroupInvite)
            .options(joinedload(CommunityGroupInvite.community_group))
            .filter(CommunityGroupInvite.token == token)
            .first()
        )
