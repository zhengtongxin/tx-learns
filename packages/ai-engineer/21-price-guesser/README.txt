PRICE GUESSER
=============

What you build
--------------
Ah Boy is tired of pricing every trade-in by hand. You build a tool that
guesses a gadget's price from its description and shows how good each guesser
is, in three numbers: accuracy, cost and speed. Every guesser is a function
from text to a price, so they all go through the same scoring board
(evaluate: average error in dollars, and the share of guesses that land within
$40 or 20% of the real price):
  - average: always say the training average (the bar to beat);
  - linear: word counts plus linear regression;
  - forest: word counts plus a random forest;
  - frontier: a big hosted model, with a defensive parser for replies like
    "About $120 maybe" (a failed parse is counted and a fallback is used);
  - tuned (optional): your own fine-tuned small model.
A small Gradio screen shows the guessers side by side, so you can see when
they disagree.

Folder structure
----------------
  README.txt
  requirements.txt
  env.example            copy to .env (all values optional)
  final/
    price_guesser.py     complete working version (table and screen)
    make_data.py         makes the invented dataset
    data/train.jsonl     800 invented listings (text and price)
    data/test.jsonl      150 invented listings
    test_offline.py      offline check
  starter/
    price_guesser.py     same layout, with TODO stubs
    make_data.py, data/, test_offline.py   same as final

Requirements
------------
  - Python 3.10 or newer
  - Packages: see requirements.txt (scikit-learn, openai, gradio, python-dotenv)
  - No key is needed for the classic guessers and the offline check
  - An OpenAI API key only if you want the frontier row. A tuned model is
    optional: it needs a fine-tuning job from the previous lessons.

About the data: the lesson uses the small "lite" dataset you pushed to the
model hub in the cleaning lesson. So this package runs on its own, make_data.py
creates an invented stand-in with the same shape (text, price). To use your own
data instead, write train.jsonl and test.jsonl with one {"text": ..., "price": ...}
object per line.

Install
-------
  python3 -m venv .venv
  source .venv/bin/activate          (Windows: .venv\Scripts\activate)
  pip install -r requirements.txt
  cp env.example .env                (optional: add your key)

Run
---
  cd final
  python price_guesser.py table      (the scoring table)
  python price_guesser.py screen     (the Gradio screen)
  python make_data.py                (only if you want to rebuild the data)

For the starter: cd starter, fill in the TODOs, run the same way.

Test / what success looks like
------------------------------
Offline check (no key):
  cd final
  python test_offline.py
  -> ok: average error $138, forest $21 (forest should be lower)

Without a key, "table" prints three rows. On the invented data you should see
roughly this (your numbers may differ a little by library version):
  name        avg error  hit rate  $/1000  sec/guess
  average        138.02       14%    0.00      0.000
  linear          57.44       54%    0.00      0.000
  forest          20.85       93%    0.00      0.027
Average is worst, then linear, then forest. With a key, a frontier row is added.
On the screen, type "Nova laptop, 256GB, condition: good" and read each answer.

One failure case: the frontier model looks terrible, with a huge average error.
  Replies like "About $120 maybe" may be scored as zero if the parse fails.
  parse_price must return None for "no number", and the guesser must use the
  fallback and count it. Check the "unreadable replies" line at the end.
Another: "FileNotFoundError: data/train.jsonl". Run python make_data.py first
  (from the same folder), or cd into final or starter.
Another: the frontier call fails with a model-not-found error. Models are
  retired every few months; set FRONTIER_MODEL in .env to one you can use.

Cost note (approximate)
-----------------------
The classic guessers cost nothing per guess. The frontier row makes one call
per test listing (150 calls), usually a few cents in total with a small model
and more with a large one. Set FRONTIER_COST_PER_1000 from your provider's
price list so the table is honest. Prices change.

Clean up
--------
  Press Ctrl+C to stop the screen.
  rm -rf __pycache__
  deactivate
  rm -rf .venv .env
Nothing else is created. A tuned model, if you made one, is billed and listed
in your provider's dashboard; delete it there if you no longer need it.

What changed since the previous lesson
--------------------------------------
Earlier lessons built the scoring board, the three classic baselines, the
neural net and the frontier predictor as separate snippets on a shared item
type. Here they are one tool on plain text. New: evaluate also reports a hit
rate; the frontier parser is defensive (fallback plus a failure count); a table
adds cost and speed; and a Gradio screen. Added to make it run on its own: an
invented local dataset (instead of one on the model hub) and a command line.

ACCEPTANCE CRITERIA
-------------------
You are done when:
- python test_offline.py in final/ prints an ok line and needs no key.
- python price_guesser.py table prints one row per guesser with average error, hit rate, cost and seconds.
- The order from worst to best is average, then linear, then forest.
- A reply like 'About $120 maybe' is parsed to 120.
- Unreadable replies are counted separately and not scored as zero.

Compare your work with final/ afterwards, starting with price_guesser.py, make_data.py and test_offline.py.

验收标准（中文）
- 在 final/ 里运行 python test_offline.py，打印 ok 行，不需要密钥。
- python price_guesser.py table 每个估价器一行，含平均误差、命中率、成本和秒数。
- 从差到好的顺序是：平均值、线性、随机森林。
- 像 “About $120 maybe” 这样的回复会被解析成 120。
- 读不懂的回复单独计数，不当作零分。
