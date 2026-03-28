import uuid
from pydantic import BaseModel, ConfigDict
from typing import Optional

class ICBTProgramResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    difficulty_level: Optional[str] = None
    duration_days: Optional[int] = None
    url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ICBTEnrollRequest(BaseModel):
    program_id: uuid.UUID

class ICBTEnrollResponse(BaseModel):
    enrollment_id: uuid.UUID
    status: str

    model_config = ConfigDict(from_attributes=True)

class ICBTMyProgramResponse(BaseModel):
    program_id: uuid.UUID
    status: str
    progress_percent: int

    model_config = ConfigDict(from_attributes=True)

class ICBTModuleCompleteResponse(BaseModel):
    status: str
