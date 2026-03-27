start:
	uv run uvicorn backend.main:app --reload

migrate:
	uv run alembic upgrade head

downgrade:
	uv run alembic downgrade -1