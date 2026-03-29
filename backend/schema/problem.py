import uuid
from datetime import datetime
from typing import Optional, List, Union
from pydantic import BaseModel, ConfigDict, Field

class CreateProblemRequest(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    category: str = Field(default="General", max_length=100)
    severity_level: Optional[int] = Field(default=1, ge=1, le=5)
    community_group_id: Optional[uuid.UUID] = None

class ProblemBaseResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    upvote_count: int
    has_upvoted: bool = False
    
    model_config = ConfigDict(from_attributes=True)

class ProblemResponse(ProblemBaseResponse):
    category: str
    severity_level: Optional[int] = None
    created_at: datetime
    
class TrendingProblemResponse(ProblemBaseResponse):
    category_origin: str

class CategoryGroupResponse(BaseModel):
    category: str
    total_upvotes: int
    problems: List[Union[TrendingProblemResponse, ProblemResponse]]

class UpvoteResponse(BaseModel):
    status: str
    upvote_count: int
