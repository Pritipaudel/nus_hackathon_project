"""
Demo anonymous community problems for the hub (no author shown in UI).

- `ensure_demo_community_problems()` runs on app startup if `anonymous_problems` is empty.
- Manual: PYTHONPATH=. uv run python scripts/seed_community_problems.py
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.exc import OperationalError, ProgrammingError

from backend.core.database import SessionLocal
from backend.models.community import CommunityGroup
from backend.models.problem import AnonymousProblem

logger = logging.getLogger(__name__)

# group_value matches seed community groups (optional link); omit or None for global-only
DEMO_PROBLEMS: list[dict] = [
    {
        "title": "Harassment on evening buses",
        "description": "I've noticed uncomfortable touching and staring on crowded transit after work. Hard to know how to report without making things worse.",
        "category": "Harassment",
        "severity_level": 4,
        "upvote_count": 52,
        "group_value": "anxiety_support",
    },
    {
        "title": "Catcalling near transit hubs",
        "description": None,
        "category": "Harassment",
        "severity_level": 3,
        "upvote_count": 38,
        "group_value": None,
    },
    {
        "title": "Pressure from relatives about marriage",
        "description": "Constant comments at family gatherings affect my mood for days. No one treats it as harmful.",
        "category": "Family trauma",
        "severity_level": 4,
        "upvote_count": 31,
        "group_value": "low_mood",
    },
    {
        "title": "Long waits for affordable counselling",
        "description": "By the time a slot opens, the crisis moment has passed. We need shorter intake queues.",
        "category": "Access to care",
        "severity_level": 5,
        "upvote_count": 44,
        "group_value": None,
    },
    {
        "title": "Stigma when taking mental health leave",
        "description": "Colleagues assume you're lazy if you use MC for burnout or panic.",
        "category": "Stigma",
        "severity_level": 3,
        "upvote_count": 27,
        "group_value": None,
    },
    {
        "title": "Sleep disrupted by neighbourhood noise",
        "description": "Earplugs help but I still wake up anxious. Affects work the next day.",
        "category": "General",
        "severity_level": 2,
        "upvote_count": 19,
        "group_value": "sleep_recovery",
    },
    {
        "title": "Unsafe reporting channels at work",
        "description": "HR and the harasser sit on the same floor. Anonymous lines feel like a black hole.",
        "category": "Harassment",
        "severity_level": 4,
        "upvote_count": 41,
        "group_value": None,
    },
    {
        "title": "Youth can't afford private therapy",
        "description": "School counsellors are overloaded. Private fees are out of reach for many families.",
        "category": "Access to care",
        "severity_level": 4,
        "upvote_count": 36,
        "group_value": None,
    },
]


def ensure_demo_community_problems() -> None:
    """Insert demo problems once when the table has no rows. Safe on every startup."""
    db = SessionLocal()
    try:
        count = db.query(func.count(AnonymousProblem.id)).scalar() or 0
        if count > 0:
            return

        groups = db.query(CommunityGroup).all()
        by_value = {g.value: g.id for g in groups}

        now = datetime.now(timezone.utc)
        for row in DEMO_PROBLEMS:
            gv = row.get("group_value")
            gid = by_value.get(gv) if gv else None
            db.add(
                AnonymousProblem(
                    title=row["title"],
                    description=row.get("description"),
                    category=row["category"],
                    severity_level=row.get("severity_level") or 1,
                    community_group_id=gid,
                    upvote_count=int(row["upvote_count"]),
                    created_at=now,
                )
            )
        db.commit()
        logger.info("Seeded %s demo community problems.", len(DEMO_PROBLEMS))
    except (ProgrammingError, OperationalError) as exc:
        db.rollback()
        logger.warning("Skipping demo community problems (database): %s", exc)
    except Exception:
        db.rollback()
        logger.exception("ensure_demo_community_problems failed")
    finally:
        db.close()
