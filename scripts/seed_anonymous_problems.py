"""Seed anonymous problems into the database.

Run from project root:
    uv run python scripts/seed_anonymous_problems.py

Note: Requires community groups to be seeded first (seed_community.py).
Anonymous problems are not tied to users by design.
"""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from backend.core.database import SessionLocal
import backend.models.community  # noqa: F401
from backend.models.problem import AnonymousProblem
from backend.models.community import CommunityGroup


@dataclass(frozen=True)
class SeedProblem:
    title: str
    description: str
    category: str
    severity_level: int  # 1 (mild) to 5 (severe)
    upvote_count: int
    community_group_value: str | None = None  # matches CommunityGroup.value


SEED_PROBLEMS: list[SeedProblem] = [
    SeedProblem(
        title="Cannot sleep due to fear of another earthquake",
        description=(
            "Ever since the 2015 earthquake I cannot sleep properly. Every small tremor "
            "sends me into a panic. I wake up multiple times at night listening for "
            "sounds. My family thinks I am being dramatic but I genuinely cannot control "
            "it. Does anyone else still feel this 10 years later?"
        ),
        category="Trauma",
        severity_level=4,
        upvote_count=87,
        community_group_value="Earthquake-Survivors",
    ),
    SeedProblem(
        title="Extreme pressure from family to score well in SEE exams",
        description=(
            "My parents have stopped talking to me normally — every conversation is "
            "about my SEE results. I study 14 hours a day but still feel like I will "
            "fail them. I have stopped eating properly and feel nauseous before every "
            "practice test. I am 16 years old and I feel like my whole future depends "
            "on this one exam."
        ),
        category="Anxiety",
        severity_level=4,
        upvote_count=143,
        community_group_value="Youth-Nepal",
    ),
    SeedProblem(
        title="Feeling completely alone working in Malaysia",
        description=(
            "I came to Malaysia 2 years ago to support my family in Jumla. My employer "
            "took my passport for months and I was too scared to complain. Now I have "
            "my passport back but I still feel trapped. I cry every night and miss my "
            "children. I do not know anyone here who speaks Nepali. Is there any "
            "support available?"
        ),
        category="Depression",
        severity_level=5,
        upvote_count=211,
        community_group_value="Migrant-Workers",
    ),
    SeedProblem(
        title="Struggling with caste-based discrimination at my workplace",
        description=(
            "I am a Dalit woman working in a government office in Kathmandu. My "
            "colleagues do not eat with me and make comments about my background. "
            "I have a degree and am qualified for my job but I am constantly made "
            "to feel inferior. I have reported it once but nothing changed. The stress "
            "is affecting my sleep and I feel depressed most days."
        ),
        category="Trauma",
        severity_level=4,
        upvote_count=156,
        community_group_value="Dalit",
    ),
    SeedProblem(
        title="Husband's alcohol addiction is destroying our family",
        description=(
            "My husband drinks every day and becomes violent when drunk. My children "
            "are scared of him and so am I. I cannot leave because I have nowhere to "
            "go and my family says it is my duty to stay. I am from a village in "
            "Sindhupalchok and have no income of my own. I feel completely helpless "
            "and sometimes do not want to continue living."
        ),
        category="Trauma",
        severity_level=5,
        upvote_count=198,
        community_group_value="Women",
    ),
    SeedProblem(
        title="Nobody talks about men's depression in Nepal",
        description=(
            "I have been feeling deeply sad for over a year. I lost my construction "
            "job after getting injured and now cannot support my family. My wife and "
            "parents are stressed because of me. In Nepal men are supposed to be "
            "strong and never complain. I have no one to talk to. I feel like a "
            "burden to everyone around me."
        ),
        category="Depression",
        severity_level=4,
        upvote_count=174,
        community_group_value="Men",
    ),
    SeedProblem(
        title="Severe anxiety about becoming a burden after my stroke",
        description=(
            "I had a stroke 8 months ago at age 52. I cannot work anymore and my "
            "children have to take care of me. I feel terrible guilt and anxiety every "
            "day. I pray every morning but the worry does not leave. My doctor only "
            "talks about physical recovery — nobody has asked about my mental state."
        ),
        category="Anxiety",
        severity_level=3,
        upvote_count=62,
        community_group_value="Hindu",
    ),
    SeedProblem(
        title="Coming out is not possible in my family — I feel invisible",
        description=(
            "I am a 23-year-old from Pokhara. I know I am gay but I cannot tell "
            "anyone. My family is already planning my marriage to a girl I have never "
            "met. I smile and pretend everything is fine but inside I am breaking. "
            "I have thought about ending my life. I do not know where to get help "
            "without my family finding out."
        ),
        category="Depression",
        severity_level=5,
        upvote_count=289,
        community_group_value="LGBTQ+",
    ),
    SeedProblem(
        title="Unable to stop gambling even though it is destroying my finances",
        description=(
            "I started playing cards and sports betting online 2 years ago. I have "
            "lost over 3 lakh rupees and taken loans from multiple people. My wife "
            "does not know. I try to stop but after a few days I always go back. "
            "I feel tremendous shame but cannot help myself. Is there any help "
            "available in Nepal for gambling addiction?"
        ),
        category="Addiction",
        severity_level=4,
        upvote_count=97,
        community_group_value=None,
    ),
    SeedProblem(
        title="Grief after losing my brother to suicide — I blame myself",
        description=(
            "My younger brother took his life 6 months ago. I keep replaying our "
            "last conversation — he seemed fine. I should have asked more questions. "
            "The guilt is overwhelming. My family does not talk about it openly "
            "because of shame. I have no one to grieve with. I am based in Biratnagar "
            "and do not know of any support groups nearby."
        ),
        category="Grief",
        severity_level=5,
        upvote_count=312,
        community_group_value=None,
    ),
    SeedProblem(
        title="Postpartum depression that nobody around me recognises",
        description=(
            "I had my baby 4 months ago. I should be happy but I feel empty, "
            "irritable and cry without reason. My mother-in-law says I am being "
            "ungrateful. My husband thinks I just need rest. Nobody in my village "
            "in Kaski has heard of postpartum depression. I feel like a terrible "
            "mother and cannot bond with my child."
        ),
        category="Depression",
        severity_level=4,
        upvote_count=183,
        community_group_value="Women",
    ),
    SeedProblem(
        title="Academic failure shame in my Brahmin family",
        description=(
            "I failed my first year of engineering at Pulchowk. In my Brahmin family, "
            "education is everything. My father has not spoken to me in 3 weeks. "
            "My relatives already know. I feel deep shame and humiliation. I have "
            "been skipping meals and avoiding everyone. I am not sure I want to "
            "continue my studies or even continue at all."
        ),
        category="Depression",
        severity_level=5,
        upvote_count=227,
        community_group_value="Brahmin-Chhetri",
    ),
    SeedProblem(
        title="Constant stress from load-shedding and pollution in Kathmandu",
        description=(
            "The air quality in Kathmandu has been terrible for months. I have "
            "respiratory problems and my anxiety is much worse on high pollution days. "
            "Combined with the noise, congestion, and water shortages, I feel "
            "chronically on edge. I work from home but cannot open windows. This "
            "environmental stress feels invisible — no one talks about it."
        ),
        category="Stress",
        severity_level=2,
        upvote_count=44,
        community_group_value="Youth-Nepal",
    ),
    SeedProblem(
        title="Forced into priesthood — struggling with identity and purpose",
        description=(
            "My family decided when I was a child that I would become a Brahmin priest "
            "like my father and grandfather. I have followed this path for 10 years but "
            "I feel deeply unfulfilled. I want to study engineering. I cannot tell my "
            "family without breaking their hearts. I feel trapped in a life I did not "
            "choose and do not know who I am anymore."
        ),
        category="Identity",
        severity_level=3,
        upvote_count=78,
        community_group_value="Brahmin-Chhetri",
    ),
    SeedProblem(
        title="Severe OCD thoughts I am too ashamed to describe to anyone",
        description=(
            "I have intrusive thoughts that feel horrifying to me. I know I would "
            "never act on them but they repeat constantly. I perform rituals (checking, "
            "counting, washing) for hours every day. I cannot tell a doctor because the "
            "thoughts are too shameful. In Nepal I am afraid they will think I am "
            "dangerous or possessed. I am desperate for help."
        ),
        category="Anxiety",
        severity_level=5,
        upvote_count=134,
        community_group_value=None,
    ),
]


def seed_anonymous_problems(db: Session) -> tuple[int, int]:
    created = 0
    skipped = 0

    for item in SEED_PROBLEMS:
        # Deduplicate by exact title match
        existing = (
            db.query(AnonymousProblem)
            .filter(AnonymousProblem.title == item.title)
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
                    f"for problem '{item.title}' — community_group_id will be null."
                )

        db.add(
            AnonymousProblem(
                title=item.title,
                description=item.description,
                category=item.category,
                severity_level=item.severity_level,
                upvote_count=item.upvote_count,
                community_group_id=community_id,
            )
        )
        created += 1

    db.commit()
    return created, skipped


def main() -> None:
    db = SessionLocal()
    try:
        created, skipped = seed_anonymous_problems(db)
        print(
            "Anonymous problems seed completed.",
            f"created={created}",
            f"skipped_existing={skipped}",
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()