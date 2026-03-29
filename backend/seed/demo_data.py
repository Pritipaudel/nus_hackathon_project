"""
Demo seed: 1 health worker (login) + 8 patients, meetings with Dr. Priya Nair.

- On app startup, `run_demo_seed_if_needed()` runs once if `worker@demo.com` is absent.
- Manual run from project root:
    PYTHONPATH=. uv run python scripts/seed_demo_data.py
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

from sqlalchemy import and_, or_
from sqlalchemy.exc import OperationalError, ProgrammingError

# Load all models so SQLAlchemy relationships resolve.
import backend.models.user  # noqa: F401
import backend.models.community  # noqa: F401
import backend.models.icbt  # noqa: F401
import backend.models.health_worker  # noqa: F401

from backend.core.database import SessionLocal
from backend.models.direct_message import DirectMessage
from backend.models.community import CommunityGroup, CommunityPost
from backend.models.health_worker import (
    Certification,
    HealthWorker,
    Meeting,
    MeetingStatus,
    TrainingProgram,
    UserCertification,
    TrainingEnrollment,
)
from backend.models.icbt import ICBTProgram, UserICBTProgramProgress
from backend.models.user import User, USER_PATIENT_ROLE, USER_HEALTH_WORKER_ROLE
from backend.repository.health_worker_repository import HealthWorkerRepository
from backend.services.auth_service import hash_password

logger = logging.getLogger(__name__)

DEMO_PASSWORD = "Demo1234!"
WORKER_EMAIL = "worker@demo.com"

# 8 patients — all have meetings with the demo worker
ALL_PATIENTS = [
    {"email": "patient@demo.com", "first_name": "Shubham", "last_name": "Patel", "username": "anon_shubham"},
    {"email": "patient2@demo.com", "first_name": "Mei", "last_name": "Tan", "username": "anon_meitan"},
    {"email": "patient3@demo.com", "first_name": "Arjun", "last_name": "Sharma", "username": "anon_arjun"},
    {"email": "patient4@demo.com", "first_name": "Nurul", "last_name": "Huda", "username": "anon_nurul"},
    {"email": "patient5@demo.com", "first_name": "Wei", "last_name": "Liang", "username": "anon_weiliang"},
    {"email": "patient6@demo.com", "first_name": "Preethi", "last_name": "Rajan", "username": "anon_preethi"},
    {"email": "patient7@demo.com", "first_name": "Faizal", "last_name": "Ahmad", "username": "anon_faizal"},
    {"email": "patient8@demo.com", "first_name": "Sonia", "last_name": "Mendes", "username": "anon_sonia"},
]


def _now(offset_days: int = 0) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=offset_days)


def worker_demo_photo_url(display_name: str) -> str:
    seed = quote(display_name.replace(".", "").replace(" ", ""), safe="")
    return f"https://api.dicebear.com/7.x/avataaars/png?seed={seed}&size=256"


def create_user(db, email, first_name, last_name, username, role) -> User:
    user = User(
        email=email,
        first_name=first_name,
        last_name=last_name,
        anonymous_username=username,
        hashed_password=hash_password(DEMO_PASSWORD),
        role=role,
        is_onboarded=True,
    )
    db.add(user)
    db.flush()
    print(f"  [user] {email}")
    return user


def create_health_worker(
    db,
    user_id,
    username,
    organization,
    community_id,
    title,
    bio,
    specialties,
    languages,
    availability,
    sessions_count,
    is_verified,
    photo_url: str | None = None,
) -> HealthWorker:
    hw = HealthWorker(
        id=user_id,
        username=username,
        organization=organization,
        community_id=community_id,
        title=title,
        bio=bio,
        specialties=specialties,
        languages=languages,
        availability=availability,
        sessions_count=sessions_count,
        is_verified=is_verified,
        photo_url=photo_url,
    )
    db.add(hw)
    db.flush()
    print(f"  [health_worker] {username} (id={user_id})")
    return hw


def create_health_worker_profile_only(
    db,
    username,
    organization,
    community_id,
    title,
    bio,
    specialties,
    languages,
    availability,
    sessions_count,
    is_verified,
    photo_url: str | None = None,
) -> HealthWorker:
    hw = HealthWorker(
        username=username,
        organization=organization,
        community_id=community_id,
        title=title,
        bio=bio,
        specialties=specialties,
        languages=languages,
        availability=availability,
        sessions_count=sessions_count,
        is_verified=is_verified,
        photo_url=photo_url,
    )
    db.add(hw)
    db.flush()
    print(f"  [catalogue worker] {username}")
    return hw


def book_meeting(db, patient_id, health_worker_id, offset_days) -> Meeting:
    scheduled = _now(offset_days)
    m = Meeting(
        user_id=patient_id,
        health_worker_id=health_worker_id,
        scheduled_at=scheduled,
        meeting_link=f"https://meet.demo.local/session-{patient_id}",
        status=MeetingStatus.SCHEDULED.value,
    )
    db.add(m)
    db.flush()
    return m


def _insert_nepali_demo_messages(
    db,
    worker_user_id: uuid.UUID,
    patient_user_id: uuid.UUID,
) -> None:
    now = datetime.now(timezone.utc)
    thread = [
        (
            worker_user_id,
            patient_user_id,
            "नमस्ते, म तपाईंको मानसिक स्वास्थ्य समर्थक हुँ। आज तपाईंलाई कस्तो महसुस भइरहेको छ?",
            timedelta(minutes=45),
        ),
        (
            patient_user_id,
            worker_user_id,
            "नमस्ते। म चिन्ता र तनावले गर्दा राति राम्रोसँग निदाउन गाह्रो भइरहेको छ।",
            timedelta(minutes=43),
        ),
        (
            worker_user_id,
            patient_user_id,
            "यो सुनेँ। निद्रा र चिन्ता धेरै जनासँगै देखा पर्छ—तपाईं एक्लै हुनुहुन्न। बिस्तारै सास फेर्ने अभ्यासबाट सुरु गर्न सकिन्छ।",
            timedelta(minutes=41),
        ),
        (
            patient_user_id,
            worker_user_id,
            "म त्यस्तै प्रयास गर्न चाहन्छु। धन्यवाद।",
            timedelta(minutes=39),
        ),
        (
            worker_user_id,
            patient_user_id,
            "राम्रो। अर्को सत्रमा हामी सुत्ने समयको दिनचर्या सजिलो बनाउने तरिका पनि हेरौँला।",
            timedelta(minutes=37),
        ),
    ]
    for sender_id, recipient_id, body, ago in thread:
        db.add(
            DirectMessage(
                sender_id=sender_id,
                recipient_id=recipient_id,
                body=body,
                created_at=now - ago,
            )
        )
    db.flush()


def ensure_demo_direct_messages() -> None:
    """
    If demo worker + first demo patient exist, share a meeting, and the thread
    has no messages yet, insert a short Nepali mental-health conversation.
    Safe on every startup (idempotent). Skips if table is missing (migration not run).
    """
    db = SessionLocal()
    try:
        worker = db.query(User).filter(User.email == WORKER_EMAIL).first()
        patient = db.query(User).filter(User.email == ALL_PATIENTS[0]["email"]).first()
        if worker is None or patient is None:
            return

        hw_repo = HealthWorkerRepository(db)
        if not hw_repo.worker_has_patient_meeting(worker.id, patient.id):
            return

        existing = (
            db.query(DirectMessage.id)
            .filter(
                or_(
                    and_(
                        DirectMessage.sender_id == worker.id,
                        DirectMessage.recipient_id == patient.id,
                    ),
                    and_(
                        DirectMessage.sender_id == patient.id,
                        DirectMessage.recipient_id == worker.id,
                    ),
                )
            )
            .limit(1)
            .first()
        )
        if existing is not None:
            return

        _insert_nepali_demo_messages(db, worker.id, patient.id)
        db.commit()
        logger.info("Inserted Nepali demo direct messages for %s / %s.", WORKER_EMAIL, ALL_PATIENTS[0]["email"])
    except (ProgrammingError, OperationalError) as exc:
        db.rollback()
        logger.warning("Skipping demo direct messages (database): %s", exc)
    except Exception:
        db.rollback()
        logger.exception("ensure_demo_direct_messages failed")
    finally:
        db.close()


def assign_cert(db, user_id, cert_id):
    uc = UserCertification(
        user_id=user_id,
        certification_id=cert_id,
        issued_at=_now(-30),
        verified=True,
    )
    db.add(uc)
    db.flush()


def enroll_training(db, user_id, program_id):
    te = TrainingEnrollment(user_id=user_id, program_id=program_id)
    db.add(te)
    db.flush()


def enroll_icbt(db, user_id, program_id, progress, status, days_ago):
    entry = UserICBTProgramProgress(
        user_id=user_id,
        program_id=program_id,
        progress_percent=progress,
        status=status,
        started_at=_now(-days_ago),
        last_activity_at=_now(-1),
        completed_at=_now(-1) if status == "COMPLETED" else None,
    )
    db.add(entry)
    db.flush()


def add_post(db, user_id, group_id, content, category="GENERAL"):
    post = CommunityPost(
        user_id=user_id,
        community_group_id=group_id,
        content=content,
        category=category,
        created_at=_now(-2),
    )
    db.add(post)
    db.flush()


def run_demo_seed() -> None:
    db = SessionLocal()
    try:
        print("\nCreating community groups...")
        anxiety_group = CommunityGroup(name="Anxiety Support Circle", group_type="CUSTOM", value="anxiety_support")
        sleep_group = CommunityGroup(name="Sleep & Recovery", group_type="CUSTOM", value="sleep_recovery")
        mood_group = CommunityGroup(name="Low Mood Collective", group_type="CUSTOM", value="low_mood")
        db.add_all([anxiety_group, sleep_group, mood_group])
        db.flush()
        db.commit()
        print(f"  groups: {anxiety_group.name}, {sleep_group.name}, {mood_group.name}")

        print("\nCreating iCBT programmes...")
        prog_anxiety = ICBTProgram(
            title="Understanding Anxiety",
            description="A structured iCBT programme to identify anxiety triggers and build coping strategies using cognitive restructuring techniques.",
            difficulty_level="Beginner",
            duration_days=21,
            url="https://mindbridge.app/programs/anxiety",
        )
        prog_sleep = ICBTProgram(
            title="Sleep & Recovery",
            description="Cognitive and behavioural techniques specifically designed to address sleep disturbances and restore healthy sleep patterns.",
            difficulty_level="Intermediate",
            duration_days=14,
            url="https://mindbridge.app/programs/sleep",
        )
        prog_mood = ICBTProgram(
            title="Managing Low Mood",
            description="Evidence-based modules targeting negative thought patterns associated with depression and persistent low mood.",
            difficulty_level="Beginner",
            duration_days=30,
            url="https://mindbridge.app/programs/low-mood",
        )
        prog_burnout = ICBTProgram(
            title="Stress & Burnout Reset",
            description="A focused programme on identifying workplace and personal stressors, setting boundaries, and building resilience.",
            difficulty_level="Intermediate",
            duration_days=28,
            url="https://mindbridge.app/programs/burnout",
        )
        db.add_all([prog_anxiety, prog_sleep, prog_mood, prog_burnout])
        db.flush()
        db.commit()
        print(f"  {prog_anxiety.title}, {prog_sleep.title}, {prog_mood.title}, {prog_burnout.title}")

        print("\nCreating certifications...")
        cert_mha = Certification(
            title="Mental Health Awareness",
            organization="WHO",
            description="Certification in Mental Health Awareness awarded by WHO.",
        )
        cert_cbt = Certification(
            title="CBT Fundamentals",
            organization="Institute of Mental Health",
            description="Certification in CBT Fundamentals awarded by Institute of Mental Health.",
        )
        cert_mhfa = Certification(
            title="Mental Health First Aid",
            organization="Mental Health Commission of Singapore",
            description="Qualification in providing first-line mental health support.",
        )
        db.add_all([cert_mha, cert_cbt, cert_mhfa])
        db.flush()
        db.commit()

        print("\nCreating training programmes...")
        tp_mhfa = TrainingProgram(
            title="Mental Health First Aid",
            organization="Mental Health Commission of Singapore",
            description="Professional training programme: Mental Health First Aid.",
            is_verified=True,
        )
        tp_cbt = TrainingProgram(
            title="CBT Fundamentals for Practitioners",
            organization="Institute of Mental Health",
            description="Professional training programme: CBT Fundamentals for Practitioners.",
            is_verified=True,
        )
        db.add_all([tp_mhfa, tp_cbt])
        db.flush()
        db.commit()

        print("\nCreating health worker user...")
        worker_user = create_user(
            db,
            email=WORKER_EMAIL,
            first_name="Priya",
            last_name="Nair",
            username="dr_priya",
            role=USER_HEALTH_WORKER_ROLE,
        )
        db.commit()

        print("\nCreating Dr. Priya Nair health worker profile...")
        hw = create_health_worker(
            db,
            user_id=worker_user.id,
            username="Dr. Priya Nair",
            organization="Institute of Mental Health",
            community_id=anxiety_group.id,
            title="Registered Counsellor",
            bio="Registered counsellor with 8 years working in community mental health across Singapore and South India. Specialises in anxiety management and trauma-informed care.",
            specialties="Anxiety,Trauma,CBT",
            languages="English,Tamil",
            availability="available",
            sessions_count=412,
            is_verified=True,
            photo_url=worker_demo_photo_url("DrPriyaNair"),
        )
        db.commit()
        print(f"  HealthWorker.id = {hw.id}  (== worker_user.id = {worker_user.id})")

        print("\nCreating catalogue health worker profiles...")
        create_health_worker_profile_only(
            db,
            "Ahmad Farouk",
            "SAMH",
            anxiety_group.id,
            "Mental Health Worker",
            "Community mental health worker trained by SAMH. Focuses on depression recovery and grief counselling with a culturally sensitive approach.",
            "Depression,Grief,Mindfulness",
            "English,Malay",
            "available",
            287,
            True,
            photo_url=worker_demo_photo_url("AhmadFarouk"),
        )
        create_health_worker_profile_only(
            db,
            "Chen Wei",
            "Fei Yue Community Services",
            mood_group.id,
            "Bilingual Counsellor",
            "Bilingual counsellor supporting Mandarin and Cantonese-speaking communities in navigating cultural identity, family dynamics, and relationship difficulties.",
            "Cultural stress,Family,Relationships",
            "English,Mandarin,Cantonese",
            "busy",
            190,
            True,
            photo_url=worker_demo_photo_url("ChenWei"),
        )
        create_health_worker_profile_only(
            db,
            "Dr. Sunita Kapoor",
            "National Healthcare Group",
            sleep_group.id,
            "Clinical Psychologist",
            "Clinical psychologist with a focus on sleep medicine and occupational burnout. Works with healthcare workers and corporate professionals.",
            "Sleep disorders,Burnout,Stress",
            "English",
            "available",
            634,
            True,
            photo_url=worker_demo_photo_url("SunitaKapoor"),
        )
        create_health_worker_profile_only(
            db,
            "Marcus Raj",
            "TOUCH Community Services",
            anxiety_group.id,
            "Youth Counsellor",
            "Youth counsellor supporting students aged 13–25 with academic stress, identity, and mental health challenges in school settings.",
            "Youth mental health,Adolescence,School stress",
            "English,Hindi",
            "away",
            145,
            True,
            photo_url=worker_demo_photo_url("MarcusRaj"),
        )
        create_health_worker_profile_only(
            db,
            "Layla Aziz",
            "Mindfulness SG",
            mood_group.id,
            "Wellness Consultant",
            "Workplace wellbeing consultant and certified mindfulness trainer. Partners with organisations on resilience and mental fitness programmes.",
            "Workplace wellbeing,Burnout,Resilience",
            "English,Bahasa",
            "available",
            88,
            False,
            photo_url=worker_demo_photo_url("LaylaAziz"),
        )
        db.commit()

        print("\nCreating 8 patients and booking sessions with Dr. Priya Nair...")
        for idx, info in enumerate(ALL_PATIENTS):
            patient = create_user(
                db,
                email=info["email"],
                first_name=info["first_name"],
                last_name=info["last_name"],
                username=info["username"],
                role=USER_PATIENT_ROLE,
            )
            db.commit()

            book_meeting(db, patient.id, hw.id, offset_days=idx + 2)
            if idx % 3 == 0:
                book_meeting(db, patient.id, hw.id, offset_days=idx + 10)
            db.commit()

            if idx % 2 == 0:
                assign_cert(db, patient.id, cert_mha.id)
            if idx % 3 == 0:
                assign_cert(db, patient.id, cert_mhfa.id)
            db.commit()

            if idx == 0:
                enroll_training(db, patient.id, tp_mhfa.id)
                enroll_icbt(db, patient.id, prog_anxiety.id, progress=45, status="ACTIVE", days_ago=10)
                enroll_icbt(db, patient.id, prog_sleep.id, progress=100, status="COMPLETED", days_ago=20)
                db.commit()

            if idx % 2 == 0:
                add_post(
                    db,
                    patient.id,
                    anxiety_group.id,
                    f"Finding it helpful to track my triggers this week. Module {idx + 1} techniques are making a difference.",
                    category="ANXIETY",
                )
                db.commit()

            print(f"  patient {idx + 1}: {info['email']} → meeting booked with Dr. Priya Nair (hw.id={hw.id})")

        print("\n" + "=" * 65)
        print("Demo data seeded successfully!")
        print("=" * 65)
        print(f"  Worker   : {WORKER_EMAIL}   /  {DEMO_PASSWORD}")
        for i, info in enumerate(ALL_PATIENTS, 1):
            print(f"  Patient {i}: {info['email']}  /  {DEMO_PASSWORD}")
        print("=" * 65)
        print(f"\n  Dr. Priya Nair HealthWorker.id = {hw.id}")
        print(f"  worker@demo.com     User.id      = {worker_user.id}")
        print("  (These must be equal for /meetings/worker to work ✓)")
        print("=" * 65)

    except Exception as exc:
        db.rollback()
        print(f"\n[ERROR] {exc}")
        raise
    finally:
        db.close()


def run_demo_seed_if_needed() -> bool:
    """
    Seed demo worker + 8 patients if the demo worker user does not exist.
    Safe to call on every app startup.
    """
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == WORKER_EMAIL).first()
        if existing is not None:
            logger.info("Demo seed skipped: %s already exists.", WORKER_EMAIL)
            return False
    finally:
        db.close()

    logger.info("Running demo seed (1 worker + %s patients)...", len(ALL_PATIENTS))
    run_demo_seed()
    return True
