from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.index_router import index_router
from backend.api.communuity_router import communuity_router
from backend.api.dashboard_router import dashboard_router
from backend.core.middleware import AuthMiddleware
from backend.router.auth_router import auth_router
from backend.api.icbt_router import icbt_router
from backend.api.chat_mock_router import chat_mock_router
from backend.api.chat_router import chat_router
from backend.api.direct_chat_router import direct_chat_router
from backend.api.health_worker_router import health_worker_router
from backend.api.problem_router import problem_router
from backend.seed.demo_data import ensure_demo_direct_messages, run_demo_seed_if_needed

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_demo_seed_if_needed()
    ensure_demo_direct_messages()
    yield


app = FastAPI(title="NUS Hackathon Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],
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
app.include_router(chat_router)
app.include_router(chat_mock_router)
app.include_router(problem_router)
app.include_router(direct_chat_router)
