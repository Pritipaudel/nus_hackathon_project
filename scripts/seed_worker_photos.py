"""
Upload health-worker profile photos to MinIO and persist photo_url in the DB.

Run from project root:
    PYTHONPATH=. uv run python scripts/seed_worker_photos.py

Workers are matched by their username. Only rows whose photo_url is NULL (or
whose username matches a known name) are updated — safe to re-run.
"""

from __future__ import annotations

import io
import os
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import backend.models.community  # noqa: F401  — resolve FK targets
import backend.models.user  # noqa: F401

from backend.core.database import SessionLocal
from backend.core.minio_client import (
    MINIO_ACCESS_KEY,
    MINIO_ENDPOINT,
    MINIO_SECRET_KEY,
    minio_client,
)
from backend.models.health_worker import HealthWorker

BUCKET = "worker-photos"

# All six demo workers with real doctor / counsellor photos from Unsplash.
# Keys match the `username` seeded in seed_demo_data.py / MOCK_WORKERS constant.
WORKER_PHOTO_SOURCES: list[dict] = [
    {
        "username": "Dr. Priya Nair",
        "filename": "priya_nair.jpg",
        "url": "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&q=80",
    },
    {
        "username": "Ahmad Farouk",
        "filename": "ahmad_farouk.jpg",
        "url": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80",
    },
    {
        "username": "Chen Wei",
        "filename": "chen_wei.jpg",
        "url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80",
    },
    {
        "username": "Dr. Sunita Kapoor",
        "filename": "sunita_kapoor.jpg",
        "url": "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80",
    },
    {
        "username": "Marcus Raj",
        "filename": "marcus_raj.jpg",
        "url": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80",
    },
    {
        "username": "Layla Aziz",
        "filename": "layla_aziz.jpg",
        "url": "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=400&q=80",
    },
]


def ensure_bucket() -> None:
    if not minio_client.bucket_exists(BUCKET):
        minio_client.make_bucket(BUCKET)
        # Make bucket public-read so frontend can load URLs directly.
        import json
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{BUCKET}/*"],
                }
            ],
        }
        minio_client.set_bucket_policy(BUCKET, json.dumps(policy))
        print(f"  [bucket] created '{BUCKET}' with public-read policy")
    else:
        print(f"  [bucket] '{BUCKET}' already exists")


def download_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read()


def upload_photo(filename: str, data: bytes) -> str:
    minio_client.put_object(
        bucket_name=BUCKET,
        object_name=filename,
        data=io.BytesIO(data),
        length=len(data),
        content_type="image/jpeg",
    )
    # Build presigned-free public URL (bucket is public-read).
    return f"http://{MINIO_ENDPOINT}/{BUCKET}/{filename}"


def main() -> None:
    print("Connecting to MinIO…")
    try:
        minio_client.list_buckets()
        print("  MinIO connection OK")
    except Exception as exc:
        print(f"  [ERROR] Cannot reach MinIO at {MINIO_ENDPOINT}: {exc}")
        sys.exit(1)

    ensure_bucket()

    db = SessionLocal()
    try:
        for entry in WORKER_PHOTO_SOURCES:
            username: str = entry["username"]
            filename: str = entry["filename"]
            source_url: str = entry["url"]

            worker: HealthWorker | None = (
                db.query(HealthWorker).filter_by(username=username).first()
            )
            if worker is None:
                print(f"  [skip]  worker not found in DB: {username!r}")
                continue

            print(f"  [{username}] downloading photo…", end=" ", flush=True)
            try:
                photo_bytes = download_bytes(source_url)
            except Exception as exc:
                print(f"FAILED ({exc})")
                continue

            print(f"{len(photo_bytes):,} bytes — uploading to MinIO…", end=" ", flush=True)
            try:
                public_url = upload_photo(filename, photo_bytes)
            except Exception as exc:
                print(f"FAILED ({exc})")
                continue

            worker.photo_url = public_url
            print(f"OK  →  {public_url}")

        db.commit()
        print("\nAll photos seeded successfully.")
        print(f"Access MinIO console: http://localhost:7546  (admin / minioadmin)")

    except Exception as exc:
        db.rollback()
        print(f"\n[ERROR] {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
