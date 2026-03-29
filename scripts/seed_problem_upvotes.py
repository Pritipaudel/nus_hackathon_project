"""Seed problem upvotes into the database.

Run from project root:
    PYTHONPATH=. uv run python scripts/seed_problem_upvotes.py

Requires users and anonymous problems (run ``scripts/seed_all.py`` or prior steps).
Also invoked automatically at the end of ``seed_all.py``.
"""

from __future__ import annotations

import random
import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.core.database import SessionLocal
from backend.models.problem import AnonymousProblem, ProblemUpvote
from backend.models.user import User

# Stable demo so trending / counts are reproducible after reset_and_seed.
_RNG_SEED = 42


def seed_problem_upvotes(db: Session, *, rng_seed: int = _RNG_SEED) -> tuple[int, int]:
    created = 0
    skipped = 0

    rng = random.Random(rng_seed)
    users = db.query(User).all()
    problems = db.query(AnonymousProblem).all()

    if not users or not problems:
        print("  [WARN] No users or problems — skip problem upvotes.")
        return 0, 0

    print(f"  Using {len(users)} users × {len(problems)} problems (rng_seed={rng_seed}).")

    for problem in problems:
        cap = min(len(users), 8)
        num_upvotes_to_create = rng.randint(1, cap) if cap >= 1 else 0
        if num_upvotes_to_create == 0:
            continue
        sampling_users = rng.sample(users, num_upvotes_to_create)

        for user in sampling_users:
            existing = (
                db.query(ProblemUpvote)
                .filter(
                    ProblemUpvote.problem_id == problem.id,
                    ProblemUpvote.user_id == user.id,
                )
                .first()
            )
            if existing:
                skipped += 1
                continue

            db.add(ProblemUpvote(problem_id=problem.id, user_id=user.id))
            created += 1

    db.commit()

    # Sync denormalized counts from problem_upvotes (fresh query after commit).
    for row in db.query(AnonymousProblem).all():
        cnt = (
            db.query(func.count(ProblemUpvote.id))
            .filter(ProblemUpvote.problem_id == row.id)
            .scalar()
            or 0
        )
        row.upvote_count = int(cnt)
    db.commit()

    return created, skipped

def main() -> None:
    db = SessionLocal()
    try:
        created, skipped = seed_problem_upvotes(db)
        print(
            "Problem upvotes seed completed.",
            f"created={created}",
            f"skipped_existing={skipped}",
        )
    finally:
        db.close()

if __name__ == "__main__":
    main()