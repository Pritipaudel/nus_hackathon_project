from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.index_router import index_router
from backend.api.communuity_router import communuity_router
from backend.api.dashboard_router import dashboard_router
from backend.core.middleware import AuthMiddleware
from backend.router.auth_router import auth_router
from backend.api.icbt_router import icbt_router
from backend.api.health_worker_router import health_worker_router

load_dotenv()

app = FastAPI(title="NUS Hackathon Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(AuthMiddleware)

app.include_router(index_router)
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(icbt_router)
app.include_router(communuity_router)
app.include_router(health_worker_router)
