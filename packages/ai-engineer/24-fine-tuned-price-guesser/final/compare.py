"""Steps 3 to 5: guess prices with the tuned model and compare it fairly with the alternatives.

Run:  python compare.py                       compare average, forest, (frontier if a key is set) and tuned
      python compare.py --adapter price-run-01/adapter --revision <commit>   pick a saved adapter
Same test set, same prompts, same scoring rule for every contender.
"""
import argparse
import os
import re
import time

from common import RUN_NAME, evaluate, load_jsonl, true_price


# ---- Step 3: guess a price, and smooth it out ----
def load_tuned(adapter, revision=None):  # added: loads the 4-bit base, then the saved adapter on top
    import torch
    from peft import PeftModel
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from common import BASE_MODEL
    pack = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.bfloat16)
    tok = AutoTokenizer.from_pretrained(BASE_MODEL)
    base = AutoModelForCausalLM.from_pretrained(BASE_MODEL, quantization_config=pack, device_map="auto")
    model = PeftModel.from_pretrained(base, adapter, revision=revision) if revision else PeftModel.from_pretrained(base, adapter)
    return model.eval(), tok


def make_guesser(model, tok):  # added: a closure instead of globals, so the same code can load two checkpoints
    import torch
    one_token_numbers = len(tok.encode("145", add_special_tokens=False)) == 1

    def guess_price(prompt):
        ids = tok(prompt, return_tensors="pt").to(model.device)
        if not one_token_numbers:
            # added: this tokenizer reads digits one at a time, so averaging top tokens would average single digits.
            # Fall back to greedy generation and read the digits (the lesson says: "otherwise you read it digit by digit").
            with torch.no_grad():
                out = model.generate(**ids, max_new_tokens=8, do_sample=False)
            text = tok.decode(out[0][ids["input_ids"].shape[1]:], skip_special_tokens=True)
            found = re.match(r"\s*(\d+)", text)
            return float(found.group(1)) if found else None
        with torch.no_grad():
            logits = model(**ids).logits[0, -1]
        probs = torch.softmax(logits, dim=-1)
        top = torch.topk(probs, 5)
        total, weight = 0.0, 0.0
        for p, i in zip(top.values, top.indices):
            word = tok.decode(i).strip()
            if word.isdigit():
                total += float(word) * float(p)
                weight += float(p)
        return total / weight if weight else None

    return guess_price


# ---- the contenders from the earlier projects (added: the lesson calls them avg_guess, forest_guess, frontier_guess) ----
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
        reply = client.chat.completions.create(model=model, messages=[
            {"role": "user", "content": "Estimate the price in dollars. Reply with the number only.\n\n" + prompt}])
        found = re.search(r"\d[\d,]*\.?\d*", reply.choices[0].message.content)
        return float(found.group().replace(",", "")) if found else None
    return frontier_guess


# ---- Steps 4 and 5: the same harness for everyone, then the table with cost and speed ----
if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--adapter", default=f"{RUN_NAME}/adapter")
    ap.add_argument("--revision", default=None)
    ap.add_argument("--limit", type=int, default=0, help="score only the first N test rows (0 = all)")
    args = ap.parse_args()

    train_rows, test_rows = load_jsonl("data/train.jsonl"), load_jsonl("data/test.jsonl")
    if args.limit:
        test_rows = test_rows[:args.limit]
    average, avg_guess, forest_guess = make_baselines(train_rows)

    contenders = {"average": (avg_guess, 0.0), "forest": (forest_guess, 0.0)}
    if os.getenv("OPENAI_API_KEY"):
        contenders["frontier"] = (make_frontier(), float(os.getenv("FRONTIER_COST_PER_1000", "1.5")))
    model, tok = load_tuned(args.adapter, args.revision)
    gpu_hourly = float(os.getenv("GPU_HOURLY_PRICE", "0.5"))   # added: GPU time costs, not tokens

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
            cost = secs * 1000 * gpu_hourly / 3600
        print(f"{name:10s} {result['avg_error']:>10.2f} {result['failed']:>7d} {cost:>8.2f} {secs:>10.3f}")
