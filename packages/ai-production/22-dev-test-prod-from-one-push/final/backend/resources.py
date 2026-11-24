# resources.py: read the twin's facts once, when the server starts
from pathlib import Path

from pypdf import PdfReader

DATA = Path(__file__).parent / "data"  # added: relative to this file, so it works inside the function zip too


def read_text(name: str) -> str:
    path = DATA / name
    return path.read_text(encoding="utf-8").strip() if path.exists() else ""


def read_pdf(name: str) -> str:
    path = DATA / name
    if not path.exists():
        return ""
    return "\n".join(page.extract_text() or "" for page in PdfReader(path).pages).strip()


summary = read_text("summary.txt")
style = read_text("style.txt")
facts = read_text("facts.txt")
profile = read_pdf("profile.pdf")
