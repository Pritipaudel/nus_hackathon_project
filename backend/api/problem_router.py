import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.schema.problem import CreateProblemRequest, ProblemResponse, CategoryGroupResponse, UpvoteResponse
from backend.services.problem_service import create_problem, toggle_upvote, list_grouped_problems

problem_router = APIRouter(prefix="/problem", tags=["Anonymous Problems"])

@problem_router.post("/create", response_model=ProblemResponse, status_code=status.HTTP_201_CREATED)
def create_new_problem(
    request: CreateProblemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    problem = create_problem(db=db, request=request, user_id=current_user.id)
    response_dict = problem.__dict__
    response_dict["has_upvoted"] = True
    return ProblemResponse(**response_dict)

@problem_router.get("/list-with-count", response_model=List[CategoryGroupResponse])
def get_problems(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return list_grouped_problems(db=db, user_id=current_user.id)

@problem_router.post("/upvote/{id}", response_model=UpvoteResponse)
def upvote_problem(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = toggle_upvote(db=db, problem_id=id, user_id=current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="Problem not found")
        
    vote_status, count = result
    return UpvoteResponse(status=vote_status, upvote_count=count)
