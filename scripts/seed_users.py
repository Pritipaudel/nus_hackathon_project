"""Seed users into the database.

Run from project root:
    uv run python scripts/seed_users.py
"""

from __future__ import annotations

import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from dataclasses import dataclass

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from backend.core.database import SessionLocal
from backend.models.user import User, USER_PATIENT_ROLE, USER_HEALTH_WORKER_ROLE

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEFAULT_PASSWORD = "Nepal@2025"


@dataclass(frozen=True)
class SeedUser:
    email: str
    first_name: str
    last_name: str
    anonymous_username: str
    role: str = USER_PATIENT_ROLE


SEED_USERS: list[SeedUser] = [
    # --- Patients ---
    SeedUser(
        email="aarav.budhathoki@gmail.com",
        first_name="Aarav",
        last_name="Budhathoki",
        anonymous_username="quiet_himalaya",
        role=USER_PATIENT_ROLE,
    ),
    SeedUser(
        email="sita.thapa@gmail.com",
        first_name="Sita",
        last_name="Thapa",
        anonymous_username="peaceful_pasang",
        role=USER_PATIENT_ROLE,
    ),
    SeedUser(
        email="bikash.rai@gmail.com",
        first_name="Bikash",
        last_name="Rai",
        anonymous_username="silent_trishul",
        role=USER_PATIENT_ROLE,
    ),
    SeedUser(
        email="puja.gurung@gmail.com",
        first_name="Puja",
        last_name="Gurung",
        anonymous_username="hopeful_yak",
        role=USER_PATIENT_ROLE,
    ),
    SeedUser(
        email="rohan.tamang@gmail.com",
        first_name="Rohan",
        last_name="Tamang",
        anonymous_username="wandering_sherpa",
        role=USER_PATIENT_ROLE,
    ),
    SeedUser(
        email="anita.magar@gmail.com",
        first_name="Anita",
        last_name="Magar",
        anonymous_username="calm_gandaki",
        role=USER_PATIENT_ROLE,
    ),
    SeedUser(
        email="suresh.bhandari@gmail.com",
        first_name="Suresh",
        last_name="Bhandari",
        anonymous_username="strong_pokhara",
        role=USER_PATIENT_ROLE,
    ),
    SeedUser(
        email="manisha.manandhar@gmail.com",
        first_name="Manisha",
        last_name="Manandhar",
        anonymous_username="brave_bagmati",
        role=USER_PATIENT_ROLE,
    ),
    SeedUser(
        email="dipesh.karki@gmail.com",
        first_name="Dipesh",
        last_name="Karki",
        anonymous_username="rising_koshi",
        role=USER_PATIENT_ROLE,
    ),
    SeedUser(
        email="samjhana.limbu@gmail.com",
        first_name="Samjhana",
        last_name="Limbu",
        anonymous_username="gentle_mustang",
        role=USER_PATIENT_ROLE,
    ),
    # --- Health Workers ---
    SeedUser(
        email="dr.priya.shrestha@tuth.edu.np",
        first_name="Priya",
        last_name="Shrestha",
        anonymous_username="dr_shrestha",
        role=USER_HEALTH_WORKER_ROLE,
    ),
    SeedUser(
        email="dr.rajan.acharya@pahs.edu.np",
        first_name="Rajan",
        last_name="Acharya",
        anonymous_username="dr_acharya",
        role=USER_HEALTH_WORKER_ROLE,
    ),
    SeedUser(
        email="dr.sunita.poudel@bpkihs.edu.np",
        first_name="Sunita",
        last_name="Poudel",
        anonymous_username="dr_poudel",
        role=USER_HEALTH_WORKER_ROLE,
    ),
    SeedUser(
        email="dr.nabin.regmi@nmcth.edu.np",
        first_name="Nabin",
        last_name="Regmi",
        anonymous_username="dr_regmi",
        role=USER_HEALTH_WORKER_ROLE,
    ),
    SeedUser(
        email="dr.kabita.joshi@kist.edu.np",
        first_name="Kabita",
        last_name="Joshi",
        anonymous_username="dr_joshi",
        role=USER_HEALTH_WORKER_ROLE,
    ),
]


def seed_users(db: Session) -> tuple[int, int]:
    created = 0
    skipped = 0

    for item in SEED_USERS:
        existing = db.query(User).filter(User.email == item.email).first()
        if existing:
            skipped += 1
            continue

        db.add(
            User(
                email=item.email,
                first_name=item.first_name,
                last_name=item.last_name,
                anonymous_username=item.anonymous_username,
                hashed_password=pwd_context.hash(DEFAULT_PASSWORD),
                role=item.role,
                is_active=True,
                is_onboarded=True,
                onboarding_step=0,
            )
        )
        created += 1

    db.commit()
    return created, skipped


def main() -> None:
    db = SessionLocal()
    try:
        created, skipped = seed_users(db)
        print(
            "Users seed completed.",
            f"created={created}",
            f"skipped_existing={skipped}",
            f"\nDefault password for all users: {DEFAULT_PASSWORD}",
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()