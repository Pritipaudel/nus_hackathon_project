import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.database import SessionLocal
import backend.models.user  # noqa: F401
import backend.models.community  # noqa: F401
from backend.models.health_worker import TrainingProgram

PROGRAMS = [
    {
        "title": "Mental Health First Aid",
        "organization": "Mental Health Commission of Singapore",
        "description": "Foundational training in recognising and responding to mental health crises in community settings.",
        "is_verified": True,
    },
    {
        "title": "CBT Fundamentals for Practitioners",
        "organization": "Institute of Mental Health",
        "description": "Core cognitive behavioural therapy skills for clinicians and counsellors working with anxiety and depression.",
        "is_verified": True,
    },
    {
        "title": "Trauma-Informed Care",
        "organization": "National Council of Social Service",
        "description": "Understanding trauma responses and applying trauma-sensitive approaches across community care settings.",
        "is_verified": True,
    },
    {
        "title": "Cultural Competency in Mental Health",
        "organization": "NUS Saw Swee Hock School of Public Health",
        "description": "Equipping practitioners to work sensitively across ethnic, religious and cultural groups in Singapore.",
        "is_verified": True,
    },
    {
        "title": "Motivational Interviewing",
        "organization": "Singapore Psychological Society",
        "description": "Evidence-based communication techniques to facilitate behaviour change and therapeutic engagement.",
        "is_verified": False,
    },
]


def seed():
    db = SessionLocal()
    created = 0
    skipped = 0
    try:
        for p in PROGRAMS:
            exists = (
                db.query(TrainingProgram)
                .filter(
                    TrainingProgram.title == p["title"],
                    TrainingProgram.organization == p["organization"],
                )
                .first()
            )
            if exists:
                skipped += 1
                continue
            db.add(TrainingProgram(**p))
            created += 1
        db.commit()
        print(f"Training seed completed. created={created} skipped={skipped}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
