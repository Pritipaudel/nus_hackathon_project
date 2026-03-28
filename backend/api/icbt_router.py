from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from backend.core.database import get_async_db
from backend.models.icbt import ICBTProgram
from backend.schema.icbt import ICBTProgramResponse

icbt_router = APIRouter(prefix="/icbt", tags=["ICBT"])

@icbt_router.get("/programs", response_model=List[ICBTProgramResponse])
async def list_icbt_programs(db: AsyncSession = Depends(get_async_db)):
    """
    List all available ICBT programs.
    """
    result = await db.execute(select(ICBTProgram))
    programs = result.scalars().all()
    return programs
