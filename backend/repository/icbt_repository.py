import uuid
from datetime import datetime, timezone

from sqlalchemy import and_, case, distinct, func
from sqlalchemy.orm import Session, joinedload

from backend.models.community import CommunityGroup
from backend.models.icbt import (
    ICBTProgram,
    ICBTProgramCommunity,
    ICBTProgramStatus,
    UserICBTProgramProgress,
)


class ICBTRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_program(self, program_id: uuid.UUID) -> ICBTProgram | None:
        return self.db.query(ICBTProgram).filter(ICBTProgram.id == program_id).first()

    def get_community(self, community_id: uuid.UUID) -> CommunityGroup | None:
        return (
            self.db.query(CommunityGroup)
            .filter(CommunityGroup.id == community_id)
            .first()
        )

    def list_communities_by_ids(
        self,
        community_ids: list[uuid.UUID],
    ) -> list[CommunityGroup]:
        if not community_ids:
            return []
        return (
            self.db.query(CommunityGroup)
            .filter(CommunityGroup.id.in_(community_ids))
            .all()
        )

    def get_program_community_link(
        self,
        program_id: uuid.UUID,
        community_id: uuid.UUID,
    ) -> ICBTProgramCommunity | None:
        return (
            self.db.query(ICBTProgramCommunity)
            .filter(
                ICBTProgramCommunity.program_id == program_id,
                ICBTProgramCommunity.community_group_id == community_id,
            )
            .first()
        )

    def list_programs(self, community_id: uuid.UUID | None = None) -> list[ICBTProgram]:
        query = self.db.query(ICBTProgram)
        if community_id is not None:
            query = query.join(
                ICBTProgramCommunity,
                ICBTProgramCommunity.program_id == ICBTProgram.id,
            ).filter(ICBTProgramCommunity.community_group_id == community_id)

        return query.order_by(ICBTProgram.title.asc()).all()

    def replace_program_communities(
        self,
        program_id: uuid.UUID,
        community_ids: list[uuid.UUID],
    ) -> list[ICBTProgramCommunity]:
        self.db.query(ICBTProgramCommunity).filter(
            ICBTProgramCommunity.program_id == program_id
        ).delete(synchronize_session=False)

        mappings: list[ICBTProgramCommunity] = []
        unique_community_ids = list(dict.fromkeys(community_ids))
        for community_id in unique_community_ids:
            mapping = ICBTProgramCommunity(
                program_id=program_id,
                community_group_id=community_id,
            )
            self.db.add(mapping)
            mappings.append(mapping)

        self.db.commit()
        for mapping in mappings:
            self.db.refresh(mapping)
        return mappings

    def list_program_communities(
        self,
        program_ids: list[uuid.UUID],
        community_id: uuid.UUID | None = None,
    ) -> list[tuple[uuid.UUID, CommunityGroup]]:
        if not program_ids:
            return []

        query = (
            self.db.query(ICBTProgramCommunity.program_id, CommunityGroup)
            .join(
                CommunityGroup,
                CommunityGroup.id == ICBTProgramCommunity.community_group_id,
            )
            .filter(ICBTProgramCommunity.program_id.in_(program_ids))
        )
        if community_id is not None:
            query = query.filter(
                ICBTProgramCommunity.community_group_id == community_id
            )

        return query.order_by(CommunityGroup.value.asc()).all()

    def get_program_community_stats(
        self,
        program_ids: list[uuid.UUID],
        community_id: uuid.UUID | None = None,
    ) -> dict[tuple[uuid.UUID, uuid.UUID], dict[str, int]]:
        if not program_ids:
            return {}

        complete_clause = UserICBTProgramProgress.status == ICBTProgramStatus.COMPLETED

        filters = [UserICBTProgramProgress.program_id.in_(program_ids)]
        if community_id is not None:
            filters.append(UserICBTProgramProgress.community_group_id == community_id)

        rows = (
            self.db.query(
                UserICBTProgramProgress.program_id,
                UserICBTProgramProgress.community_group_id,
                func.count(distinct(UserICBTProgramProgress.user_id)).label(
                    "total_using"
                ),
                func.count(
                    distinct(
                        case(
                            (complete_clause, UserICBTProgramProgress.user_id),
                            else_=None,
                        )
                    )
                ).label("total_completed"),
            )
            .filter(and_(*filters))
            .group_by(
                UserICBTProgramProgress.program_id,
                UserICBTProgramProgress.community_group_id,
            )
            .all()
        )

        stats: dict[tuple[uuid.UUID, uuid.UUID], dict[str, int]] = {}
        for program_id_value, community_id_value, total_using, total_completed in rows:
            if community_id_value is None:
                continue

            total_using_int = int(total_using or 0)
            total_completed_int = int(total_completed or 0)
            stats[(program_id_value, community_id_value)] = {
                "total_users_using": total_using_int,
                "total_users_completed": total_completed_int,
                "total_users_in_progress": max(
                    total_using_int - total_completed_int,
                    0,
                ),
            }

        return stats

    def get_user_progress(
        self,
        user_id: uuid.UUID,
        program_id: uuid.UUID,
    ) -> UserICBTProgramProgress | None:
        return (
            self.db.query(UserICBTProgramProgress)
            .filter(
                UserICBTProgramProgress.user_id == user_id,
                UserICBTProgramProgress.program_id == program_id,
            )
            .first()
        )

    def create_user_progress(
        self,
        user_id: uuid.UUID,
        program_id: uuid.UUID,
        community_id: uuid.UUID | None,
    ) -> UserICBTProgramProgress:
        enrollment = UserICBTProgramProgress(
            user_id=user_id,
            program_id=program_id,
            community_group_id=community_id,
            progress_percent=0,
            status=ICBTProgramStatus.ACTIVE,
        )
        self.db.add(enrollment)
        self.db.commit()
        self.db.refresh(enrollment)
        return enrollment

    def update_progress(
        self,
        enrollment: UserICBTProgramProgress,
        progress_percent: int,
    ) -> UserICBTProgramProgress:
        now = datetime.now(timezone.utc)
        enrollment.progress_percent = progress_percent
        enrollment.last_activity_at = now

        if progress_percent >= 100:
            enrollment.status = ICBTProgramStatus.COMPLETED
            if enrollment.completed_at is None:
                enrollment.completed_at = now
        else:
            enrollment.status = ICBTProgramStatus.ACTIVE
            enrollment.completed_at = None

        self.db.commit()
        self.db.refresh(enrollment)
        return enrollment

    def list_user_enrollments(
        self, user_id: uuid.UUID
    ) -> list[UserICBTProgramProgress]:
        return (
            self.db.query(UserICBTProgramProgress)
            .options(
                joinedload(UserICBTProgramProgress.program),
                joinedload(UserICBTProgramProgress.community_group),
            )
            .filter(UserICBTProgramProgress.user_id == user_id)
            .order_by(UserICBTProgramProgress.started_at.desc())
            .all()
        )
