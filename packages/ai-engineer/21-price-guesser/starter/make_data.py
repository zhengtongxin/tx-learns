"""Make a small, invented gadget listings dataset (stands in for the "lite" dataset built in the cleaning lesson).

Run:  python make_data.py        -> writes data/train.jsonl and data/test.jsonl
Every listing is made up. The price depends on the words in the text (category, brand tier,
storage, condition) plus some noise, so word-based guessers can learn something real.
"""
import json
import os
import random

random.seed(7)  # same data every time

CATEGORIES = {  # name: (base price in dollars, typical words)
    "phone": (220, "smartphone touchscreen camera battery"),
    "laptop": (420, "laptop keyboard screen processor"),
    "tablet": (180, "tablet touchscreen stylus screen"),
    "earbuds": (45, "earbuds wireless charging-case bluetooth"),
    "watch": (90, "smartwatch strap heart-rate waterproof"),
}
BRANDS = {"Nova": 1.5, "Zenix": 1.2, "Orbit": 1.0, "Pebble": 0.7}   # invented brand names and tiers
CONDITIONS = {"like new": 1.0, "good": 0.8, "worn": 0.55, "for parts": 0.25}
STORAGE = {"64GB": 0.9, "128GB": 1.0, "256GB": 1.25, "512GB": 1.6}
EXTRAS = ["original box included", "new battery fitted", "screen protector on", "one small scratch on the back",
          "comes with charger", "warranty ends next year", "used gently by one owner", "factory reset and cleaned"]


def make_row():
    cat = random.choice(list(CATEGORIES))
    base, words = CATEGORIES[cat]
    brand = random.choice(list(BRANDS))
    cond = random.choice(list(CONDITIONS))
    store = random.choice(list(STORAGE))
    extras = ", ".join(random.sample(EXTRAS, 3))
    price = base * BRANDS[brand] * CONDITIONS[cond] * STORAGE[store] * random.uniform(0.85, 1.15)
    text = (f"{brand} {cat}, {store}, condition: {cond}. A {words.replace('-', ' ')} device. {extras}. "
            f"Sold by a trusted shop in the estate mall after a trade-in check.")
    return {"text": text, "price": round(price, 2)}


if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    rows = [make_row() for _ in range(950)]
    for name, part in [("train", rows[:800]), ("test", rows[800:])]:
        with open(f"data/{name}.jsonl", "w", encoding="utf-8") as f:
            for r in part:
                f.write(json.dumps(r) + "\n")
        print("wrote", name, len(part))
