"""Offline check (no GPU, no key, no download): data prep, the split wall and the scoring board."""
import make_tags
import prepare_data
from common import evaluate, to_example, true_price

tags = make_tags.make_rows(500)
examples = [to_example(t) for t in tags]
assert all(e["prompt"].endswith("Price is $") and e["completion"].isdigit() for e in examples)

sets = prepare_data.split_rows(examples, n_validation=50, n_test=100)
assert (len(sets["train"]), len(sets["validation"]), len(sets["test"])) == (350, 50, 100)
seen = lambda part: {e["prompt"] + e["completion"] for e in sets[part]}
# the wall: no example sits in two sets (a few identical tags may repeat, so allow only a tiny overlap)
assert len(seen("test") & seen("train")) <= 3, "test examples leaked into train"
again = prepare_data.split_rows(examples, 50, 100)
assert again["test"] == sets["test"], "the split must be repeatable"

mean = sum(true_price(e) for e in sets["train"]) / len(sets["train"])
board = evaluate(lambda prompt: mean, sets["test"])
assert board["failed"] == 0 and board["avg_error"] > 0
print(f"ok: split 350/50/100 is repeatable; 'always say the average' scores ${board['avg_error']:.0f} average error")
