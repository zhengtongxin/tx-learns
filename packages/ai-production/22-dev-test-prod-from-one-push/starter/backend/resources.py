# resources.py: read the twin's facts once, when the server starts
from pathlib import Path

from pypdf import PdfReader

DATA = Path(__file__).parent / "data"


def read_text(name: str) -> str:
    # TODO: return the file's text (stripped), or "" if the file does not exist
    return ""


def read_pdf(name: str) -> str:
    # TODO: if the file is missing return ""; otherwise join each page's extract_text()
    # with newlines. Hint: PdfReader(path).pages
    return ""


summary = read_text("summary.txt")
style = read_text("style.txt")
facts = read_text("facts.txt")
profile = read_pdf("profile.pdf")
