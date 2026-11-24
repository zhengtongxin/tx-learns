"""config.py: every limit and model name in one place, so experiments stay cheap."""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()  # added: read .env first, so the model names below can come from it

ROOT = Path(__file__).resolve().parent
SITE_DIR = ROOT / "site"
BOARD_PATH = str(ROOT / "board.db")

# Model names live here, read from environment variables, so you can drop to cheaper models
# by changing one line in .env.
COORDINATOR_MODEL = os.getenv("COORDINATOR_MODEL", "gemini-2.5-flash")
WORKER_MODEL = os.getenv("WORKER_MODEL", "gemini-2.5-flash")
INSPECTOR_MODEL = os.getenv("INSPECTOR_MODEL", "gemini-2.5-flash")

# Step 5: bound everything
COORDINATOR_MAX_LLM_CALLS = 80   # the outer loop
WORKER_MAX_LLM_CALLS = 40        # each builder's inner loop
INSPECTOR_MAX_LLM_CALLS = 25     # each page check
WORKER_TIMEOUT_S = 300           # all builders together
MCP_TIMEOUT_S = 30.0             # the first browser call starts slowly (the default is 5)
SERVER_PORT = 8099               # the small local web server the inspector opens

# The five booths at the school fair
BOOTHS = ["pancakes", "ring toss", "face painting", "book swap", "plant sale"]

# The team: one worker script per framework.
# added: the lesson had five workers, one in each framework from the previous lesson. To keep this
# package runnable on its own, all five slots point at the same Google ADK worker. Write the
# other four from the previous lesson and change the paths here to use them. A slot whose file is
# missing is simply not on the team.
WORKERS = {
    "adk": "workers/adk_worker.py",
    "strands": "workers/adk_worker.py",
    "pydantic-ai": "workers/adk_worker.py",
    "agno": "workers/adk_worker.py",
    "ms-agent": "workers/adk_worker.py",
}
