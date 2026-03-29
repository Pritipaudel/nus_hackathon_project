start:
	uv run uvicorn backend.main:app --reload

migrate:
	uv run alembic upgrade head

downgrade:
	uv run alembic downgrade -1

# Remove Docker DB volume, recreate DB, migrate, seed_all (Nepal + hackathon demo + hub problems).
reset-db-seed:
	bash scripts/reset_and_seed.sh

# Nepal scripts + hub problems only (no worker@demo.com bundle).
reset-db-seed-nepal-only:
	SKIP_HACKATHON_DEMO=1 bash scripts/reset_and_seed.sh