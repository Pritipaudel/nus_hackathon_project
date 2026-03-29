"""Seed health workers into the database.

Run from project root:
    uv run python scripts/seed_health_workers.py

Note: Requires community groups to be seeded first (seed_community.py).
"""

from __future__ import annotations

import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from dataclasses import dataclass

from sqlalchemy.orm import Session

from backend.core.database import SessionLocal
import backend.models.community  # noqa: F401
from backend.models.health_worker import HealthWorker
from backend.models.community import CommunityGroup



@dataclass(frozen=True)
class SeedHealthWorker:
    username: str
    organization: str
    title: str
    bio: str
    specialties: str
    languages: str
    availability: str
    sessions_count: int
    community_group_value: str | None = None  # matches CommunityGroup.value


SEED_HEALTH_WORKERS: list[SeedHealthWorker] = [
    SeedHealthWorker(
        username="dr_priya_shrestha",
        organization="Tribhuvan University Teaching Hospital, Kathmandu",
        title="Psychiatrist",
        bio=(
            "Dr. Priya Shrestha is a board-certified psychiatrist with 12 years of "
            "experience treating depression, anxiety, and trauma in Nepal. She trained "
            "at TUTH and completed a fellowship in CBT at NIMHANS, Bangalore. She is "
            "passionate about reducing mental health stigma in Nepali society."
        ),
        specialties="Depression, Anxiety Disorders, CBT, Trauma-Informed Care",
        languages="Nepali, English, Newari",
        availability="available",
        sessions_count=340,
        community_group_value="Women",
    ),
    SeedHealthWorker(
        username="dr_rajan_acharya",
        organization="Patan Academy of Health Sciences, Lalitpur",
        title="Clinical Psychologist",
        bio=(
            "Dr. Rajan Acharya specializes in cognitive behavioural therapy and "
            "mindfulness-based interventions. He has worked extensively with earthquake "
            "survivors from the 2015 Gorkha disaster and with communities in remote "
            "hill districts of Nepal."
        ),
        specialties="CBT, PTSD, Disaster Mental Health, Mindfulness",
        languages="Nepali, English, Hindi",
        availability="available",
        sessions_count=215,
        community_group_value="Earthquake-Survivors",
    ),
    SeedHealthWorker(
        username="dr_sunita_poudel",
        organization="BP Koirala Institute of Health Sciences, Dharan",
        title="Counselling Psychologist",
        bio=(
            "Dr. Sunita Poudel is based in Dharan and serves communities across "
            "Koshi Province. She specialises in adolescent mental health, academic "
            "stress, and supporting Nepali youth navigating identity challenges. "
            "She conducts sessions in Nepali, Maithili, and English."
        ),
        specialties="Adolescent Mental Health, Academic Stress, Identity Issues, DBT",
        languages="Nepali, Maithili, English",
        availability="available",
        sessions_count=178,
        community_group_value="Youth-Nepal",
    ),
    SeedHealthWorker(
        username="dr_nabin_regmi",
        organization="National Medical College & Teaching Hospital, Birgunj",
        title="Psychiatrist",
        bio=(
            "Dr. Nabin Regmi serves patients in the Madhesh Province, focusing on "
            "culturally sensitive mental health care for Madhesi and Tharu communities. "
            "He has led multiple mental health awareness camps in rural Terai districts."
        ),
        specialties="Community Psychiatry, Substance Use Disorders, Family Therapy",
        languages="Nepali, Maithili, Bhojpuri, Hindi, English",
        availability="available",
        sessions_count=290,
        community_group_value="Madhesi",
    ),
    SeedHealthWorker(
        username="dr_kabita_joshi",
        organization="KIST Medical College, Lalitpur",
        title="Psychotherapist",
        bio=(
            "Dr. Kabita Joshi is a licensed psychotherapist with deep expertise in "
            "gender-based trauma, women's mental health, and LGBTQ+ affirmative "
            "therapy. She is one of Nepal's leading voices for queer-inclusive "
            "mental healthcare and has trained over 50 counsellors nationwide."
        ),
        specialties="Gender-Based Trauma, LGBTQ+ Affirmative Therapy, Feminist Therapy",
        languages="Nepali, English",
        availability="available",
        sessions_count=412,
        community_group_value="LGBTQ+",
    ),
    SeedHealthWorker(
        username="mr_dipak_tamang",
        organization="Transcultural Psychosocial Organization Nepal (TPO Nepal)",
        title="Psychosocial Counsellor",
        bio=(
            "Dipak Tamang is a senior psychosocial counsellor at TPO Nepal with 8 "
            "years of field experience in mountain and hill districts. He specialises "
            "in supporting Tamang, Gurung, and Sherpa communities using culturally "
            "adapted mental health approaches rooted in local traditions."
        ),
        specialties="Psychosocial Support, Grief Counselling, Community-Based Mental Health",
        languages="Nepali, Tamang, Gurung, English",
        availability="available",
        sessions_count=156,
        community_group_value="Janajati",
    ),
    SeedHealthWorker(
        username="ms_rekha_devi_sah",
        organization="Mental Health Foundation Nepal, Kathmandu",
        title="Mental Health Nurse & Counsellor",
        bio=(
            "Rekha Devi Sah is a registered mental health nurse and certified "
            "counsellor who works primarily with Dalit communities and migrant worker "
            "families. She conducts community outreach in Madhesh and Bagmati provinces "
            "and is an advocate for intersectional mental health care in Nepal."
        ),
        specialties="Community Mental Health, Stigma Reduction, Dalit Wellbeing, Anxiety",
        languages="Nepali, Maithili, Hindi, Bhojpuri",
        availability="busy",
        sessions_count=203,
        community_group_value="Dalit",
    ),
    SeedHealthWorker(
        username="dr_arun_basnet",
        organization="Scheer Memorial Hospital, Banepa",
        title="Psychiatrist",
        bio=(
            "Dr. Arun Basnet provides psychiatric services to communities in "
            "Kavrepalanchok and surrounding districts. He has a special interest in "
            "integrating spiritual and religious coping mechanisms into evidence-based "
            "treatment for Hindu and Buddhist patients."
        ),
        specialties="Integration of Spirituality in Therapy, Depression, OCD, Anxiety",
        languages="Nepali, English, Newari",
        availability="available",
        sessions_count=187,
        community_group_value="Hindu",
    ),
]


def seed_health_workers(db: Session) -> tuple[int, int]:
    created = 0
    skipped = 0

    for item in SEED_HEALTH_WORKERS:
        existing = (
            db.query(HealthWorker)
            .filter(HealthWorker.username == item.username)
            .first()
        )
        if existing:
            skipped += 1
            continue

        community_id = None
        if item.community_group_value:
            group = (
                db.query(CommunityGroup)
                .filter(CommunityGroup.value == item.community_group_value)
                .first()
            )
            if group:
                community_id = group.id
            else:
                print(
                    f"  [WARN] Community group '{item.community_group_value}' not found "
                    f"for {item.username} — community_id will be null."
                )

        db.add(
            HealthWorker(
                username=item.username,
                organization=item.organization,
                title=item.title,
                bio=item.bio,
                specialties=item.specialties,
                languages=item.languages,
                availability=item.availability,
                sessions_count=item.sessions_count,
                community_id=community_id,
                is_verified=True,
            )
        )
        created += 1

    db.commit()
    return created, skipped


def main() -> None:
    db = SessionLocal()
    try:
        created, skipped = seed_health_workers(db)
        print(
            "Health workers seed completed.",
            f"created={created}",
            f"skipped_existing={skipped}",
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()