"""Run all seed scripts in the correct dependency order.

Run from project root:
    uv run python scripts/seed_all.py

Order:
  1. seed_icbt_programs      — no dependencies
  2. seed_users              — no dependencies
  3. seed_community          — depends on users
  4. seed_health_workers     — depends on community groups
  5. seed_training           — depends on users
  6. seed_meetings           — depends on users + health workers
  7. seed_anonymous_problems — depends on community groups
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure the project root is on sys.path so that `backend` and `scripts`
# are both importable regardless of how this file is executed.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.core.database import SessionLocal  # noqa: E402

# Import each seed function directly (avoids scripts-as-package issues)
from scripts.seed_icbt_programs import seed_icbt_programs  # noqa: E402
from scripts.seed_users import seed_users  # noqa: E402
from scripts.seed_community import seed_community  # noqa: E402
from scripts.seed_health_workers import seed_health_workers  # noqa: E402
from scripts.seed_training import seed_training  # noqa: E402
from scripts.seed_meetings import seed_meetings  # noqa: E402
from scripts.seed_anonymous_problems import seed_anonymous_problems  # noqa: E402


def main() -> None:
    db = SessionLocal()
    try:
        print("\n=== [1/7] Seeding ICBT programs ===")
        created, updated, skipped = seed_icbt_programs(db)
        print(f"  created={created}  updated={updated}  skipped={skipped}")

        print("\n=== [2/7] Seeding users ===")
        created, skipped = seed_users(db)
        print(f"  created={created}  skipped={skipped}")

        print("\n=== [3/7] Seeding community groups & posts ===")
        gc, gs, pc, ps = seed_community(db)
        print(f"  groups: created={gc}  skipped={gs}")
        print(f"  posts:  created={pc}  skipped={ps}")

        print("\n=== [4/7] Seeding health workers ===")
        created, skipped = seed_health_workers(db)
        print(f"  created={created}  skipped={skipped}")

        print("\n=== [5/7] Seeding training programs & enrollments ===")
        pc, ps, ec, es = seed_training(db)
        print(f"  programs:    created={pc}  skipped={ps}")
        print(f"  enrollments: created={ec}  skipped={es}")

        print("\n=== [6/7] Seeding meetings ===")
        created, skipped = seed_meetings(db)
        print(f"  created={created}  skipped={skipped}")

        print("\n=== [7/7] Seeding anonymous problems ===")
        created, skipped = seed_anonymous_problems(db)
        print(f"  created={created}  skipped={skipped}")

        print("\n All seeds completed successfully.")
    except Exception as exc:
        print(f"\n Seeding failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()