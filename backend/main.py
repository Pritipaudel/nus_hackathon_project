from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.index_router import index_router
from backend.core.middleware import AuthMiddleware
from backend.router.auth_router import auth_router

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
