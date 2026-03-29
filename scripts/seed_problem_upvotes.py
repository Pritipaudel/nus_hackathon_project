"""Seed problem upvotes into the database.

Run from project root:
    uv run python scripts/seed_problem_upvotes.py

Note: Requires users (seed_users.py) and anonymous problems (seed_anonymous_problems.py) 
to be seeded first.
"""

from __future__ import annotations

import sys
import random
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from sqlalchemy.orm import Session
from backend.core.database import SessionLocal
from backend.models.user import User
from backend.models.problem import AnonymousProblem, ProblemUpvote

def seed_problem_upvotes(db: Session) -> tuple[int, int]:
    created = 0
    skipped = 0

    # 1. Fetch all existing users and problems
    users = db.query(User).all()
    problems = db.query(AnonymousProblem).all()

    if not users or not problems:
        print("[ERROR] No users or problems found in DB. Seed them first!")
        return 0, 0

    print(f"Found {len(users)} users and {len(problems)} problems. Generating upvotes...")

    for problem in problems:
        # Determine how many upvotes to generate for this problem.
        # We try to create upvotes for about 30% to 60% of existing users per problem,
        # but you can adjust this logic as needed.
        num_upvotes_to_create = random.randint(1, min(len(users), 8))
        
        # Pick a random sample of users to upvote this specific problem
        sampling_users = random.sample(users, num_upvotes_to_create)

        for user in sampling_users:
            # Check for unique constraint (problem_id + user_id)
            existing = (
                db.query(ProblemUpvote)
                .filter(
                    ProblemUpvote.problem_id == problem.id,
                    ProblemUpvote.user_id == user.id
                )
                .first()
            )

            if existing:
                skipped += 1
                continue

            db.add(
                ProblemUpvote(
                    problem_id=problem.id,
                    user_id=user.id
                )
            )
            created += 1
    
    db.commit()

    # Optional: Update the 'upvote_count' in the AnonymousProblem table 
    # to match the actual number of rows in problem_upvotes
    for problem in problems:
        actual_count = db.query(ProblemUpvote).filter(ProblemUpvote.problem_id == problem.id).count()
        problem.upvote_count = actual_count
    
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