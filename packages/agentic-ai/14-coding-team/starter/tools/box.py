# tools/box.py: a safe box where model-written code can run.
import subprocess
from pathlib import Path

from crewai.tools import tool

# added: this package uses a flat layout, so the sandbox sits next to main.py (final/sandbox)
BOX = Path(__file__).resolve().parents[1] / "sandbox"
BOX.mkdir(exist_ok=True)


@tool("Save File")
def save_file(filename: str, content: str) -> str:
    """Write a text file into the sandbox folder, replacing it if it exists."""
    # TODO: Write a text file into the sandbox folder, replacing it if it exists.
    # Hint: (BOX / filename).write_text(content), then return a short confirmation
    raise NotImplementedError("TODO")


@tool("Run Python")
def run_python(filename: str) -> str:
    """Run a .py file from the sandbox in a fresh container and return what it printed."""
    # TODO: Run a .py file from the sandbox in a fresh container and return what i
    # Hint: subprocess.run(["docker","run","--rm","-v",...,"python:3.12-slim","python",filename], capture_output=True, text=True, timeout=60); return stdout + stderr
    raise NotImplementedError("TODO")


box_tools = [save_file, run_python]
