"""Make invented price tags (a description and what it sold for). Stands in for Ah Boy's real tags.

Run:  python make_tags.py [how_many]      -> writes data/tags.jsonl   (default 3000)
Everything is made up. The price depends on the words in the description, so a model can learn it.
"""
import json
import os
import random
import sys

CATEGORIES = {"phone": 220, "laptop": 420, "tablet": 180, "earbuds": 45, "watch": 90, "camera": 260}
BRANDS = {"Nova": 1.5, "Zenix": 1.2, "Orbit": 1.0, "Pebble": 0.7}   # invented names
CONDITIONS = {"like new": 1.0, "good": 0.8, "worn": 0.55, "for parts": 0.25}
STORAGE = {"64 GB": 0.9, "128 GB": 1.0, "256 GB": 1.25, "512 GB": 1.6}
EXTRAS = ["original box included", "battery health 85 percent", "screen protector on", "small scratch on the back",
          "comes with charger", "warranty ends next year", "one careful owner", "cleaned and factory reset"]


def make_rows(n, seed=7):
    rng = random.Random(seed)
    rows = []
    for _ in range(n):
        cat = rng.choice(list(CATEGORIES))
        brand, cond, store = rng.choice(list(BRANDS)), rng.choice(list(CONDITIONS)), rng.choice(list(STORAGE))
        extras = ", ".join(rng.sample(EXTRAS, 3))
        price = CATEGORIES[cat] * BRANDS[brand] * CONDITIONS[cond] * STORAGE[store] * rng.uniform(0.9, 1.1)
        rows.append({"description": f"Used {brand} {cat}, {store}, condition {cond}. {extras}.",
                     "price": round(price, 2)})
    return rows


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    os.makedirs("data", exist_ok=True)
    with open("data/tags.jsonl", "w", encoding="utf-8") as f:
        for r in make_rows(n):
            f.write(json.dumps(r) + "\n")
    print("wrote data/tags.jsonl with", n, "tags")
