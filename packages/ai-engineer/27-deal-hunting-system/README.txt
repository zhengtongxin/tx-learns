DEAL-HUNTING SYSTEM
===================

What you build
--------------
Ah Boy sleeps, but gadgets keep getting listed. You build a system that, all
night, finds listings priced well below their estimated value and buzzes a
phone. It is many small agents (each has one job) plus memory, a loop and a
screen:
  - three price guessers: a tuned model on a serverless GPU (specialist), a big
    model shown similar known items (frontier), and a small neural net;
  - an ensemble agent that combines their three estimates with weights fitted
    on validation items;
  - a scanner agent that picks the best deals from a feed (structured output);
  - a messenger agent that sends a phone alert;
  - a planner agent that runs the fixed workflow: scan, estimate, alert if the
    estimate is more than a threshold above the asking price, and never send
    the same deal twice (memory in a JSON file);
  - a DealSystem class with one run() method, and a Gradio screen with a table,
    a five-minute timer and a live colour-coded log (agents write to a queue,
    the screen drains it, so lines from many threads never get mixed up).

Two modes, so you can run it without spending anything:
  DEMO_MODE=1 (default): stand-in agents (word counts, a forest, nearest
    neighbours) and a sample feed. No keys, no GPU, no cost. It shows the system
    working end to end.
  DEMO_MODE=0: the real agents. This needs a trained adapter (from the
    fine-tuning project), a Modal account for the serverless GPU, an OpenAI key,
    and optionally a phone-alert account. It cannot run without that paid cloud
    setup, so treat the real-mode code as the reference.

Folder structure
----------------
  README.txt
  requirements.txt
  env.example            copy to .env
  final/
    agents.py            all agents, the planner, and the optional model-planned loop
    deal_system.py       DealSystem, build_ensemble, fetch_feed, the vector store helper
    app.py               the screen, and the once / reset / planner commands
    logbus.py            the log queue and colours
    price_guesser.py     the tuned model as a serverless GPU function (real mode)
    make_data.py         makes the invented data
    data/                train.jsonl, val.jsonl, feed_sample.txt (invented)
    test_offline.py      offline check of the whole system in demo mode
  starter/
    same file names, with TODO stubs (logbus.py, make_data.py, data/ and test_offline.py are complete)

Requirements
------------
  - Python 3.10 or newer
  - Demo mode: numpy, scikit-learn, pydantic, requests, gradio, python-dotenv
  - Real mode also needs: openai, torch, chromadb, sentence-transformers, modal
    (all in requirements.txt). The package list is long, so install in a fresh
    virtual environment. Disk: a few GB.
  - Real mode accounts and keys: an OpenAI key, a Modal account with a token
    and a stored hub token, a model hub token for your adapter, and (optional)
    Pushover keys for phone alerts.

Install
-------
  python3 -m venv .venv
  source .venv/bin/activate          (Windows: .venv\Scripts\activate)
  pip install -r requirements.txt
  cp env.example .env                (keep DEMO_MODE=1 for the demo)

Run
---
  cd final
  python make_data.py                (only if data/ is missing)
  python app.py once                 (run once, no screen, print the deals found)
  python app.py                      (the screen: press "Look now", watch the log)
  python app.py reset                (reset the memory to two old deals to see deals again)

Real mode (DEMO_MODE=0), once you have a trained adapter:
  pip install modal && modal setup
  modal secret create hub-token HF_TOKEN=<your model hub token>
  set ADAPTER_ID and the keys in .env
  modal deploy price_guesser.py
  python app.py                      (the first run is slow: the GPU has a cold start)
  python app.py planner              (a model plans with three fake tools, to watch the loop)

For the starter: cd starter, fill in the TODOs, run the same way.

Test / what success looks like
------------------------------
Offline check (no keys, no GPU):
  cd final
  python test_offline.py
  -> ok: found 3 deals, including the 3 planted bargains; the second run added none

"python app.py once" prints coloured-tag lines such as:
  [scanner] read 8 listings from the sample feed
  [ensemble] combined estimate $521
  [messenger] Deal: Used Nova camera ... for $195.0 (worth about $521) https://shop.example/listing/1001
  [planner] run finished, 3 new deals
The screen shows the same deals in a table (item, price, estimate, discount,
link) and a live log underneath. Press the button again: no new rows, because
the memory file remembers what was already sent. The exact estimates may differ
a little from run to run and by library version.

One failure case: on the first real-mode run the screen looks hung.
  The serverless GPU has a cold start: the container boots and the model loads,
  which can take minutes. Wait for the log panel to fill. Later runs are fast.
Another: the same deal arrives twice. The seen_deals.json memory was deleted or
  is in another folder. Run from the same folder each time, or set SEEN_FILE.
Another: log lines from several agents come out mixed up. Agents must write to
  the queue (log()), and only the screen reads it (drain_log()).
Another: a big bill. The scanner and planner use models on every run. Keep cheap
  models and the five-minute timer; never set the timer to seconds.

Cost note (approximate)
-----------------------
Demo mode is free. In real mode each run makes a scanner call, then per
listing a tuned-model call (GPU seconds), a retrieval call to a big model and an
ensemble step. Left on all night every five minutes, that can add up to a few
dollars with small models, and much more with large ones. Check your providers'
price pages and dashboards. The serverless GPU bills only the seconds it runs.

Clean up
--------
  Press Ctrl+C to stop the screen.
  rm -f seen_deals.json              (the memory file)
  rm -rf deals_db                    (the vector store, real mode)
  modal app stop price-guesser       (stop the deployed GPU function, real mode)
  modal volume delete price-guesser-cache
  modal secret delete hub-token      (if you no longer need it)
  deactivate
  rm -rf .venv .env
  Delete or rotate any API keys you no longer need.

What changed since the previous lesson
--------------------------------------
The previous lessons showed each piece alone: the model behind an API, the
small agents, the ensemble, the scanner and messenger, and the fixed planner.
This project joins them: one DealSystem class with a single run() method, a
Gradio screen built piece by piece (table, timer, log), and the log queue.
Added to make it run on its own: the demo mode and invented data, local helpers
the lessons only named (build_ensemble, fetch_feed, the vector store), a neural
net agent, safe push-alert and parsing fallbacks, a lock around run(), and a
command line.

ACCEPTANCE CRITERIA
-------------------
You are done when:
- python test_offline.py in final/ (demo mode) prints an ok line with no key and no GPU.
- python app.py once finds the 3 planted bargains in the sample feed.
- Running it again finds nothing new, because the memory file remembers what was already sent.
- On the screen the table fills and coloured log lines from several agents appear in order.
- The log names the scanner, the price guesser and the messenger as separate agents.

Compare your work with final/ afterwards, starting with: deal_system.py, agents.py, logbus.py.

验收标准（中文）
- 在 final/ 里（演示模式）运行 python test_offline.py，打印 ok 行，不需要密钥和 GPU。
- python app.py once 在样例信息流里找到 3 个预先埋好的特价。
- 再次运行什么也找不到，因为记忆文件记住了已发送的内容。
- 界面上的表格逐渐填满，多个智能体的彩色日志按顺序出现。
- 日志里扫描、估价和通知分别是不同的智能体。
