# reset.py: added so every demo starts with a fresh queue.
# Deletes the agent's memory and the claim records. reference.db is left alone.
import os

for name in ("claims.db", "memory.db"):
    if os.path.exists(name):
        os.remove(name)
        print("removed", name)
print("fresh start")
