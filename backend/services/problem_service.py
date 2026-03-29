import uuid
from sqlalchemy.orm import Session
from sqlalchemy import desc
from sqlalchemy.exc import IntegrityError

from backend.models.problem import AnonymousProblem, ProblemUpvote
from backend.schema.problem import CreateProblemRequest

def create_problem(db: Session, request: CreateProblemRequest, user_id: uuid.UUID) -> AnonymousProblem:
    problem = AnonymousProblem(
        title=request.title,
        description=request.description,
        category=request.category,
        severity_level=request.severity_level,
        community_group_id=request.community_group_id,
        upvote_count=0
    )
    try:
        db.add(problem)
        db.flush()

        initial_upvote = ProblemUpvote(problem_id=problem.id, user_id=user_id)
        db.add(initial_upvote)
        problem.upvote_count = 1

        db.commit()
        db.refresh(problem)
    except Exception:
        db.rollback()
        raise

    return problem

def toggle_upvote(db: Session, problem_id: uuid.UUID, user_id: uuid.UUID):
    problem = (
        db.query(AnonymousProblem)
        .filter(AnonymousProblem.id == problem_id)
        .with_for_update()
        .first()
    )
    if not problem:
        return None

    try:
        existing_upvote = db.query(ProblemUpvote).filter(
            ProblemUpvote.problem_id == problem_id,
            ProblemUpvote.user_id == user_id
        ).first()

        if existing_upvote:
            db.delete(existing_upvote)
            problem.upvote_count = max(0, problem.upvote_count - 1)
            status = "removed"
        else:
            new_upvote = ProblemUpvote(problem_id=problem_id, user_id=user_id)
            db.add(new_upvote)
            problem.upvote_count += 1
            status = "upvoted"

        db.commit()
        return status, problem.upvote_count
    except IntegrityError:
        db.rollback()

        problem = (
            db.query(AnonymousProblem)
            .filter(AnonymousProblem.id == problem_id)
            .with_for_update()
            .first()
        )
        if not problem:
            return None

        user_upvote_exists = (
            db.query(ProblemUpvote)
            .filter(
                ProblemUpvote.problem_id == problem_id,
                ProblemUpvote.user_id == user_id,
            )
            .first()
            is not None
        )
        accurate_count = (
            db.query(ProblemUpvote)
            .filter(ProblemUpvote.problem_id == problem_id)
            .count()
        )
        problem.upvote_count = accurate_count
        db.commit()

        status = "upvoted" if user_upvote_exists else "removed"
        return status, problem.upvote_count

def list_grouped_problems(db: Session, user_id: uuid.UUID):
    problems = db.query(AnonymousProblem).order_by(desc(AnonymousProblem.upvote_count)).all()
    user_upvotes = db.query(ProblemUpvote.problem_id).filter(ProblemUpvote.user_id == user_id).all()
    upvoted_set = {upvote[0] for upvote in user_upvotes}

    trending_category = {
        "category": "Trending",
        "total_upvotes": 0,
        "problems": []
    }
    
    categories_dict = {}
    
    for i, p in enumerate(problems):
        has_upvoted = p.id in upvoted_set
        
        if i < 10:
            trending_p = {
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "upvote_count": p.upvote_count,
                "has_upvoted": has_upvoted,
                "category_origin": p.category
            }
            trending_category["problems"].append(trending_p)
            trending_category["total_upvotes"] += p.upvote_count

        if p.category not in categories_dict:
            categories_dict[p.category] = {
                "category": p.category,
                "total_upvotes": 0,
                "problems": []
            }
        
        normal_p = {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "category": p.category,
            "severity_level": p.severity_level,
            "upvote_count": p.upvote_count,
            "created_at": p.created_at,
            "has_upvoted": has_upvoted
        }
        categories_dict[p.category]["problems"].append(normal_p)
        categories_dict[p.category]["total_upvotes"] += p.upvote_count
        
    normal_categories = list(categories_dict.values())
    normal_categories.sort(key=lambda x: x["total_upvotes"], reverse=True)
    
    result = []
    if trending_category["problems"]:
        result.append(trending_category)
        
    result.extend(normal_categories)
    return result
