"""Offline check (no GPU, no download): chunking splits a long transcript and loses nothing."""
import minutes

text = "word " * 5000
parts = minutes.split_text(text, size=6000)
assert len(parts) == 5 and "".join(parts) == text
print("ok: split_text made", len(parts), "chunks and lost nothing")
