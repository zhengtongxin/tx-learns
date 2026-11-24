# memory.py: the twin's handover book.
# One environment variable chooses where it lives: local files or a cloud bucket.
import json
import os
import re
from pathlib import Path

USE_BUCKET = os.environ.get("USE_BUCKET", "false") == "true"
MEMORY_DIR = Path(os.environ.get("MEMORY_DIR", "memory"))


def check_id(session_id: str) -> str:
    # TODO: allow only letters, digits and "-" (1 to 64 characters). Raise ValueError otherwise.
    # Hint: re.fullmatch(r"[A-Za-z0-9-]{1,64}", session_id)
    return session_id


def load_from_bucket(session_id: str) -> list:
    # TODO: boto3 s3 get_object(Bucket=os.environ["MEMORY_BUCKET"], Key=f"{session_id}.json").
    # A missing object (error code "NoSuchKey") means a new visitor: return []. Re-raise anything else.
    return []


def save_to_bucket(session_id: str, history: list) -> None:
    # TODO: s3 put_object with the history as JSON bytes, ContentType application/json
    pass


def load_history(session_id: str) -> list:
    # TODO: check the id; if USE_BUCKET call load_from_bucket, else read MEMORY_DIR/<id>.json
    # (return [] if the file does not exist)
    return []


def save_history(session_id: str, history: list) -> None:
    # TODO: check the id; if USE_BUCKET call save_to_bucket, else write MEMORY_DIR/<id>.json
    # (create the folder first)
    pass
