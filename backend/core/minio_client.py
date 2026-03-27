import os
from pathlib import Path

from dotenv import load_dotenv
from minio import Minio

load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=True)

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:7545")
MINIO_ACCESS_KEY = os.getenv(
    "MINIO_ACCESS_KEY", os.getenv("MINIO_ROOT_USER", "minioadmin")
)
MINIO_SECRET_KEY = os.getenv(
    "MINIO_SECRET_KEY", os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
)

minio_client = Minio(
    endpoint=MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False,
)

if __name__ == "__main__":
    # Example usage: List buckets
    buckets = minio_client.list_buckets()
    for bucket in buckets:
        print(bucket.name)
