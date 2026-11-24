"""Price guesser: classic guessers and a frontier model on one scoring board, plus a small screen.

Commands:
  python price_guesser.py table    score every guesser (frontier and tuned only if a key is set)
  python price_guesser.py screen   a Gradio screen where the guessers can disagree
Run  python make_data.py  first if the data/ folder is missing.
"""
import json
import os
import re
import sys
import time

from dotenv import load_dotenv  # added: read OPENAI_API_KEY and model names from .env
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LinearRegression

load_dotenv()  # added


# ---- Step 1: load the lite data and keep the scoring board ----
def load_rows(path):  # added: the lesson loads a hub dataset; here the same shape comes from local files
    return [json.loads(line) for line in open(path, encoding="utf-8") if line.strip()]


train, test = load_rows("data/train.jsonl"), load_rows("data/test.jsonl")


def evaluate(pricer_fn, rows, tol_dollars=40, tol_pct=0.2):
    errors, hits = [], 0
    for row in rows:
        guess = pricer_fn(row["text"])
        err = abs(guess - row["price"])
        errors.append(err)
        if err <= tol_dollars or err <= tol_pct * row["price"]:
            hits += 1
    return {"avg_error": sum(errors) / len(errors), "hit_rate": hits / len(errors)}


# ---- Step 2: the baselines and their scores ----
counter = CountVectorizer(max_features=1500, stop_words="english")
X = counter.fit_transform([r["text"] for r in train])
y = [r["price"] for r in train]
average = sum(y) / len(y)
linear = LinearRegression().fit(X, y)
forest = RandomForestRegressor(n_estimators=100, n_jobs=-1, random_state=42).fit(X, y)


def average_pricer(text): return average
def linear_pricer(text):  return float(linear.predict(counter.transform([text]))[0])
def forest_pricer(text):  return float(forest.predict(counter.transform([text]))[0])


# ---- Step 3: the frontier predictor, parsed defensively ----
_client = None


def client():  # added: create the client on first use, so the baselines run with no key
    global _client
    if _client is None:
        from openai import OpenAI
        _client = OpenAI()
    return _client


unparsed = 0
FRONTIER_MODEL = os.getenv("FRONTIER_MODEL", "gpt-5")   # added: the lesson says "your-big-model"


def parse_price(reply_text):  # added: the lesson's regex pulled out so it can be tested alone
    found = re.search(r"\d[\d,]*\.?\d*", reply_text)
    return float(found.group().replace(",", "")) if found else None


def frontier_pricer(text):
    global unparsed
    reply = client().chat.completions.create(model=FRONTIER_MODEL, messages=[
        {"role": "user", "content":
         "Estimate the price in dollars. Reply with the number only.\n\n" + text}])
    price = parse_price(reply.choices[0].message.content)
    if price is None:
        unparsed += 1
        return average                      # fallback, and we know we used it
    return price


# ---- Step 4: a tuned small model ----
TUNED_MODEL = os.getenv("TUNED_MODEL", "")  # added: name returned by your tuning job, e.g. ft:your-small-model:your-org::abc123


def tuned_pricer(text):
    global unparsed
    reply = client().chat.completions.create(model=TUNED_MODEL, messages=[
        {"role": "user", "content": "Estimate the price: " + text}])
    price = parse_price(reply.choices[0].message.content)
    if price is None:
        unparsed += 1
        return average
    return price


# ---- Step 5: one table, three numbers ----
def row_for(name, fn, cost_per_1000):
    start = time.time()
    result = evaluate(fn, test)
    secs = (time.time() - start) / len(test)
    return {"name": name, **result, "cost_per_1000": cost_per_1000, "sec_per_guess": round(secs, 3)}


def build_table():  # added: the lesson lists three guessers; this adds linear, and tuned when you have one
    table = [row_for("average", average_pricer, 0.0), row_for("linear", linear_pricer, 0.0),
             row_for("forest", forest_pricer, 0.0)]
    if os.getenv("OPENAI_API_KEY"):
        cost = float(os.getenv("FRONTIER_COST_PER_1000", "1.5"))     # use your own price list
        table.append(row_for("frontier", frontier_pricer, cost))
        if TUNED_MODEL:
            table.append(row_for("tuned", tuned_pricer, float(os.getenv("TUNED_COST_PER_1000", "0.5"))))
    else:
        print("(no OPENAI_API_KEY set: showing the classic guessers only)")
    return table


# ---- Step 6: a tiny screen where they disagree ----
def guessers():
    g = {"average": average_pricer, "forest": forest_pricer}
    if os.getenv("OPENAI_API_KEY"):
        g["frontier"] = frontier_pricer
    return g


def screen():
    import gradio as gr
    all_guessers = guessers()

    def guess_all(text):
        answers = {name: round(fn(text)) for name, fn in all_guessers.items()}
        main = answers.get("frontier", answers["forest"])
        return main, answers                     # main answer, then everyone's

    gr.Interface(fn=guess_all, inputs=gr.Textbox(label="Describe the gadget"),
                 outputs=[gr.Number(label="Estimated price"), gr.JSON(label="All guessers")]).launch()


# added: a small command line so the file runs on its own
if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "table"
    if cmd == "screen":
        screen()
    else:
        print(f"{'name':10s} {'avg error':>10s} {'hit rate':>9s} {'$/1000':>7s} {'sec/guess':>10s}")
        for r in build_table():
            print(f"{r['name']:10s} {r['avg_error']:>10.2f} {r['hit_rate']:>9.0%} {r['cost_per_1000']:>7.2f} {r['sec_per_guess']:>10.3f}")
        print("unreadable replies:", unparsed)
