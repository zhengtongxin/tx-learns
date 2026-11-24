"""Step 1: turn price tags into examples and split them ONCE into train, validation and test.

Run:  python prepare_data.py [--validation 200] [--test 300]
Reads data/tags.jsonl, writes data/train.jsonl, data/validation.jsonl, data/test.jsonl.
Run it once. The test set is never trained on and never tuned on.
"""
import argparse
import json
import random

from common import load_jsonl, to_example


def split_rows(rows, n_validation, n_test):
    rows = list(rows)
    random.Random(42).shuffle(rows)  # shuffle once with a fixed seed, so the split is repeatable
    return {
        "train": rows[n_validation + n_test:],
        "validation": rows[:n_validation],
        "test": rows[n_validation:n_validation + n_test],   # never trained on, never tuned on
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--validation", type=int, default=200)
    ap.add_argument("--test", type=int, default=300)
    ap.add_argument("--tags", default="data/tags.jsonl")
    args = ap.parse_args()

    tok = None
    try:  # added: cut descriptions at a real token limit when a tokenizer is available
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

    from common import HUB_NAME, PUSH_TO_HUB  # optional: share the sets on the model hub (needs a login)
    if PUSH_TO_HUB and HUB_NAME:
        from datasets import Dataset, DatasetDict
        DatasetDict({k: Dataset.from_list(v) for k, v in sets.items()}).push_to_hub(f"{HUB_NAME}/price-tags")
