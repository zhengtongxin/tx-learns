"""Offline check (no key, no network): the two database tools work."""
import os
os.environ.setdefault("OPENAI_API_KEY", "test-not-a-real-key")  # the client only needs something to start
import assistant

assert assistant.get_price("Mandai") == "Mandai: S$62.0"
assert assistant.get_price("Mars").endswith("no such trip")
assistant.set_price("mandai", 60)
assert assistant.get_price("mandai") == "mandai: S$60.0"
assistant.set_price("mandai", 62)  # put it back
print("ok: get_price and set_price work; looked_up =", assistant.looked_up)
