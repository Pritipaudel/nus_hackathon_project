import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.models.icbt import UserICBTProgramProgress
from backend.repository.icbt_repository import ICBTRepository
from backend.repository.user_repository import UserRepository
from backend.schema.icbt import (
    ICBTCommunityMetadataResponse,
    ICBTProgramResponse,
    MyICBTProgramResponse,
)


def list_icbt_programs_with_community_metadata(
    db: Session,
    community_id: uuid.UUID | None = None,
) -> list[ICBTProgramResponse]:
    repo = ICBTRepository(db)

    if community_id is not None and repo.get_community(community_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community not found",
        )

    programs = repo.list_programs(community_id=community_id)
    program_ids = [program.id for program in programs]

    program_communities = repo.list_program_communities(
        program_ids=program_ids,
        community_id=community_id,
    )
    stats = repo.get_program_community_stats(
        program_ids=program_ids,
        community_id=community_id,
    )

    communities_by_program: dict[uuid.UUID, list[ICBTCommunityMetadataResponse]] = {}
    for program_id, community in program_communities:
        stat_key = (program_id, community.id)
        stat_value = stats.get(
            stat_key,
            {
                "total_users_using": 0,
                "total_users_completed": 0,
                "total_users_in_progress": 0,
            },
        )
        communities_by_program.setdefault(program_id, []).append(
            ICBTCommunityMetadataResponse(
                community_id=community.id,
                community_name=community.name,
                community_group_type=community.group_type,
                total_users_using=stat_value["total_users_using"],
                total_users_completed=stat_value["total_users_completed"],
                total_users_in_progress=stat_value["total_users_in_progress"],
            )
        )

    return [
        ICBTProgramResponse(
            id=program.id,
            title=program.title,
            description=program.description,
            difficulty_level=program.difficulty_level,
            duration_days=program.duration_days,
            url=program.url,
            community_metadata=communities_by_program.get(program.id, []),
        )
        for program in programs
    ]


def enroll_user_in_program(
    db: Session,
    user_id: uuid.UUID,
    program_id: uuid.UUID,
    community_id: uuid.UUID | None,
) -> UserICBTProgramProgress:
    if UserRepository(db).get_by_id(str(user_id)) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    repo = ICBTRepository(db)
    program = repo.get_program(program_id)
    if program is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ICBT program not found",
        )

    if repo.get_user_progress(user_id=user_id, program_id=program_id) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already enrolled in this ICBT program",
        )

    if community_id is not None:
        if repo.get_community(community_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Community not found",
            )

        if (
            repo.get_program_community_link(
                program_id=program_id, community_id=community_id
            )
            is None
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This ICBT program is not mapped to the provided community",
            )

    return repo.create_user_progress(
        user_id=user_id,
        program_id=program_id,
        community_id=community_id,
    )


def set_program_communities(
    db: Session,
    program_id: uuid.UUID,
    community_ids: list[uuid.UUID],
) -> list[uuid.UUID]:
    repo = ICBTRepository(db)
    if repo.get_program(program_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ICBT program not found",
        )

    communities = repo.list_communities_by_ids(community_ids=community_ids)
    found_ids = {community.id for community in communities}
    missing_ids = [
        community_id for community_id in community_ids if community_id not in found_ids
    ]
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more communities were not found",
        )

    mappings = repo.replace_program_communities(
        program_id=program_id,
        community_ids=community_ids,
    )
    return [mapping.community_group_id for mapping in mappings]


def update_user_icbt_progress(
    db: Session,
    user_id: uuid.UUID,
    program_id: uuid.UUID,
    progress_percent: int,
) -> UserICBTProgramProgress:
    repo = ICBTRepository(db)
    enrollment = repo.get_user_progress(user_id=user_id, program_id=program_id)
    if enrollment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found for this user and program",
        )

    return repo.update_progress(
        enrollment=enrollment, progress_percent=progress_percent
    )


def list_user_icbt_programs(
    db: Session,
    user_id: uuid.UUID,
) -> list[MyICBTProgramResponse]:
    enrollments = ICBTRepository(db).list_user_enrollments(user_id=user_id)
    return [
        MyICBTProgramResponse(
            enrollment_id=row.id,
            program_id=row.program_id,
            title=row.program.title,
            description=row.program.description,
            difficulty_level=row.program.difficulty_level,
            duration_days=row.program.duration_days,
            url=row.program.url,
            status=row.status,
            progress_percent=row.progress_percent,
            community_id=row.community_group_id,
            community_name=row.community_group.name if row.community_group else None,
            started_at=row.started_at,
            last_activity_at=row.last_activity_at,
            completed_at=row.completed_at,
        )
        for row in enrollments
    ]
