"""context.py: load Alex's files and build the system prompt."""
import os
from pypdf import PdfReader

TWIN_DIR = os.path.join(os.path.dirname(__file__), "twin")


def load_linkedin() -> str:
    """Return the text of Alex's profile."""
    # TODO: Return the text of Alex's profile.
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


def load_summary() -> str:
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")


# The behaviour lines from Step 3: each names a situation and an action.
BEHAVIOUR = """
# TODO (Step 3): write four lines, each "If X, then do Y with your tool".
"""


def build_system_prompt() -> str:
    # TODO: write this function
    # Hint: see the lesson step that builds this, then compare with final/.
    raise NotImplementedError("TODO")
