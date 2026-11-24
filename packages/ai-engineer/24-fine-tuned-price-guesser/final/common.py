"""Shared helpers: settings, turning a price tag into a training example, loading files, the scoring board.
Only the standard library is needed here, so this file imports fast and the offline check can use it.
"""
import json
import os

from dotenv import load_dotenv  # added: read settings from .env

load_dotenv()  # added

# added: settings that the lesson left as "your-small-open-model" / "your-hub-name"
BASE_MODEL = os.getenv("BASE_MODEL", "Qwen/Qwen2.5-3B")      # any 3B to 8B open base model you may use
RUN_NAME = os.getenv("RUN_NAME", "price-run-01")
HUB_NAME = os.getenv("HUB_NAME", "")                          # only used when PUSH_TO_HUB=1
PUSH_TO_HUB = os.getenv("PUSH_TO_HUB", "0") == "1"


# ---- Step 1: prepare the data ----
def shorten(text, max_tokens=160, tok=None):
    # added: the lesson uses shorten() without showing it. With a tokenizer it cuts at a token limit;
    # without one it cuts at a number of words, which is close enough for the offline check.
    if tok is not None:
        return tok.decode(tok.encode(text, add_special_tokens=False)[:max_tokens])
    return " ".join(text.split()[:max_tokens])


def to_example(tag, tok=None):
    text = shorten(tag["description"], max_tokens=160, tok=tok)
    return {"prompt": f"{text}\nPrice is $", "completion": str(round(tag["price"]))}


def load_jsonl(path):  # added: the lesson saves to the hub; here the same sets are plain local files
    return [json.loads(line) for line in open(path, encoding="utf-8") if line.strip()]


def true_price(row):
    return float(row["completion"])


# ---- Step 4: one scoring board for everybody ----
def evaluate(guesser, rows, fallback=0.0):
    """Average error in dollars. A guesser may return None; that counts as `failed` and uses `fallback`."""
    errors, failed = [], 0
    for row in rows:
        guess = guesser(row["prompt"])
        if guess is None:
            failed += 1
            guess = fallback
        errors.append(abs(guess - true_price(row)))
    return {"avg_error": sum(errors) / len(errors), "failed": failed}
