"""Steps 3 to 5 (starter): guess prices with the tuned model and compare it fairly.

Run:  python compare.py [--adapter price-run-01/adapter] [--revision ...] [--limit 50]
"""
import argparse
import os
import re
import time

from common import RUN_NAME, evaluate, load_jsonl, true_price


def load_tuned(adapter, revision=None):
    # TODO: load BASE_MODEL in 4 bits (as in train.py), then PeftModel.from_pretrained(base, adapter, revision=...)
    # Return (model.eval(), tokenizer)
    raise NotImplementedError


def make_guesser(model, tok):
    import torch  # noqa: F401  (you will need it)

    def guess_price(prompt):
        # TODO: if numbers are ONE token for this tokenizer (check len(tok.encode("145")) == 1):
        #   run one forward pass, softmax the last position, take the top 5 tokens, and return the
        #   probability-weighted average of those that are digits (None if none are).
        # Otherwise: generate up to 8 new tokens greedily and read the leading digits (None if there are none).
        raise NotImplementedError

    return guess_price


def make_baselines(train_rows):
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.feature_extraction.text import CountVectorizer
    counter = CountVectorizer(max_features=1500, stop_words="english")
    X = counter.fit_transform([r["prompt"] for r in train_rows])
    y = [true_price(r) for r in train_rows]
    average = sum(y) / len(y)
    forest = RandomForestRegressor(n_estimators=100, n_jobs=-1, random_state=42).fit(X, y)
    return average, (lambda prompt: average), (lambda prompt: float(forest.predict(counter.transform([prompt]))[0]))


def make_frontier():
    from openai import OpenAI
    client = OpenAI()
    model = os.getenv("FRONTIER_MODEL", "gpt-5")

    def frontier_guess(prompt):
        # TODO: ask `model` "Estimate the price in dollars. Reply with the number only." + prompt;
        # return the first number in the reply as a float, or None if there is none
        raise NotImplementedError
    return frontier_guess


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--adapter", default=f"{RUN_NAME}/adapter")
    ap.add_argument("--revision", default=None)
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    train_rows, test_rows = load_jsonl("data/train.jsonl"), load_jsonl("data/test.jsonl")
    if args.limit:
        test_rows = test_rows[:args.limit]
    average, avg_guess, forest_guess = make_baselines(train_rows)
    contenders = {"average": (avg_guess, 0.0), "forest": (forest_guess, 0.0)}
    if os.getenv("OPENAI_API_KEY"):
        contenders["frontier"] = (make_frontier(), float(os.getenv("FRONTIER_COST_PER_1000", "1.5")))
    model, tok = load_tuned(args.adapter, args.revision)
    gpu_hourly = float(os.getenv("GPU_HOURLY_PRICE", "0.5"))

    print(f"{'model':10s} {'avg error':>10s} {'failed':>7s} {'$/1000':>8s} {'sec/guess':>10s}")
    for name in ["average", "forest", "frontier", "tuned"]:
        if name == "tuned":
            guesser, cost = make_guesser(model, tok), None
        elif name in contenders:
            guesser, cost = contenders[name]
        else:
            continue
        start = time.time()
        result = evaluate(guesser, test_rows, fallback=average)
        secs = (time.time() - start) / len(test_rows)
        if cost is None:
            # TODO: dollars per 1,000 guesses for the tuned model = seconds per guess * 1000 * GPU price per hour / 3600
            cost = 0.0
        print(f"{name:10s} {result['avg_error']:>10.2f} {result['failed']:>7d} {cost:>8.2f} {secs:>10.3f}")
