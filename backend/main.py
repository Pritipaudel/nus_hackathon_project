from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.index_router import index_router

app = FastAPI(title="NUS Hackathon Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(index_router)
