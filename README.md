# nus_hackathon_project

Backend service project with PostgreSQL, MinIO, and Alembic migrations.

#Demo video, presentation video link
https://drive.google.com/drive/folders/1UMSCVnT31RI5xTlsIca7X_k91RVotdOC?usp=drive_link

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
│   └── init.sql                 # Optional Postgres init (schema via Alembic)
├── minio_data/                  # MinIO persisted data
├── tests/
├── scripts/
├── docker-compose.yml           # Postgres, MinIO, backend API, frontend (nginx)
├── Dockerfile.backend
├── Dockerfile.frontend
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

## Run with Docker Compose

From the repository root (builds images, starts Postgres, MinIO, API, and frontend):

```bash
docker compose up --build
```

Equivalent:

```bash
make start
```

- **Frontend:** http://localhost:3000 (static build behind nginx)
- **API:** http://localhost:8000
- **Postgres:** `localhost:55432` (user/password/db from `POSTGRES_*` below)
- **MinIO:** API `localhost:7545`, console `localhost:7546`

The backend container runs `alembic upgrade head` on startup, then serves the app with Uvicorn.

Optional environment overrides (examples):

```bash
VITE_API_BASE_URL=http://localhost:8000/ JWT_SECRET_KEY=your-secret docker compose up --build
```

`MINIO_PUBLIC_HOST` (default `localhost:7545`) is the host browsers use for media URLs; the MinIO client inside the backend uses the internal service hostname.

Detached mode:

```bash
docker compose up -d --build
```

## Run locally without Docker (API only)

Install dependencies:

```bash
uv sync
```

Start the API with hot reload:

```bash
make start-local
```

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
- `MINIO_ENDPOINT` (MinIO hostname:port for the SDK; in Compose the backend sets this to the MinIO service)
- `MINIO_PUBLIC_HOST` (host:port embedded in media URLs for browsers; default matches `MINIO_ENDPOINT`)
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `VITE_API_BASE_URL` (Compose build arg for the frontend image)
- `BACKEND_PORT`, `FRONTEND_PORT`, `POSTGRES_PORT`, `MINIO_S3_PORT`, `MINIO_CONSOLE_PORT` (published ports)

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

## Seeding Database 
```bash
uv run python scripts/seed_all.py
```

## to run frontend 
```
cd frontend 
npm install 
npm run dev
```
