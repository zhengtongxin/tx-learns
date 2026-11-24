"""Price guesser (starter). Fill in each TODO.

Commands:
  python price_guesser.py table
  python price_guesser.py screen
Run  python make_data.py  first if the data/ folder is missing.
"""
import json
import os
import re
import sys
import time

from dotenv import load_dotenv
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LinearRegression

load_dotenv()


def load_rows(path):
    return [json.loads(line) for line in open(path, encoding="utf-8") if line.strip()]


train, test = load_rows("data/train.jsonl"), load_rows("data/test.jsonl")


def evaluate(pricer_fn, rows, tol_dollars=40, tol_pct=0.2):
    # TODO: run every row["text"] through pricer_fn, collect abs errors; a "hit" is an error within
    # tol_dollars OR within tol_pct of the real price. Return {"avg_error": ..., "hit_rate": ...}
    raise NotImplementedError


# ---- baselines ----
counter = CountVectorizer(max_features=1500, stop_words="english")
X = counter.fit_transform([r["text"] for r in train])
y = [r["price"] for r in train]
average = None  # TODO: the average training price
linear = None   # TODO: LinearRegression fitted on X, y
forest = None   # TODO: RandomForestRegressor(n_estimators=100, n_jobs=-1, random_state=42) fitted on X, y


def average_pricer(text):
    # TODO: return the average
    raise NotImplementedError


def linear_pricer(text):
    # TODO: counter.transform([text]) -> linear.predict -> plain float
    raise NotImplementedError


def forest_pricer(text):
    # TODO: same as linear_pricer, with the forest
    raise NotImplementedError


# ---- frontier model ----
_client = None


def client():
    global _client
    if _client is None:
        from openai import OpenAI
        _client = OpenAI()
    return _client


unparsed = 0
FRONTIER_MODEL = os.getenv("FRONTIER_MODEL", "gpt-5")


def parse_price(reply_text):
    # TODO: regex for the first number (commas allowed, e.g. 1,120.50); return a float, or None if there is none
    raise NotImplementedError


def frontier_pricer(text):
    # TODO: ask FRONTIER_MODEL "Estimate the price in dollars. Reply with the number only." + text;
    # parse the reply; if there is no number, add 1 to the global `unparsed` and return average
    raise NotImplementedError


TUNED_MODEL = os.getenv("TUNED_MODEL", "")


def tuned_pricer(text):
    # TODO: same shape as frontier_pricer, using TUNED_MODEL and the prompt "Estimate the price: " + text
    raise NotImplementedError


def row_for(name, fn, cost_per_1000):
    # TODO: time evaluate(fn, test); return {"name": name, **result, "cost_per_1000": ..., "sec_per_guess": ...}
    raise NotImplementedError


def build_table():
    table = [row_for("average", average_pricer, 0.0), row_for("linear", linear_pricer, 0.0),
             row_for("forest", forest_pricer, 0.0)]
    if os.getenv("OPENAI_API_KEY"):
        cost = float(os.getenv("FRONTIER_COST_PER_1000", "1.5"))
        table.append(row_for("frontier", frontier_pricer, cost))
        if TUNED_MODEL:
            table.append(row_for("tuned", tuned_pricer, float(os.getenv("TUNED_COST_PER_1000", "0.5"))))
    else:
        print("(no OPENAI_API_KEY set: showing the classic guessers only)")
    return table


def guessers():
    g = {"average": average_pricer, "forest": forest_pricer}
    if os.getenv("OPENAI_API_KEY"):
        g["frontier"] = frontier_pricer
    return g


def screen():
    # TODO: a gradio Interface: one Textbox in; outputs a Number (main answer) and JSON (every guesser's rounded answer)
    raise NotImplementedError


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "table"
    if cmd == "screen":
        screen()
    else:
        print(f"{'name':10s} {'avg error':>10s} {'hit rate':>9s} {'$/1000':>7s} {'sec/guess':>10s}")
        for r in build_table():
            print(f"{r['name']:10s} {r['avg_error']:>10.2f} {r['hit_rate']:>9.0%} {r['cost_per_1000']:>7.2f} {r['sec_per_guess']:>10.3f}")
        print("unreadable replies:", unparsed)
