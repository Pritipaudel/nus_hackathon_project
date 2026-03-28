from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from backend.core.database import get_async_db
from backend.models.icbt import ICBTProgram, ICBTEnrollment, ICBTModuleProgress
from backend.schema.icbt import (
    ICBTProgramResponse,
    ICBTEnrollRequest,
    ICBTEnrollResponse,
    ICBTMyProgramResponse,
    ICBTModuleCompleteResponse
)
from backend.core.dependencies import get_current_user
from backend.models.user import User

icbt_router = APIRouter(prefix="/icbt", tags=["ICBT"])

@icbt_router.get("/programs", response_model=List[ICBTProgramResponse])
async def list_icbt_programs(db: AsyncSession = Depends(get_async_db)):
    """
    List all available ICBT programs.
    """
    result = await db.execute(select(ICBTProgram))
    programs = result.scalars().all()
    return programs

@icbt_router.post("/enroll", response_model=ICBTEnrollResponse)
async def enroll_program(
    request: ICBTEnrollRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enroll in an ICBT program.
    """
    # Check if program exists
    prog_result = await db.execute(select(ICBTProgram).where(ICBTProgram.id == request.program_id))
    if not prog_result.scalars().first():
        raise HTTPException(status_code=404, detail="Program not found")

    # Check if already enrolled (ensure we only check for the current user)
    enr_result = await db.execute(
        select(ICBTEnrollment)
        .where(ICBTEnrollment.user_id == current_user.id)
        .where(ICBTEnrollment.program_id == request.program_id)
    )
    if enr_result.scalars().first():
        raise HTTPException(status_code=400, detail="Already enrolled in this program")

    enrollment = ICBTEnrollment(
        user_id=current_user.id,
        program_id=request.program_id,
        status="ACTIVE",
        progress_percent=0
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)

    return ICBTEnrollResponse(enrollment_id=enrollment.id, status=enrollment.status)

@icbt_router.get("/my-programs", response_model=List[ICBTMyProgramResponse])
async def get_my_programs(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's enrolled programs. Only returns programs enrolled by the current user.
    """
    result = await db.execute(
        select(ICBTEnrollment).where(ICBTEnrollment.user_id == current_user.id)
    )
    enrollments = result.scalars().all()
    return enrollments

@icbt_router.post("/modules/{module_id}/complete", response_model=ICBTModuleCompleteResponse)
async def complete_module(
    module_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a module as completed for the current user.
    """
    # Check if already completed by this user
    prog_result = await db.execute(
        select(ICBTModuleProgress)
        .where(ICBTModuleProgress.user_id == current_user.id)
        .where(ICBTModuleProgress.module_id == module_id)
    )
    if not prog_result.scalars().first():
        progress = ICBTModuleProgress(
            user_id=current_user.id,
            module_id=module_id,
            status="completed"
        )
        db.add(progress)
        await db.commit()
        
    return ICBTModuleCompleteResponse(status="completed")
