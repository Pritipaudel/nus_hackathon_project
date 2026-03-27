from fastapi import APIRouter

index_router = APIRouter()

@index_router.get("/")
async def health_check():
    return {"status": "ok", "message": "Backend API is running"}

