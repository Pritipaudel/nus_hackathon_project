# nus_hackathon_project

Backend service project with PostgreSQL, MinIO, and Alembic migrations.

## Project Structure

```text
nus_hackathon_project/
├── frontend/                    #frontend code
├── backend/
│   ├── main.py                  # FastAPI app entrypoint
│   ├── core/
│   │   ├── database.py          # SQLAlchemy sync/async engine and DB helpers
│   │   └── minio_client.py      # MinIO client setup
│   ├── api/
│   │   └── index_router.py      # Health-check route
│   ├── models/                  # SQLAlchemy models
│   ├── repository/              # Data-access layer
│   ├── services/                # Business/service layer
│   └── utils/
├── alembic/
│   ├── env.py                   # Alembic migration environment
│   └── versions/                # Migration revisions
├── postgres/
│   └── docker_postgres_init.sql # Postgres init script
├── minio_data/                  # MinIO persisted data
├── tests/
├── scripts/
├── Docker-compose.yml           # Docker services (Postgres + MinIO)
├── alembic.ini                  # Alembic configuration
├── makefile                     # Common run and migration commands
├── pyproject.toml               # Python project/dependencies
├── .env                         # Local environment variables
└── .env.example                 # Example environment variables
```

# Backend
## Tech Stack(backend)

- Python 3.12+
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL 16
- MinIO (S3-compatible object storage)
- asyncpg
- python-dotenv
- uv (package/dependency runner)
- Uvicorn

## Run Locally

Install dependencies:

```bash
uv sync
```

Start the API server in reload mode:

```bash
make start
```

Server command used by Makefile:

```bash
uv run uvicorn backend.main:app --reload
```

Default health endpoint:

```text
GET /
```
## Environment Variables

Copy and customize:

```bash
cp .env.example .env
```

Important variables used in this project:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`
- `POSTGRES_HOST` (defaults to `localhost` in code if not set)
- `MINIO_S3_PORT`
- `MINIO_CONSOLE_PORT`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`
- `MINIO_ENDPOINT` (for app MinIO client, e.g. `localhost:7545`)
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`

## Redeploy with Docker Compose

From project root:

### 1) Build and start (or redeploy after code/config changes)

```bash
docker compose up -d --build
```





## Migrations

Run latest migrations:

```bash
uv run alembic upgrade head
```

Or use Makefile shortcuts:

```bash
make migrate
make downgrade
```