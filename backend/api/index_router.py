from fastapi import APIRouter

index_router = APIRouter()


@index_router.get("/")
async def root():
    return {"status": "ok", "message": "Backend API is running"}


@index_router.get("/health")
async def health_check():
    return {"status": "ok"}

