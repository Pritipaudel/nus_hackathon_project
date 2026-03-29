#!/usr/bin/env bash
# Wipe the Docker Postgres volume for this repo, bring DB + MinIO back up, migrate, seed all script data.
#
# From project root:
#   bash scripts/reset_and_seed.sh
#
# Skip hackathon demo (Nepal scripts + hub problems merge only):
#   SKIP_HACKATHON_DEMO=1 bash scripts/reset_and_seed.sh
#
# Requires: Docker, uv, .env with DATABASE_URL pointing at this compose Postgres (default port 55432).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Stopping stack and removing Postgres volume (pg_data)..."
docker compose down -v

echo "==> Starting Postgres + MinIO..."
docker compose up -d

echo "==> Waiting for PostgreSQL to accept connections..."
for _ in $(seq 1 90); do
  if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-appdb}" >/dev/null 2>&1; then
    echo "    Postgres is ready."
    break
  fi
  sleep 1
done

if ! docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-appdb}" >/dev/null 2>&1; then
  echo "ERROR: Postgres did not become ready in time." >&2
  exit 1
fi

export PYTHONPATH=.

echo "==> Running Alembic migrations..."
uv run alembic upgrade head

if [[ "${SKIP_HACKATHON_DEMO:-0}" == "1" ]]; then
  echo "==> Seeding: Nepal scripts + hub demo problems (no worker@demo bundle)..."
  uv run python scripts/seed_all.py --no-hackathon-demo
else
  echo "==> Seeding: Nepal scripts + hackathon demo + hub demo problems..."
  uv run python scripts/seed_all.py
fi

echo ""
echo "Done. Nepal seed users: password in seed_users.py (default Nepal@2025)."
echo "Hackathon demo (unless SKIP_HACKATHON_DEMO=1): worker@demo.com / patient@demo.com — Demo1234!"
echo "Optional (MinIO running): PYTHONPATH=. uv run python scripts/seed_worker_photos.py"
