"""context.py: load Alex's files and build the system prompt."""
import os
from pypdf import PdfReader

TWIN_DIR = os.path.join(os.path.dirname(__file__), "twin")


def load_linkedin() -> str:
    """Return the text of Alex's profile."""
    pdf_path = os.path.join(TWIN_DIR, "linkedin.pdf")
    if os.path.exists(pdf_path):
        reader = PdfReader(pdf_path)
        linkedin = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                linkedin += text
        return linkedin
    # added: the sample package ships a plain-text profile so it runs without a PDF
    with open(os.path.join(TWIN_DIR, "linkedin.txt"), encoding="utf-8") as f:
        return f.read()


def load_summary() -> str:
    with open(os.path.join(TWIN_DIR, "summary.txt"), encoding="utf-8") as f:
        return f.read()


# The behaviour lines from Step 3: each names a situation and an action.
BEHAVIOUR = """
If the user wants to get in touch, ask for their email and use your tool to record it.
If you don't know the answer, use your tool to record the question. Never make up an answer.
Only answer career questions. Otherwise steer back.
If asked, say you are an AI digital twin.
"""


def build_system_prompt() -> str:
    summary, linkedin = load_summary(), load_linkedin()
    return (
        "You are Alex's digital twin. Answer questions about his career.\n"
        f"## Summary\n{summary}\n## LinkedIn\n{linkedin}\n"
        "If you don't know something, say so. Never make things up."
        f"\n## How to behave{BEHAVIOUR}"
    )
