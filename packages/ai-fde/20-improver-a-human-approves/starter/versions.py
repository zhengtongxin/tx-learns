# versions.py: the configuration as numbered versions that are never edited (Step 1).
import json
import os

FILE = "versions.json"
FIELDS = ("instructions", "model", "effort")


def save(state):
    json.dump(state, open(FILE, "w"), indent=2)


def load():
    if not os.path.exists(FILE):
        save({"active": 1, "log": [], "versions": [{
            "n": 1, "instructions": "", "model": "anthropic/claude-haiku-5-5", "effort": "low",
            "changed": "starting point", "why": "the agent as it ran on the scoreboard",
            "proposed_by": "Mei Ling", "approved_by": "Mei Ling", "status": "kept", "scores": None}]})
    return json.load(open(FILE))


def find(state, n):
    # TODO: return the version with this number
    raise NotImplementedError("TODO: find")


def active(state):
    # TODO: return the version that state["active"] points at
    raise NotImplementedError("TODO: active")
