CODE TRANSLATOR
===============

What you build
--------------
Ah Boy has a Python script that is slow. You build a translator: give it
Python, a model writes C++, and your code compiles it, runs it, checks that
the output matches Python's line for line, and times it. Because the score is
objective (does it compile, is the output right, how much faster), you can
rank several models fairly. You then pick the cheapest one that is good enough.

Folder structure
----------------
  README.txt
  requirements.txt
  env.example            copy to .env (API key and your model shortlist)
  final/
    translate.py         complete working version
    hard_program.py      an awkward test program (invented) with an overflow trap
    test_offline.py      offline check of the helpers
  starter/
    translate.py         same layout, with TODO stubs
    hard_program.py      same test program
    test_offline.py      the same check

Requirements
------------
  - Python 3.10 or newer
  - g++ (a C++ compiler). Linux: install build-essential. macOS: xcode-select
    --install. Windows: use WSL, or MinGW and change the run command to main.exe.
  - Packages: see requirements.txt (openai, python-dotenv)
  - An OpenAI API key (or any provider with a compatible endpoint)
  - Model names your provider currently offers, listed in MODELS in .env

Install
-------
  python3 -m venv .venv
  source .venv/bin/activate          (Windows: .venv\Scripts\activate)
  pip install -r requirements.txt
  cp env.example .env                (then edit .env: key and MODELS)
  g++ --version                      (check the compiler is there)

Run
---
  cd final
  python translate.py hard_program.py
  python translate.py hard_program.py --models gpt-5-mini,gpt-5

For the starter: cd starter, fill in the TODOs, run the same way.

Test / what success looks like
------------------------------
Offline check (no key needed, takes a few seconds because it runs the Python):
  cd final
  python test_offline.py
  -> ok: fences stripped; python reference printed 'best run: ...' in 3.0s
  (the number of seconds depends on your machine)

With a key, one line per model, for example:
  python: 3.1s
  gpt-5-mini ok, 40x faster
  gpt-5 WRONG OUTPUT best run: ...
The exact speedups and which models fail will differ for you. The point is that
a fast model that prints a wrong number is flagged, not rewarded.

One failure case: every model reports "failed to compile" and the output shows
  stray backticks or "g++: command not found".
  Backticks: strip_fences is not cleaning the reply. Command not found: install
  g++ (see Requirements) and check it with g++ --version.
Another: almost no speedup. Check the -O3 -march=native -flto flags are in COMPILE.
Another: "WRONG OUTPUT" on the hash line. The model used 64-bit ints where the
  middle value needs more (the overflow trap). That is the test doing its job.

Cost note (approximate)
-----------------------
One short program per model is one small call each, usually a fraction of a
cent to a few cents, with larger reasoning models costing more. Prices change.

Clean up
--------
  rm -f main main.cpp                (compiled program and generated source)
  deactivate
  rm -rf .venv .env

What changed since the previous lesson
--------------------------------------
The previous lesson was about comparing models on your own examples with a
small table (using the same client and a timing helper). New here: the
examples are programs, not messages. The scoring is objective: compile,
run, compare the output with Python's, and time it. Added to make it run on
its own: .env loading, a command line, a MODELS shortlist and a hard test
program with a deliberate overflow trap.

ACCEPTANCE CRITERIA
-------------------
You are done when:
- python test_offline.py in final/ prints an ok line (fences stripped; python reference printed 'best run: ...') and needs no key.
- python translate.py hard_program.py prints one line per model: failed to compile, WRONG OUTPUT, or ok with a speedup.
- A correct translation prints exactly the same two lines as hard_program.py.
- Removing the optimisation flags from COMPILE shrinks the speedup a lot.
- A model that returns a reply wrapped in code fences still compiles, because the fences are stripped.

Compare your work with final/ afterwards, starting with translate.py, hard_program.py and test_offline.py.

验收标准（中文）
- 在 final/ 里运行 python test_offline.py，打印 ok 行（去掉代码围栏；python 参考版打印 “best run: ...”），不需要密钥。
- python translate.py hard_program.py 每个模型一行：编译失败、WRONG OUTPUT，或 ok 加加速倍数。
- 正确的翻译输出的两行与 hard_program.py 完全相同。
- 去掉 COMPILE 里的优化选项，加速倍数明显变小。
- 模型把回复包在代码围栏里也能编译，因为围栏会被去掉。
