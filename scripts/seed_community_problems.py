"""
Merge hub demo anonymous problems (by title). Prefer full reset via scripts/seed_all.py.

From project root:
    PYTHONPATH=. uv run python scripts/seed_community_problems.py
"""

from backend.core.database import SessionLocal
from backend.seed.community_problems_demo import merge_demo_community_problems

if __name__ == "__main__":
    db = SessionLocal()
    try:
        c, s = merge_demo_community_problems(db)
        print(f"Demo community problems: created={c}  skipped_existing={s}")
    finally:
        db.close()
