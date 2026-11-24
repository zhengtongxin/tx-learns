FINE-TUNED PRICE GUESSER
========================

What you build
--------------
Ah Boy has thousands of old price tags: a short description of a gadget and
what it sold for. You fine-tune a small open model on them with QLoRA (a
frozen 4-bit base plus a small trained add-on), then test it honestly against
the alternatives from the earlier project: "always say the average", a random
forest and, if you have a key, a big paid model. The same test set, the same
prompt and the same scoring rule are used for everyone. The result is one table
with average error, cost per 1,000 guesses and seconds per guess.

All the price tags here are invented (make_tags.py makes them). The pipeline:
  1. make_tags.py     invent tags
  2. prepare_data.py  prompt ending in "Price is $", completion is the number;
                      split ONCE into train, validation and test
  3. train.py         QLoRA run on a GPU, adapter saved
  4. compare.py       guess prices, score everybody, print the table

Folder structure
----------------
  README.txt
  requirements.txt
  env.example            copy to .env
  final/
    common.py            settings, shorten(), to_example(), evaluate()
    make_tags.py         invented price tags
    prepare_data.py      examples and the one-time split
    train.py             QLoRA training (needs an NVIDIA GPU)
    compare.py           guess_price, baselines, optional frontier, the table
    test_offline.py      offline check of the data steps and the scoring board
  starter/
    same file names, with TODO stubs (make_tags.py and test_offline.py are complete)

Requirements
------------
  - Python 3.10 or newer
  - An NVIDIA GPU with about 12 to 16 GB memory for train.py and compare.py
    (a free cloud notebook GPU can do a small run). The data steps and the offline
    check run on any laptop. bitsandbytes does not work on CPU-only machines.
  - Packages: see requirements.txt. These libraries change quickly, so if a
    version error appears, check the library's release notes for the renamed option.
  - Optional: an OpenAI API key for the frontier row, a model hub account and
    token for pushing, a dashboard account if you set report_to to wandb.
  - Disk space for the base model download (a few GB)

Install
-------
  python3 -m venv .venv
  source .venv/bin/activate          (Windows: .venv\Scripts\activate)
  pip install -r requirements.txt
  cp env.example .env                (then edit it)

Run
---
  cd final
  python make_tags.py                (3000 invented tags, no GPU needed)
  python prepare_data.py             (writes data/train, validation and test .jsonl)
  python train.py --subset 2000      (a few minutes on a GPU: try this first)
  python train.py                    (the full training set)
  python compare.py                  (the table; add --limit 50 for a quick look)

For the starter: cd starter, fill in the TODOs, run the same way.

Test / what success looks like
------------------------------
Offline check (no GPU, no key, no download):
  cd final
  python test_offline.py
  -> ok: split 350/50/100 is repeatable; 'always say the average' scores $118 average error

After training, the loss lines in the terminal should go down. Watch the
validation loss: if it starts to rise while training loss keeps falling, the
model is memorising, so stop earlier or use fewer epochs. compare.py then prints:
  model       avg error  failed   $/1000  sec/guess
  average         ...       0      0.00      0.000
  forest          ...       0      0.00      0.0xx
  tuned           ...       0      ...       ...
(plus a frontier row if OPENAI_API_KEY is set). Expect the average to be worst
and the tuned model to beat it clearly. Whether it beats the forest or the big
model depends on how much data you used. With a few thousand invented tags, a
forest on word counts may well win. That is an honest result, and the lesson's point.

One failure case: the score looks amazing but you used data the model had already seen.
  That is a leak between train and test. Run prepare_data.py once, never edit
  the test file, and never tune settings against it. test_offline.py checks
  that the split is repeatable and the sets do not overlap.
Another: "CUDA out of memory". Use a smaller base model, lower
  per_device_train_batch_size in train.py, or shorten descriptions.
Another: the loss shoots up or turns into garbage numbers. Lower learning_rate.
Another: "failed" is high in the table. The tuned model is not producing a
  readable number. Check that prompts end in "Price is $" and that you loaded
  the right adapter.

Cost note (approximate)
-----------------------
No per-token bill for the tuned model; you pay for GPU time. A free notebook GPU
costs nothing; a rented one is typically a fraction of a dollar to a few dollars
an hour, and a small run takes minutes to a couple of hours. Set GPU_HOURLY_PRICE
so the table prices the tuned model. The optional frontier row makes one paid
call per test example (a few cents with a small model). Prices change.

Clean up
--------
  Stop or delete the rented GPU or notebook so it stops billing.
  rm -rf price-run-01 data           (the run folder, checkpoints and data; use your RUN_NAME)
  deactivate
  rm -rf .venv .env
  The downloaded base model is in the model hub cache (usually ~/.cache/huggingface).
  If you pushed to the hub, delete the dataset and adapter repos there if unwanted.

What changed since the previous lesson
--------------------------------------
The previous project scored classic guessers and a prompted big model on one
board. This one adds a model you train yourself: examples shaped as a prompt
ending in "Price is $" plus a short completion, a split made once and then
walled off, a QLoRA run with the settings from the two lessons before it, a
guess function (top-token average, or digit reading when numbers are split), and
a table that prices the tuned model by GPU time. Added to make it run on its
own: invented price tags, local data files instead of the hub, saving the
adapter locally, and a command line.
