"""Single entry point: script seeds + backend/seed demo data.

Run from project root:
    PYTHONPATH=. uv run python scripts/seed_all.py

Default includes hackathon demo (worker@demo.com, patients, Dr Priya groups, Nepali DMs)
after the Nepal script chain, then merges hub demo anonymous problems (so group links resolve).

Skip hackathon demo (Nepal scripts + hub problems only):
    PYTHONPATH=. uv run python scripts/seed_all.py --no-hackathon-demo

Pipeline:
  1–7. scripts: users, community, ICBT (programme ↔ group links need groups), health workers, training, meetings, anonymous problems
  8. (unless --no-hackathon-demo) backend.seed.demo_data: run_demo_seed_if_needed + ensure_demo_direct_messages
  9. backend.seed.community_problems_demo: merge_demo_community_problems (idempotent by title)
  10. scripts.seed_problem_upvotes: synthetic ProblemUpvote rows + sync AnonymousProblem.upvote_count
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.core.database import SessionLocal  # noqa: E402
from backend.seed.community_problems_demo import merge_demo_community_problems  # noqa: E402

from scripts.seed_icbt_programs import seed_icbt_programs  # noqa: E402
from scripts.seed_users import seed_users  # noqa: E402
from scripts.seed_community import seed_community  # noqa: E402
from scripts.seed_health_workers import seed_health_workers  # noqa: E402
from scripts.seed_training import seed_training  # noqa: E402
from scripts.seed_meetings import seed_meetings  # noqa: E402
from scripts.seed_anonymous_problems import seed_anonymous_problems  # noqa: E402
from scripts.seed_problem_upvotes import seed_problem_upvotes  # noqa: E402


def run_script_seeds(db) -> None:
    print("\n=== [1/7] Seeding users (scripts) ===")
    created, skipped = seed_users(db)
    print(f"  created={created}  skipped={skipped}")

    print("\n=== [2/7] Seeding community groups & posts (scripts) ===")
    gc, gs, pc, ps = seed_community(db)
    print(f"  groups: created={gc}  skipped={gs}")
    print(f"  posts:  created={pc}  skipped={ps}")

    print("\n=== [3/7] Seeding ICBT programs + community links (scripts) ===")
    created, updated, skipped, links = seed_icbt_programs(db)
    print(f"  created={created}  updated={updated}  skipped={skipped}  community_links_added={links}")

    print("\n=== [4/7] Seeding health workers (scripts) ===")
    created, skipped = seed_health_workers(db)
    print(f"  created={created}  skipped={skipped}")

    print("\n=== [5/7] Seeding training programs & enrollments (scripts) ===")
    pc, ps, ec, es = seed_training(db)
    print(f"  programs:    created={pc}  skipped={ps}")
    print(f"  enrollments: created={ec}  skipped={es}")

    print("\n=== [6/7] Seeding meetings (scripts) ===")
    created, skipped = seed_meetings(db)
    print(f"  created={created}  skipped={skipped}")

    print("\n=== [7/7] Seeding anonymous problems — Nepal set (scripts) ===")
    created, skipped = seed_anonymous_problems(db)
    print(f"  created={created}  skipped={skipped}")


def main(*, hackathon_demo: bool = True) -> None:
    db = SessionLocal()
    try:
        run_script_seeds(db)
        print("\n Script seeds (1–7) completed.")
    except Exception as exc:
        print(f"\n Seeding failed: {exc}")
        raise
    finally:
        db.close()

    if hackathon_demo:
        print("\n=== [8/10] Hackathon demo (backend.seed.demo_data) ===")
        print("  worker@demo.com, 8 patients, meetings, extra groups/iCBT, catalogue workers.")
        from backend.seed.demo_data import ensure_demo_direct_messages, run_demo_seed_if_needed

        ran = run_demo_seed_if_needed()
        if ran:
            print("  Inserted demo worker, patients, and related rows.")
        else:
            print("  Skipped (worker@demo.com already present).")
        ensure_demo_direct_messages()
        print("  Direct-message demo thread checked.")

    print("\n=== [9/10] Hub demo anonymous problems (backend.seed.community_problems_demo) ===")
    print("  Merges DEMO_PROBLEMS by title (links to groups when values exist).")
    db_merge = SessionLocal()
    try:
        c, s = merge_demo_community_problems(db_merge)
        print(f"  created={c}  skipped={s}")
    finally:
        db_merge.close()

    print("\n=== [10/10] Problem upvotes (scripts/seed_problem_upvotes.py) ===")
    print("  Random users per problem (deterministic seed); syncs upvote_count.")
    db_votes = SessionLocal()
    try:
        vc, vs = seed_problem_upvotes(db_votes)
        print(f"  upvote rows created={vc}  skipped_existing={vs}")
    finally:
        db_votes.close()

    print("\n All seeds completed.")


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Load script seeds plus backend/seed hub + optional hackathon demo.",
    )
    p.add_argument(
        "--no-hackathon-demo",
        action="store_true",
        help="Omit worker@demo.com bundle; still merges hub demo problems after scripts.",
    )
    return p.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    main(hackathon_demo=not args.no_hackathon_demo)