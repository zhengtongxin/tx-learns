# memory.py: the twin's handover book.
# One environment variable chooses where it lives: local files or a cloud bucket.
import json
import os
import re
from pathlib import Path

USE_BUCKET = os.environ.get("USE_BUCKET", "false") == "true"
MEMORY_DIR = Path(os.environ.get("MEMORY_DIR", "memory"))  # added: lets you point local files elsewhere

_s3 = None  # added: made on first use, so local runs never need cloud settings


def _client():
    global _s3
    if _s3 is None:
        import boto3  # added: imported only when the bucket is really used

        _s3 = boto3.client("s3")
    return _s3


def check_id(session_id: str) -> str:
    # only safe characters, so nobody can aim at other files or objects
    if not re.fullmatch(r"[A-Za-z0-9-]{1,64}", session_id):
        raise ValueError("bad session id")
    return session_id


def load_from_bucket(session_id: str) -> list:
    from botocore.exceptions import ClientError

    try:
        obj = _client().get_object(Bucket=os.environ["MEMORY_BUCKET"], Key=f"{session_id}.json")
        return json.loads(obj["Body"].read())
    except ClientError as err:
        if err.response["Error"]["Code"] == "NoSuchKey":
            return []  # a new visitor
        raise  # anything else is a real problem


def save_to_bucket(session_id: str, history: list) -> None:
    _client().put_object(
        Bucket=os.environ["MEMORY_BUCKET"],
        Key=f"{session_id}.json",
        Body=json.dumps(history).encode("utf-8"),
        ContentType="application/json",
    )


def load_history(session_id: str) -> list:
    sid = check_id(session_id)
    if USE_BUCKET:
        return load_from_bucket(sid)
    path = MEMORY_DIR / f"{sid}.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else []


def save_history(session_id: str, history: list) -> None:
    sid = check_id(session_id)
    if USE_BUCKET:
        return save_to_bucket(sid, history)
    MEMORY_DIR.mkdir(exist_ok=True)
    (MEMORY_DIR / f"{sid}.json").write_text(json.dumps(history, ensure_ascii=False), encoding="utf-8")
