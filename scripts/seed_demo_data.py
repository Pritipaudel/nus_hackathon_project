"""
CLI entry for demo seed. Implementation: backend.seed.demo_data

From project root:
    PYTHONPATH=. uv run python scripts/seed_demo_data.py

Same logic as app startup: skips if worker@demo.com already exists.

Full database (Nepal scripts + hackathon demo + hub problems):
    bash scripts/reset_and_seed.sh
Nepal + hub problems only:
    SKIP_HACKATHON_DEMO=1 bash scripts/reset_and_seed.sh
"""

from backend.seed.demo_data import run_demo_seed_if_needed

if __name__ == "__main__":
    run_demo_seed_if_needed()
