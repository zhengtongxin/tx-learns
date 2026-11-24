# scoreboard.py: only the part of the scoreboard that this project uses.
# added: the lesson imports HELD_OUT and held_claims from the scoreboard project.
# This is that part, unchanged: the held-out set, chosen once and saved so it never changes.
import json
import os
import random

from bench import claims


def load_held_out(path="data/held_out_ids.json"):
    if os.path.exists(path):                     # already chosen: never choose again
        return set(json.load(open(path)))
    ids = sorted(c["id"] for c in claims)
    random.Random(7).shuffle(ids)
    held = sorted(ids[:10])
    json.dump(held, open(path, "w"))
    return set(held)


HELD_OUT = load_held_out()
held_claims = [c for c in claims if c["id"] in HELD_OUT]
