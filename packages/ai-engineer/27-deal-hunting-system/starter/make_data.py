"""Make invented data for the deal hunter. Run once:  python make_data.py

Writes:
  data/train.jsonl       1000 priced items (for the vector store, the neural net and the demo guessers)
  data/val.jsonl         200 priced items (to fit the ensemble weights)
  data/feed_sample.txt   a pretend deals feed, one listing per line:  description | price | url
All of it is made up. Three feed listings are priced far below their worth, so the system has deals to find.
"""
import json
import os
import random

CATEGORIES = {"phone": 220, "laptop": 420, "tablet": 180, "earbuds": 45, "watch": 90, "camera": 260}
BRANDS = {"Nova": 1.5, "Zenix": 1.2, "Orbit": 1.0, "Pebble": 0.7}   # invented names
CONDITIONS = {"like new": 1.0, "good": 0.8, "worn": 0.55, "for parts": 0.25}
STORAGE = {"64 GB": 0.9, "128 GB": 1.0, "256 GB": 1.25, "512 GB": 1.6}
EXTRAS = ["original box included", "battery health 85 percent", "screen protector on", "small scratch on the back",
          "comes with charger", "warranty ends next year", "one careful owner", "cleaned and factory reset"]

rng = random.Random(11)


def make_item():
    cat, brand = rng.choice(list(CATEGORIES)), rng.choice(list(BRANDS))
    cond, store = rng.choice(list(CONDITIONS)), rng.choice(list(STORAGE))
    extras = ", ".join(rng.sample(EXTRAS, 3))
    worth = CATEGORIES[cat] * BRANDS[brand] * CONDITIONS[cond] * STORAGE[store] * rng.uniform(0.9, 1.1)
    return {"description": f"Used {brand} {cat}, {store}, condition {cond}. {extras}.", "price": round(worth, 2)}


def write_jsonl(path, rows):
    with open(path, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r) + "\n")


if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    write_jsonl("data/train.jsonl", [make_item() for _ in range(1000)])
    write_jsonl("data/val.jsonl", [make_item() for _ in range(200)])
    feed = []
    for n in range(8):
        item = make_item()
        # listings 1, 4 and 6 are real bargains (about 40 percent of their worth); the rest are fairly priced
        asking = item["price"] * (0.4 if n in (1, 4, 6) else rng.uniform(0.95, 1.1))
        feed.append(f"{item['description']} | {asking:.0f} | https://shop.example/listing/{1000 + n}")
    with open("data/feed_sample.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(feed) + "\n")
    print("wrote data/train.jsonl, data/val.jsonl and data/feed_sample.txt")
