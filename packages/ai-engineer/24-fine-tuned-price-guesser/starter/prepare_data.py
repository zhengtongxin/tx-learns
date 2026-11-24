"""Step 1 (starter): turn price tags into examples and split them ONCE into train, validation and test.

Run:  python prepare_data.py [--validation 200] [--test 300]
"""
import argparse
import json
import random

from common import load_jsonl, to_example


def split_rows(rows, n_validation, n_test):
    # TODO: copy the list, shuffle it once with random.Random(42), then return a dict with
    # "train" (everything left), "validation" (first n_validation) and "test" (the next n_test).
    # The test set must never be trained on or tuned on.
    raise NotImplementedError


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--validation", type=int, default=200)
    ap.add_argument("--test", type=int, default=300)
    ap.add_argument("--tags", default="data/tags.jsonl")
    args = ap.parse_args()

    tok = None
    try:
        from transformers import AutoTokenizer
        from common import BASE_MODEL
        tok = AutoTokenizer.from_pretrained(BASE_MODEL)
    except Exception as err:
        print("no tokenizer, cutting by words instead:", err)

    examples = [to_example(t, tok) for t in load_jsonl(args.tags)]
    sets = split_rows(examples, args.validation, args.test)
    for name, rows in sets.items():
        with open(f"data/{name}.jsonl", "w", encoding="utf-8") as f:
            for r in rows:
                f.write(json.dumps(r) + "\n")
        print(name, len(rows))
