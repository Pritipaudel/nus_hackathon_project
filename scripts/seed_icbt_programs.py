"""Seed ICBT programs into the database.

Run from project root:
    uv run python scripts/seed_icbt_programs.py
"""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from backend.core.database import SessionLocal

# Ensure model registry includes relationship targets used by ICBT models.
import backend.models.community  # noqa: F401
from backend.models.icbt import ICBTProgram


@dataclass(frozen=True)
class SeedProgram:
    title: str
    url: str
    category: str
    description: str
    difficulty_level: str | None = None
    duration_days: int | None = None


SEED_PROGRAMS: list[SeedProgram] = [
    SeedProgram(
        title="Online-Therapy CBT",
        url="https://www.online-therapy.com/cbt",
        category="Therapist-led",
        description=(
            "Structured online CBT platform with therapist support, worksheets, "
            "journaling, and progress tracking."
        ),
        difficulty_level="Beginner",
        duration_days=56,
    ),
    SeedProgram(
        title="Brightside",
        url="https://www.brightside.com",
        category="Therapist-led",
        description="Online mental health care platform including CBT-based therapy pathways.",
        difficulty_level="Intermediate",
        duration_days=60,
    ),
    SeedProgram(
        title="BetterHelp",
        url="https://www.betterhelp.com",
        category="Therapist-led",
        description="Therapist messaging and live sessions with CBT-informed interventions.",
        difficulty_level="Beginner",
        duration_days=60,
    ),
    SeedProgram(
        title="Thriveworks",
        url="https://www.thriveworks.com",
        category="Therapist-led",
        description="Online and in-person counseling network with CBT options.",
        difficulty_level="Intermediate",
        duration_days=56,
    ),
    SeedProgram(
        title="Amwell",
        url="https://www.amwell.com",
        category="Therapist-led",
        description="Telehealth platform with behavioral health and CBT-aligned therapy services.",
        difficulty_level="Intermediate",
        duration_days=56,
    ),
    SeedProgram(
        title="MindBeacon Guided CBT",
        url="https://www.mindbeacon.com/guided-cbt-programs",
        category="Therapist-led",
        description="Guided CBT programs with coach/therapist support and measurable progress.",
        difficulty_level="Intermediate",
        duration_days=42,
    ),
    SeedProgram(
        title="Wellnite",
        url="https://www.wellnite.com",
        category="Therapist-led",
        description="Digital mental health platform with therapist sessions, including CBT modalities.",
        difficulty_level="Beginner",
        duration_days=42,
    ),
    SeedProgram(
        title="DigiTherapy Nepal CBT",
        url="https://digitherapy.com.np/services/cbt-nepal",
        category="Therapist-led",
        description="CBT service in Nepal with online therapy access.",
        difficulty_level="Beginner",
        duration_days=42,
    ),
    SeedProgram(
        title="MoodGYM",
        url="https://moodgym.com.au",
        category="Self-guided",
        description="Research-backed self-guided internet CBT program developed in Australia.",
        difficulty_level="Beginner",
        duration_days=35,
    ),
    SeedProgram(
        title="e-couch",
        url="https://ecouch.anu.edu.au",
        category="Self-guided",
        description="Self-help modules and tools based on CBT and related therapies.",
        difficulty_level="Beginner",
        duration_days=35,
    ),
    SeedProgram(
        title="THIS WAY UP",
        url="https://thiswayup.org.au",
        category="Self-guided",
        description="Clinically validated online courses using CBT principles.",
        difficulty_level="Intermediate",
        duration_days=42,
    ),
    SeedProgram(
        title="Beating the Blues",
        url="https://beatingtheblues.co.uk",
        category="Self-guided",
        description="Digital CBT program commonly used in healthcare systems.",
        difficulty_level="Intermediate",
        duration_days=56,
    ),
    SeedProgram(
        title="Living Life to the Full",
        url="https://llttf.com",
        category="Self-guided",
        description="Structured CBT life-skills modules for wellbeing and low mood.",
        difficulty_level="Beginner",
        duration_days=35,
    ),
    SeedProgram(
        title="CCI Looking After Yourself",
        url="https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself",
        category="Self-guided",
        description="Public CBT-oriented self-help workbooks and mental health resources.",
        difficulty_level="Beginner",
        duration_days=28,
    ),
    SeedProgram(
        title="MoodKit",
        url="https://www.moodkitapp.com",
        category="App-based CBT tool",
        description="CBT-focused app with mood tracking, journaling, and thought records.",
        difficulty_level="Beginner",
        duration_days=28,
    ),
    SeedProgram(
        title="MindShift CBT",
        url="https://www.mindshiftcbt.com",
        category="App-based CBT tool",
        description="CBT app for anxiety support, coping plans, and symptom tracking.",
        difficulty_level="Beginner",
        duration_days=28,
    ),
    SeedProgram(
        title="Woebot Health",
        url="https://woebothealth.com",
        category="App-based CBT tool",
        description="Conversational mental health tool using CBT-informed techniques.",
        difficulty_level="Beginner",
        duration_days=21,
    ),
    SeedProgram(
        title="What's Up?",
        url="https://www.whatssupapp.com",
        category="App-based CBT tool",
        description="CBT and ACT inspired app for mood/anxiety coping and tracking.",
        difficulty_level="Beginner",
        duration_days=21,
    ),
    SeedProgram(
        title="CBT Online Training",
        url="https://cbtonlinetraining.com",
        category="CBT course",
        description="Online CBT learning and training resources (non-therapy).",
        difficulty_level="Intermediate",
        duration_days=30,
    ),
    SeedProgram(
        title="Elevify CBT Course",
        url="https://www.elevify.com/en-us/courses/health-and-medicine/psychology/cognitive-behavioral-therapy-cbt-course-a91a8",
        category="CBT course",
        description="General CBT course content for learning and training (non-therapy).",
        difficulty_level="Beginner",
        duration_days=21,
    ),
]


def _normalize_url(url: str) -> str:
    return url.strip().lower().rstrip("/")


def _build_description(item: SeedProgram) -> str:
    return f"{item.description} Category: {item.category}."


def seed_icbt_programs(db: Session) -> tuple[int, int, int]:
    created = 0
    updated = 0
    skipped_duplicates = 0

    seen_urls: set[str] = set()
    for item in SEED_PROGRAMS:
        normalized_url = _normalize_url(item.url)
        if normalized_url in seen_urls:
            skipped_duplicates += 1
            continue
        seen_urls.add(normalized_url)

        existing = (
            db.query(ICBTProgram)
            .filter(ICBTProgram.url.isnot(None))
            .filter(ICBTProgram.url.ilike(item.url))
            .first()
        )

        if existing is None:
            db.add(
                ICBTProgram(
                    title=item.title,
                    description=_build_description(item),
                    difficulty_level=item.difficulty_level,
                    duration_days=item.duration_days,
                    url=item.url,
                )
            )
            created += 1
            continue

        existing.title = item.title
        existing.description = _build_description(item)
        existing.difficulty_level = item.difficulty_level
        existing.duration_days = item.duration_days
        updated += 1

    db.commit()
    return created, updated, skipped_duplicates


def main() -> None:
    db = SessionLocal()
    try:
        created, updated, skipped_duplicates = seed_icbt_programs(db)
        print(
            "ICBT seed completed.",
            f"created={created}",
            f"updated={updated}",
            f"skipped_duplicates_in_seed={skipped_duplicates}",
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
