# nus_hackathon_project

Full-stack mental health platform (**उत्थान**): **FastAPI** backend, **React (Vite)** frontend, **PostgreSQL**, **MinIO** (S3-compatible uploads), and **Alembic** migrations.

---

## Demo and team

- **Demo / presentation:** [Google Drive folder](https://drive.google.com/drive/folders/1UMSCVnT31RI5xTlsIca7X_k91RVotdOC?usp=drive_link)
- **Team — The Shamans**
  - Pratham Adhikari
  - Preeti Paudel Jaisi
  - Shubham Raj Joshi
  - Prashant Sharma
  - Prasanna Jha

---

## Prerequisites

### Run everything with Docker (recommended)

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose v2)
- Ports **3000**, **8000**, **55432**, **7545**, **7546** available on your machine (or override them—see [Environment variables](#environment-variables))

You do **not** need Python or Node installed on the host for the Docker workflow.

### Develop without Docker (optional)

- **Python 3.12+** and **[uv](https://docs.astral.sh/uv/)**
- **Node.js 18+** and npm (for the frontend)
- PostgreSQL and MinIO running (e.g. via `docker compose up postgres wiseminioservices` only)

---

## Quick start: Docker Compose

From the **repository root** (where `docker-compose.yml` lives):

### 1. Clone and enter the project

```bash
git clone <your-repo-url>
cd nus_hackathon_project
```

### 2. (Optional) Environment file

Compose reads variables from your shell or a `.env` file in the project root. To start from the sample:

```bash
cp .env.example .env
```

Edit `.env` if you need different passwords, ports, or secrets. For a first run, defaults are enough.

### 3. Build and start all services

```bash
docker compose up --build
```

Or use the Makefile:

```bash
make start
```

The first build can take several minutes (downloads base images, installs Python and Node dependencies, runs the frontend production build).

### 4. Open the app

| What | URL | Notes |
|------|-----|--------|
| **Web UI** | http://localhost:3000 | Static SPA served by **nginx** inside the `frontend` container |
| **API** | http://localhost:8000 | **FastAPI** + **Uvicorn** |
| **API docs** | http://localhost:8000/docs | Swagger UI |
| **PostgreSQL** | `localhost:55432` | User / password / database from `POSTGRES_*` (defaults: `postgres` / `postgres` / `appdb`) |
| **MinIO (S3 API)** | http://localhost:7545 | Object storage for community media, worker photos, etc. |
| **MinIO console** | http://localhost:7546 | Web UI (login: `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`, default `minioadmin` / `minioadmin`) |

### 5. Stop the stack

Press `Ctrl+C` in the terminal where Compose is running, or in another terminal:

```bash
docker compose down
```

To also remove the Postgres data volume (full database wipe):

```bash
docker compose down -v
```

### Run in the background

```bash
docker compose up -d --build
```

View logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

---

## What Docker Compose starts

1. **postgres** — Database. A healthcheck waits until Postgres is ready before the API starts.
2. **wiseminioservices** — MinIO for file uploads.
3. **backend** — On each start it runs `alembic upgrade head`, then `uvicorn backend.main:app --host 0.0.0.0 --port 8000`. Demo seed hooks in `backend/main.py` may run on startup when the DB is empty or needs repair.
4. **frontend** — Multi-stage image: `npm run build`, then nginx on port **80** (mapped to host **3000**).

Build context is the **repo root**; see `Dockerfile.backend` and `Dockerfile.frontend`.

---

## Environment variables

Compose substitutes `${VAR:-default}` from your environment or a root `.env` file.

### Database (Postgres)

| Variable | Default | Used by |
|----------|---------|---------|
| `POSTGRES_USER` | `postgres` | Postgres container + backend |
| `POSTGRES_PASSWORD` | `postgres` | Postgres container + backend |
| `POSTGRES_DB` | `appdb` | Postgres container + backend |
| `POSTGRES_PORT` | `55432` | Host port mapped to Postgres `5432` |

Inside Docker, the backend always uses host **`postgres`** and port **`5432`** on the internal network (set in `docker-compose.yml`).

### API security

| Variable | Default | Notes |
|----------|---------|--------|
| `JWT_SECRET_KEY` | `change-me-in-production` | Set a long random string in real deployments |

### MinIO

| Variable | Default | Notes |
|----------|---------|--------|
| `MINIO_S3_PORT` | `7545` | Published S3 API port |
| `MINIO_CONSOLE_PORT` | `7546` | Published console port |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | `minioadmin` | MinIO login and backend S3 credentials in Compose |
| `MINIO_PUBLIC_HOST` | `localhost:7545` | Hostname (and port) **embedded in URLs** returned to the browser for images/files. The SDK inside the backend uses the internal address `wiseminioservices:9000`. |

If you change published MinIO ports, set `MINIO_PUBLIC_HOST` to match what the **browser** must use (e.g. `localhost:9000`).

### Frontend build (baked into the image at build time)

| Variable | Default | Notes |
|----------|---------|--------|
| `VITE_API_BASE_URL` | `http://localhost:8000/` | Base URL the **browser** uses to call the API. Must be reachable from the user’s machine, not from inside a container. |
| `VITE_APP_NAME` | `उत्थान` | Shown in the UI |
| `VITE_APP_ENV` | `production` | Label for the build |

After changing `VITE_*` values, rebuild the frontend image:

```bash
docker compose build --no-cache frontend
docker compose up -d
```

### Published service ports

| Variable | Default | Service |
|----------|---------|---------|
| `BACKEND_PORT` | `8000` | API |
| `FRONTEND_PORT` | `3000` | Web UI |

---

## Local development (without full Docker stack)

Use this when you want hot reload on the API or frontend.

### 1. Infrastructure only (Postgres + MinIO in Docker)

```bash
docker compose up postgres wiseminioservices
```

Keep `POSTGRES_HOST=localhost`, `POSTGRES_PORT=55432`, and `MINIO_ENDPOINT=localhost:7545` in a root `.env` (see `.env.example` and extend with `JWT_SECRET_KEY` as needed).

### 2. Backend

```bash
uv sync
make migrate    # or: uv run alembic upgrade head
make start-local   # uvicorn with --reload
```

### 3. Frontend

```bash
cd frontend
cp .env.development.example .env.development
# Set VITE_API_BASE_URL=http://127.0.0.1:8000/ (or your API URL)
npm install
npm run dev
```

Vite dev server defaults to port **3000**; if that clashes with another process, adjust in `vite.config.ts`.

More detail: `frontend/README.md`.

---

## Database migrations

- **Docker:** migrations run automatically when the **backend** container starts (`alembic upgrade head`).
- **Local:** from the repo root:

```bash
uv run alembic upgrade head
# or
make migrate
```

Rollback one revision:

```bash
make downgrade
```

---

## Seeding demo data

Scripts are meant to run against a live DB (from the host with `uv`, or `docker compose exec`).

From the **repository root** (with Python env / `uv` and DB reachable):

```bash
uv run python scripts/seed_all.py
```

Makefile shortcuts for reset + seed (read `scripts/reset_and_seed.sh` before use):

```bash
make reset-db-seed
make reset-db-seed-nepal-only
```

---

## Project layout

```text
nus_hackathon_project/
├── frontend/                 # React + Vite SPA
├── backend/                  # FastAPI application
├── alembic/                  # Migration revisions
├── postgres/init.sql         # Optional init SQL (schema from Alembic)
├── scripts/                  # Seeds, Docker entrypoint, helpers
├── docker-compose.yml        # postgres, minio, backend, frontend
├── Dockerfile.backend
├── Dockerfile.frontend
├── frontend/docker/          # nginx config for production image
├── pyproject.toml            # Python dependencies (uv)
├── makefile                  # start, migrate, seed shortcuts
└── .env.example              # Sample env vars for Compose / local infra
```

---

## Tech stack

| Layer | Stack |
|-------|--------|
| API | Python 3.12, FastAPI, Uvicorn, SQLAlchemy, Alembic, Pydantic |
| DB | PostgreSQL 16 |
| Storage | MinIO (S3-compatible) |
| Frontend | React 18, TypeScript, Vite, TanStack Query, Zustand, React Router |
| Tooling | uv (Python), npm (frontend), Docker Compose |

---

## Troubleshooting

- **Port already in use** — Stop the other process or set `BACKEND_PORT`, `FRONTEND_PORT`, `POSTGRES_PORT`, or MinIO ports in `.env`.
- **Frontend cannot reach API** — `VITE_API_BASE_URL` must be a URL your **browser** can open (usually `http://localhost:8000/`). Rebuild the frontend image after changing it.
- **Broken images / media URLs** — Set `MINIO_PUBLIC_HOST` to the same host:port you use in the browser to reach MinIO (default `localhost:7545` when using published ports).
- **Database empty after `down -v`** — Run migrations (restart backend in Docker) and optionally `scripts/seed_all.py`.

---

## API smoke test

```bash
curl -s http://localhost:8000/
```

Interactive docs: http://localhost:8000/docs
