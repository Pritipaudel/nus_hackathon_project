"""Seed training programs and enrollments into the database.

Run from project root:
    uv run python scripts/seed_training.py

Note: Requires users to be seeded first (seed_users.py).
"""

from __future__ import annotations

import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from backend.core.database import SessionLocal
from backend.models.health_worker import TrainingProgram, TrainingEnrollment
from backend.models.user import User


@dataclass(frozen=True)
class SeedTrainingProgram:
    title: str
    organization: str
    description: str


@dataclass(frozen=True)
class SeedEnrollment:
    user_email: str
    program_title: str


SEED_TRAINING_PROGRAMS: list[SeedTrainingProgram] = [
    SeedTrainingProgram(
        title="Mental Health First Aid Nepal",
        organization="Mental Health Foundation Nepal",
        description=(
            "A nationally recognised 8-hour training program equipping community "
            "members, teachers, and health workers with skills to identify and respond "
            "to mental health crises. Developed with Nepali cultural context in mind, "
            "covering depression, anxiety, psychosis, and suicide first response."
        ),
    ),
    SeedTrainingProgram(
        title="Psychosocial Support in Disaster Settings",
        organization="Transcultural Psychosocial Organization Nepal (TPO Nepal)",
        description=(
            "Specialised training for field workers responding to natural disasters "
            "in Nepal — earthquakes, floods, and landslides. Covers psychological "
            "first aid, community-based psychosocial support, and resilience building "
            "for affected populations in remote districts."
        ),
    ),
    SeedTrainingProgram(
        title="CBT Fundamentals for Community Health Workers",
        organization="Patan Academy of Health Sciences",
        description=(
            "A 4-week certificate course introducing Cognitive Behavioural Therapy "
            "principles to frontline community health workers (FCHVs) and health "
            "volunteers across Nepal. Includes Nepali-language workbooks and "
            "role-play scenarios adapted for rural Nepali contexts."
        ),
    ),
    SeedTrainingProgram(
        title="Adolescent Mental Health in Schools",
        organization="UNICEF Nepal / Ministry of Education Nepal",
        description=(
            "Training program for teachers and school counsellors to identify mental "
            "health issues among students aged 10–18. Covers exam stress, bullying, "
            "family pressure, and early signs of depression and anxiety in Nepali "
            "school settings."
        ),
    ),
    SeedTrainingProgram(
        title="Mindfulness-Based Stress Reduction (MBSR) — Nepal Edition",
        organization="Himalayan Mindfulness Institute, Kathmandu",
        description=(
            "An 8-week evidence-based MBSR program adapted for Nepali practitioners, "
            "integrating Buddhist mindfulness traditions with clinical MBSR protocol. "
            "Suitable for both professionals and the general public seeking tools for "
            "stress, anxiety, and burnout management."
        ),
    ),
    SeedTrainingProgram(
        title="Gender-Sensitive Mental Health Care",
        organization="KIST Medical College & Saathi Nepal",
        description=(
            "A training course for health professionals on providing gender-sensitive "
            "and LGBTQ+ affirmative mental healthcare in Nepal. Covers gender-based "
            "violence trauma, feminist counselling approaches, and working with "
            "marginalised gender communities."
        ),
    ),
    SeedTrainingProgram(
        title="Migrant Worker Psychosocial Support",
        organization="Nepal Institute of Mental Health (NIMH)",
        description=(
            "Specialised training for counsellors working with Nepali migrant workers "
            "returning from the Gulf, Malaysia, and East Asia. Addresses depression, "
            "exploitation trauma, family reintegration challenges, and financial stress "
            "through a peer-support and CBT combined model."
        ),
    ),
    SeedTrainingProgram(
        title="Suicide Prevention and Crisis Intervention",
        organization="Koshish Nepal",
        description=(
            "A 3-day intensive training program on suicide risk assessment, safe "
            "messaging, crisis intervention, and postvention support. Developed by "
            "Koshish — Nepal's leading mental health consumer organisation — with "
            "lived-experience perspectives embedded throughout."
        ),
    ),
    SeedTrainingProgram(
        title="Traditional Healing & Modern Psychiatry Integration",
        organization="BP Koirala Institute of Health Sciences",
        description=(
            "An interdisciplinary training exploring the role of traditional Nepali "
            "healing practices (Jhankri, Dhami, Ayurveda) alongside modern psychiatric "
            "care. Designed for mental health professionals to build cultural "
            "competence and collaborative care pathways in rural Nepal."
        ),
    ),
    SeedTrainingProgram(
        title="Trauma-Informed Care for Earthquake Survivors",
        organization="World Health Organization Nepal / Ministry of Health and Population",
        description=(
            "A competency-based training program for healthcare providers working with "
            "communities still affected by the 2015 Gorkha earthquake and subsequent "
            "aftershocks. Covers complex PTSD, community trauma, grief, and "
            "reconstruction of meaning in disaster-affected Nepali communities."
        ),
    ),
]

# Seed a realistic subset of enrollments linking users to programs
SEED_ENROLLMENTS: list[SeedEnrollment] = [
    SeedEnrollment(
        user_email="aarav.budhathoki@gmail.com",
        program_title="Mental Health First Aid Nepal",
    ),
    SeedEnrollment(
        user_email="aarav.budhathoki@gmail.com",
        program_title="Mindfulness-Based Stress Reduction (MBSR) — Nepal Edition",
    ),
    SeedEnrollment(
        user_email="sita.thapa@gmail.com",
        program_title="Adolescent Mental Health in Schools",
    ),
    SeedEnrollment(
        user_email="sita.thapa@gmail.com",
        program_title="Mental Health First Aid Nepal",
    ),
    SeedEnrollment(
        user_email="bikash.rai@gmail.com",
        program_title="Migrant Worker Psychosocial Support",
    ),
    SeedEnrollment(
        user_email="puja.gurung@gmail.com",
        program_title="Gender-Sensitive Mental Health Care",
    ),
    SeedEnrollment(
        user_email="puja.gurung@gmail.com",
        program_title="Mindfulness-Based Stress Reduction (MBSR) — Nepal Edition",
    ),
    SeedEnrollment(
        user_email="rohan.tamang@gmail.com",
        program_title="Trauma-Informed Care for Earthquake Survivors",
    ),
    SeedEnrollment(
        user_email="rohan.tamang@gmail.com",
        program_title="Psychosocial Support in Disaster Settings",
    ),
    SeedEnrollment(
        user_email="anita.magar@gmail.com",
        program_title="CBT Fundamentals for Community Health Workers",
    ),
    SeedEnrollment(
        user_email="suresh.bhandari@gmail.com",
        program_title="Suicide Prevention and Crisis Intervention",
    ),
    SeedEnrollment(
        user_email="manisha.manandhar@gmail.com",
        program_title="Gender-Sensitive Mental Health Care",
    ),
    SeedEnrollment(
        user_email="manisha.manandhar@gmail.com",
        program_title="Mental Health First Aid Nepal",
    ),
    SeedEnrollment(
        user_email="dipesh.karki@gmail.com",
        program_title="Suicide Prevention and Crisis Intervention",
    ),
    SeedEnrollment(
        user_email="dipesh.karki@gmail.com",
        program_title="Mindfulness-Based Stress Reduction (MBSR) — Nepal Edition",
    ),
    SeedEnrollment(
        user_email="samjhana.limbu@gmail.com",
        program_title="Traditional Healing & Modern Psychiatry Integration",
    ),
    # Health workers enrolling in advanced training
    SeedEnrollment(
        user_email="dr.priya.shrestha@tuth.edu.np",
        program_title="Gender-Sensitive Mental Health Care",
    ),
    SeedEnrollment(
        user_email="dr.rajan.acharya@pahs.edu.np",
        program_title="Trauma-Informed Care for Earthquake Survivors",
    ),
    SeedEnrollment(
        user_email="dr.sunita.poudel@bpkihs.edu.np",
        program_title="Adolescent Mental Health in Schools",
    ),
    SeedEnrollment(
        user_email="dr.nabin.regmi@nmcth.edu.np",
        program_title="Migrant Worker Psychosocial Support",
    ),
    SeedEnrollment(
        user_email="dr.kabita.joshi@kist.edu.np",
        program_title="Suicide Prevention and Crisis Intervention",
    ),
]


def seed_training(db: Session) -> tuple[int, int, int, int]:
    programs_created = 0
    programs_skipped = 0
    enrollments_created = 0
    enrollments_skipped = 0

    # --- Seed programs ---
    program_map: dict[str, TrainingProgram] = {}
    for item in SEED_TRAINING_PROGRAMS:
        existing = (
            db.query(TrainingProgram)
            .filter(
                TrainingProgram.title == item.title,
                TrainingProgram.organization == item.organization,
            )
            .first()
        )
        if existing:
            program_map[item.title] = existing
            programs_skipped += 1
            continue

        program = TrainingProgram(
            title=item.title,
            organization=item.organization,
            description=item.description,
            is_verified=True,
        )
        db.add(program)
        db.flush()
        program_map[item.title] = program
        programs_created += 1

    db.flush()

    # --- Seed enrollments ---
    for item in SEED_ENROLLMENTS:
        user = db.query(User).filter(User.email == item.user_email).first()
        if not user:
            print(f"  [WARN] User not found: {item.user_email} — skipping enrollment.")
            enrollments_skipped += 1
            continue

        program = program_map.get(item.program_title)
        if not program:
            print(
                f"  [WARN] Program not found: '{item.program_title}' — skipping enrollment."
            )
            enrollments_skipped += 1
            continue

        existing_enrollment = (
            db.query(TrainingEnrollment)
            .filter(
                TrainingEnrollment.user_id == user.id,
                TrainingEnrollment.program_id == program.id,
            )
            .first()
        )
        if existing_enrollment:
            enrollments_skipped += 1
            continue

        db.add(
            TrainingEnrollment(
                user_id=user.id,
                program_id=program.id,
            )
        )
        enrollments_created += 1

    db.commit()
    return programs_created, programs_skipped, enrollments_created, enrollments_skipped


def main() -> None:
    db = SessionLocal()
    try:
        pc, ps, ec, es = seed_training(db)
        print(
            "Training seed completed.",
            f"programs_created={pc}",
            f"programs_skipped={ps}",
            f"enrollments_created={ec}",
            f"enrollments_skipped={es}",
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()