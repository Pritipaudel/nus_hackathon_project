# Utthan - NUS Hackathon Project

Utthan is a digital health platform designed to provide accessible mental health support and community-driven healthcare solutions. This project integrates a FastAPI backend, a React frontend, and utilizes PostgreSQL for data storage and MinIO for object storage.

## Presentation and Demo
Presentation and demo video links:
https://drive.google.com/drive/folders/1UMSCVnT31RI5xTlsIca7X_k91RVotdOC?usp=drive_link

## The Shamans Team
This project was developed by The Shamans for the Nepal US Hackathon.

Team Members:
- Pratham Adhikari
- Preeti Paudel Jaisi
- Shubham Raj Joshi
- Prashant Sharma
- Prasanna Jha

## Project Overview
Utthan provides a secure and anonymous environment for users to share community problems, access mental health programs (ICBT), and connect with health workers.

### Technical Stack
- Backend: Python 3.12, FastAPI, SQLAlchemy, Alembic
- Frontend: Vite-based React application
- Database: PostgreSQL 16
- Storage: MinIO (S3-compatible)
- Tools: uv for dependency management, Docker for containerization

## Getting Started (Non-Programmers)

If you do not have a programming background, the easiest way to run this application is using Docker.

### Prerequisites
1. Download and install **Docker Desktop** for your operating system (Windows/Mac/Linux).
2. Ensure Docker Desktop is running.

### Standard Setup Steps
1. Open a terminal or command prompt in the project's root folder.
2. Run the following command to start the entire system:
   ```bash
   docker compose up --build
   ```
3. Once the process is complete, you can access the application at:
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:8000/docs

## Development Environment Setup

### 1. Environment Variables (.env)
The project requires several environment variables to function correctly. These are stored in a `.env` file in the root directory.

#### Step-by-Step Configuration:
1. Locate the file named `.env.example` in the root folder.
2. Create a copy of this file and rename it to `.env`.
3. Open `.env` and configure the following sections:

**Database (PostgreSQL):**
- `POSTGRES_USER`: The username for the database (default: `postgres`).
- `POSTGRES_PASSWORD`: The password for the database (default: `postgres`).
- `POSTGRES_DB`: The name of the database (default: `appdb`).
- `POSTGRES_PORT`: The port the database runs on (default: `55432`).

**Object Storage (MinIO):**
- `MINIO_ROOT_USER`: Admin username for MinIO (default: `minioadmin`).
- `MINIO_ROOT_PASSWORD`: Admin password for MinIO (default: `minioadmin`).
- `MINIO_S3_PORT`: Port for the S3 API (default: `7545`).
- `MINIO_CONSOLE_PORT`: Port for the MinIO web dashboard (default: `7546`).

**Frontend Configuration:**
- `VITE_API_BASE_URL`: The URL where the backend API is reachable (e.g., `http://localhost:8000/`).

### 2. Manual Local Setup
If you prefer not to use Docker for development:

**Backend Setup:**
1. Install dependencies: `uv sync`
2. Run database migrations: `uv run alembic upgrade head`
3. Start the server: `uv run uvicorn backend.main:app --reload`

**Frontend Setup:**
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Detailed Project Structure

### Root Directory
- `alembic/`: Database migration history and configuration.
- `backend/`: Primary application logic and API source code.
- `docs/`: Project documentation, architecture diagrams, and assets.
- `frontend/`: React application source code and assets.
- `postgres/`: Initialization scripts for the PostgreSQL database.
- `scripts/`: Python and Shell scripts for data seeding and automation.
- `tests/`: Automated unit and integration tests.
- `docker-compose.yml`: Orchestration file for running all services via Docker.

### Backend Structure (`backend/`)
- `api/`: Route definitions and endpoint handlers for the web API.
- `core/`: Core configurations including database connections and security.
- `models/`: Database schema definitions using SQLAlchemy.
- `repository/`: Data access layer for database interactions.
- `schema/`: Pydantic models for data validation and API documentation.
- `services/`: Business logic layer that orchestrates repositories and external services.

### Frontend Structure (`frontend/src/`)
- `app/`: Global application state and core configuration.
- `features/`: Component-based modules grouped by functionality:
  - `auth/`: User authentication and registration.
  - `chat/`: Direct and community messaging interfaces.
  - `community/`: Community forum and problem-sharing modules.
  - `icbt/`: Mental health program (ICBT) modules.
  - `dashboard/`: User and health worker dashboard interfaces.
- `shared/`: Reusable components, hooks, and utility functions used across the app.
- `styles/`: Global CSS and theme configurations.

## Troubleshooting

### Windows Line Endings
If you see "no such file or directory" when running Docker on Windows, it is likely due to CRLF line endings. The project includes automated fixes, but ensuring your Git is set to use LF line endings is recommended.

### Service Connectivity
Ensure all ports specified in your `.env` file (e.g., 8000, 3000, 55432) are free on your machine before starting Docker.
