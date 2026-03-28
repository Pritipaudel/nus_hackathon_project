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
