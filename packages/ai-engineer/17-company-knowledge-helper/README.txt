COMPANY KNOWLEDGE HELPER
========================

What you build
--------------
A helper that answers questions from the town council's files (made-up files,
all invented) and tells Auntie Lim which file each answer came from. You start
from the basic retrieval chain (cut files into chunks, search by meaning, paste
the best chunks into a prompt) and add four fixes, then prove each one with
numbers from a small test set:
  1. smarter chunks: a model splits each file into pieces with a headline,
     a short summary and the original text (made once, then reused);
  2. fetch 20 chunks, then ask a model to rerank them and keep the best 5;
  3. rewrite follow-up questions ("and her manager?") into standalone search
     queries, and search with both the original and the rewrite;
  4. cite the source file names in every answer.

Folder structure
----------------
  README.txt
  requirements.txt
  env.example            copy to .env and add your key
  final/
    helper.py            complete working version (build, ask, chat, eval)
    tests.jsonl          six test questions with keywords and reference answers
    test_offline.py      offline check of the files and the test set
    council_files/       eight invented files in staff/, services/, notices/ (.txt)
  starter/
    helper.py            same layout, with TODO stubs
    tests.jsonl, test_offline.py, council_files/   same as final

Requirements
------------
  - Python 3.10 or newer
  - Packages: see requirements.txt (LangChain pieces, Chroma, sentence-transformers, Gradio)
  - An OpenAI API key (chat model for chunking, reranking, rewriting, answering)
  - The small local embedding model downloads once from the model hub (about
    100 MB). It needs no key.
  - About 2 GB of disk for the Python packages

Install
-------
  python3 -m venv .venv
  source .venv/bin/activate          (Windows: .venv\Scripts\activate)
  pip install -r requirements.txt
  cp env.example .env                (then edit .env and replace YOUR_KEY_HERE)

Run
---
  cd final
  python helper.py build             (first time only: builds both stores, calls the model per file)
  python helper.py ask "Who is in charge of lift repairs?"
  python helper.py chat              (a chat page; try the follow-up "And her manager?" after a question about a person)
  python helper.py eval              (prints scores for the basic chain and the full pipeline)

For the starter: cd starter, fill in the TODOs, run the same way.

Test / what success looks like
------------------------------
Offline check (no key, no download of models):
  cd final
  python test_offline.py
  -> ok: 8 files, 6 tests, keywords all present

After "build", "ask" should answer that Hafiz Rahman, the lift officer, handles
lift repairs, and end with a line like "Sources: lift-repairs.txt, hafiz-rahman.txt".
"eval" prints MRR and keyword coverage per category (direct, relationship,
holistic) for the basic chain and then the full pipeline. The numbers are
between 0 and 1 and will differ per run and per model. With only eight small
files, the basic chain already does well, so gaps are small. The point is the
method: change one thing, re-run the same tests, compare per category.

One failure case: results look like rubbish after you change the embedding model.
  The old stores were built with another embedding model, so questions and chunks
  live in different number spaces. Delete council_db and council_db_smart and
  run "build" again.
Another: "And her manager?" finds nothing useful. Search only sees the latest
  question. Check that fetch() rewrites the question first and that you search
  with both versions.
Another: the build step is slow or hits a rate limit. Lower max_workers from 4.

Cost note (approximate)
-----------------------
"build" makes one model call per file (eight calls). Each "ask" makes about
three calls (rewrite, rerank, answer). "eval" runs the full pipeline six times.
All of it is typically a few cents in total with a small model. The embeddings
run on your own machine and are free. Prices change, so check your provider.

Clean up
--------
  Press Ctrl+C to stop the chat page.
  rm -rf council_db council_db_smart   (the saved stores)
  deactivate
  rm -rf .venv .env
  The embedding model stays in the model hub cache (usually ~/.cache/huggingface).

What changed since the previous lesson
--------------------------------------
The earlier lessons showed the pieces: loading files, 1000-character chunks,
the vector store, the basic chain and the scoring functions. This package puts
them in one file and adds the four fixes (model-made chunks, rerank, rewrite,
sources). Added to make it run on its own: invented council files and a test
set, a command line, models created on first use, and the files saved as .txt
instead of .md so they can be hosted next to the code.

ACCEPTANCE CRITERIA
-------------------
You are done when:
- python test_offline.py in final/ prints an ok line with no key and no model download.
- After python helper.py build, asking who is in charge of lift repairs names Hafiz Rahman and ends with a Sources line.
- In chat, the follow-up 'And her manager?' works after a question about a person, because the question is rewritten first.
- python helper.py eval prints MRR and coverage per category for both the basic chain and the full pipeline.
- tests.jsonl is the question set that eval reads; the full pipeline scores at least as well as the basic chain.

Compare your work with final/ afterwards, starting with: helper.py, tests.jsonl, test_offline.py.

验收标准（中文）
- 在 final/ 里运行 python test_offline.py，打印 ok 行，不需要密钥，也不下载模型。
- python helper.py build 之后，问谁负责电梯维修，回答点出 Hafiz Rahman，并以 Sources 行结尾。
- 聊天时，问过某个人之后再问 “And her manager?” 也能答对，因为问题会先被改写。
- python helper.py eval 为基础链和完整流程分别按类别打印 MRR 和覆盖率。
- tests.jsonl 是 eval 读取的问题集；完整流程的得分不低于基础链。
