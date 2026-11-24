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
    (BOX / filename).write_text(content)
    return f"saved {filename}"


@tool("Run Python")
def run_python(filename: str) -> str:
    """Run a .py file from the sandbox in a fresh container and return what it printed."""
    try:
        out = subprocess.run(
            ["docker", "run", "--rm", "-v", f"{BOX}:/work", "-w", "/work",
             "python:3.12-slim", "python", filename],
            capture_output=True, text=True, timeout=60,
        )
    except FileNotFoundError:
        # added: say plainly when Docker is missing, so the agent cannot pretend the code ran
        return "ERROR: the docker command was not found. Docker Desktop must be installed and running."
    except subprocess.TimeoutExpired:
        # added: a hung script should look like a failure, not silence
        return "ERROR: the script took longer than 60 seconds and was stopped."
    return out.stdout + out.stderr  # errors too, so a crash is visible


box_tools = [save_file, run_python]
