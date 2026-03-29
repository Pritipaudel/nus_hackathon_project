"""Seed meetings into the database.

Run from project root:
    uv run python scripts/seed_meetings.py

Note: Requires users and health workers to be seeded first.
"""

from __future__ import annotations

import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from backend.core.database import SessionLocal
import backend.models.community  # noqa: F401
from backend.models.health_worker import HealthWorker, Meeting, MeetingStatus
from backend.models.user import User

_NOW = datetime.now(timezone.utc)


def _future(days: int, hour: int, minute: int = 0) -> datetime:
    return (_NOW + timedelta(days=days)).replace(
        hour=hour, minute=minute, second=0, microsecond=0
    )


def _past(days: int, hour: int, minute: int = 0) -> datetime:
    return (_NOW - timedelta(days=days)).replace(
        hour=hour, minute=minute, second=0, microsecond=0
    )


@dataclass(frozen=True)
class SeedMeeting:
    user_email: str
    health_worker_username: str
    scheduled_at: datetime
    meeting_link: str
    status: str


SEED_MEETINGS: list[SeedMeeting] = [
    # --- Upcoming (SCHEDULED) ---
    SeedMeeting(
        user_email="aarav.budhathoki@gmail.com",
        health_worker_username="dr_priya_shrestha",
        scheduled_at=_future(3, 10),
        meeting_link="https://meet.google.com/npl-aarav-priya-001",
        status=MeetingStatus.SCHEDULED,
    ),
    SeedMeeting(
        user_email="sita.thapa@gmail.com",
        health_worker_username="dr_sunita_poudel",
        scheduled_at=_future(5, 14, 30),
        meeting_link="https://meet.google.com/npl-sita-sunita-001",
        status=MeetingStatus.SCHEDULED,
    ),
    SeedMeeting(
        user_email="bikash.rai@gmail.com",
        health_worker_username="dr_nabin_regmi",
        scheduled_at=_future(7, 11),
        meeting_link="https://meet.google.com/npl-bikash-nabin-001",
        status=MeetingStatus.SCHEDULED,
    ),
    SeedMeeting(
        user_email="puja.gurung@gmail.com",
        health_worker_username="dr_kabita_joshi",
        scheduled_at=_future(2, 15),
        meeting_link="https://meet.google.com/npl-puja-kabita-001",
        status=MeetingStatus.SCHEDULED,
    ),
    SeedMeeting(
        user_email="rohan.tamang@gmail.com",
        health_worker_username="dr_rajan_acharya",
        scheduled_at=_future(10, 9, 30),
        meeting_link="https://meet.google.com/npl-rohan-rajan-001",
        status=MeetingStatus.SCHEDULED,
    ),
    SeedMeeting(
        user_email="anita.magar@gmail.com",
        health_worker_username="mr_dipak_tamang",
        scheduled_at=_future(4, 13),
        meeting_link="https://meet.google.com/npl-anita-dipak-001",
        status=MeetingStatus.SCHEDULED,
    ),
    SeedMeeting(
        user_email="suresh.bhandari@gmail.com",
        health_worker_username="dr_priya_shrestha",
        scheduled_at=_future(6, 10, 30),
        meeting_link="https://meet.google.com/npl-suresh-priya-001",
        status=MeetingStatus.SCHEDULED,
    ),
    SeedMeeting(
        user_email="manisha.manandhar@gmail.com",
        health_worker_username="dr_kabita_joshi",
        scheduled_at=_future(1, 16),
        meeting_link="https://meet.google.com/npl-manisha-kabita-001",
        status=MeetingStatus.SCHEDULED,
    ),
    SeedMeeting(
        user_email="dipesh.karki@gmail.com",
        health_worker_username="dr_arun_basnet",
        scheduled_at=_future(8, 11, 30),
        meeting_link="https://meet.google.com/npl-dipesh-arun-001",
        status=MeetingStatus.SCHEDULED,
    ),
    SeedMeeting(
        user_email="samjhana.limbu@gmail.com",
        health_worker_username="ms_rekha_devi_sah",
        scheduled_at=_future(14, 14),
        meeting_link="https://meet.google.com/npl-samjhana-rekha-001",
        status=MeetingStatus.SCHEDULED,
    ),
    # --- Past completed sessions ---
    SeedMeeting(
        user_email="aarav.budhathoki@gmail.com",
        health_worker_username="dr_priya_shrestha",
        scheduled_at=_past(14, 10),
        meeting_link="https://meet.google.com/npl-aarav-priya-past-001",
        status=MeetingStatus.COMPLETED,
    ),
    SeedMeeting(
        user_email="sita.thapa@gmail.com",
        health_worker_username="dr_sunita_poudel",
        scheduled_at=_past(21, 14, 30),
        meeting_link="https://meet.google.com/npl-sita-sunita-past-001",
        status=MeetingStatus.COMPLETED,
    ),
    SeedMeeting(
        user_email="bikash.rai@gmail.com",
        health_worker_username="dr_nabin_regmi",
        scheduled_at=_past(7, 11),
        meeting_link="https://meet.google.com/npl-bikash-nabin-past-001",
        status=MeetingStatus.COMPLETED,
    ),
    SeedMeeting(
        user_email="rohan.tamang@gmail.com",
        health_worker_username="dr_rajan_acharya",
        scheduled_at=_past(30, 9, 30),
        meeting_link="https://meet.google.com/npl-rohan-rajan-past-001",
        status=MeetingStatus.COMPLETED,
    ),
    SeedMeeting(
        user_email="rohan.tamang@gmail.com",
        health_worker_username="dr_rajan_acharya",
        scheduled_at=_past(10, 9, 30),
        meeting_link="https://meet.google.com/npl-rohan-rajan-past-002",
        status=MeetingStatus.COMPLETED,
    ),
    SeedMeeting(
        user_email="manisha.manandhar@gmail.com",
        health_worker_username="dr_kabita_joshi",
        scheduled_at=_past(14, 16),
        meeting_link="https://meet.google.com/npl-manisha-kabita-past-001",
        status=MeetingStatus.COMPLETED,
    ),
    SeedMeeting(
        user_email="dipesh.karki@gmail.com",
        health_worker_username="dr_arun_basnet",
        scheduled_at=_past(21, 11, 30),
        meeting_link="https://meet.google.com/npl-dipesh-arun-past-001",
        status=MeetingStatus.COMPLETED,
    ),
    # --- Cancelled ---
    SeedMeeting(
        user_email="puja.gurung@gmail.com",
        health_worker_username="dr_priya_shrestha",
        scheduled_at=_past(5, 15),
        meeting_link="https://meet.google.com/npl-puja-priya-cancelled-001",
        status=MeetingStatus.CANCELLED,
    ),
    SeedMeeting(
        user_email="anita.magar@gmail.com",
        health_worker_username="dr_rajan_acharya",
        scheduled_at=_past(3, 13),
        meeting_link="https://meet.google.com/npl-anita-rajan-cancelled-001",
        status=MeetingStatus.CANCELLED,
    ),
]


def seed_meetings(db: Session) -> tuple[int, int]:
    created = 0
    skipped = 0

    for item in SEED_MEETINGS:
        user = db.query(User).filter(User.email == item.user_email).first()
        if not user:
            print(f"  [WARN] User not found: {item.user_email} — skipping meeting.")
            skipped += 1
            continue

        worker = (
            db.query(HealthWorker)
            .filter(HealthWorker.username == item.health_worker_username)
            .first()
        )
        if not worker:
            print(
                f"  [WARN] Health worker not found: {item.health_worker_username} "
                f"— skipping meeting."
            )
            skipped += 1
            continue

        # Avoid exact duplicate (same user + worker + scheduled_at)
        existing = (
            db.query(Meeting)
            .filter(
                Meeting.user_id == user.id,
                Meeting.health_worker_id == worker.id,
                Meeting.scheduled_at == item.scheduled_at,
            )
            .first()
        )
        if existing:
            skipped += 1
            continue

        db.add(
            Meeting(
                user_id=user.id,
                health_worker_id=worker.id,
                scheduled_at=item.scheduled_at,
                meeting_link=item.meeting_link,
                status=item.status,
            )
        )
        created += 1

    db.commit()
    return created, skipped


def main() -> None:
    db = SessionLocal()
    try:
        created, skipped = seed_meetings(db)
        print(
            "Meetings seed completed.",
            f"created={created}",
            f"skipped_existing={skipped}",
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()