"""Shared helpers (starter). Fill in each TODO."""
import json
import os

from dotenv import load_dotenv

load_dotenv()

BASE_MODEL = os.getenv("BASE_MODEL", "Qwen/Qwen2.5-3B")
RUN_NAME = os.getenv("RUN_NAME", "price-run-01")
HUB_NAME = os.getenv("HUB_NAME", "")
PUSH_TO_HUB = os.getenv("PUSH_TO_HUB", "0") == "1"


def shorten(text, max_tokens=160, tok=None):
    # TODO: with a tokenizer: encode, keep the first max_tokens ids, decode.
    # Without one: keep the first max_tokens words.
    raise NotImplementedError


def to_example(tag, tok=None):
    # TODO: shorten the description, then return
    # {"prompt": "<text>\nPrice is $", "completion": "<price rounded to a whole number, as text>"}
    raise NotImplementedError


def load_jsonl(path):
    return [json.loads(line) for line in open(path, encoding="utf-8") if line.strip()]


def true_price(row):
    return float(row["completion"])


def evaluate(guesser, rows, fallback=0.0):
    # TODO: for each row call guesser(row["prompt"]); a None guess counts as failed and uses `fallback`.
    # Return {"avg_error": average absolute error in dollars, "failed": how many guesses were None}
    raise NotImplementedError
