"""Company knowledge helper: the basic retrieval chain plus four fixes, with a test set to prove them.

Commands:
  python helper.py build            build both stores (basic chunks, and model-made smart chunks)
  python helper.py ask "question"   one answer with sources (full pipeline)
  python helper.py chat             a Gradio chat page
  python helper.py eval             score retrieval for basic vs full, per category
"""
import argparse
import functools
import json
import os
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from dotenv import load_dotenv  # added: read OPENAI_API_KEY from .env
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pydantic import BaseModel

load_dotenv()  # added
FILES = "council_files"
BASIC_DB = "council_db"            # lesson 14: simple 1000-character chunks
SMART_DB = "council_db_smart"      # this lesson: model-made chunks


# ---- added: models are created on first use, so importing this file needs no key and no download ----
@functools.cache
def embedder():
    # one embedding model for chunks AND questions: never change it without deleting the stores
    return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")


@functools.cache
def llm():
    return ChatOpenAI(model="gpt-4.1-mini", temperature=0)


# ---- earlier lessons: load the files, count them, cut simple chunks, build the basic store ----
def load_docs(folder=FILES):
    docs = []
    for path in Path(folder).glob("**/*.txt"):  # added: .txt (not .md) so the files can be hosted next to the code
        docs.append(Document(page_content=path.read_text(encoding="utf-8"),
                             metadata={"source": path.name, "kind": path.parent.name}))
    return docs


def build_basic(docs):
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_documents(docs)  # metadata is copied to every chunk
    return Chroma.from_documents(documents=chunks, embedding=embedder(), persist_directory=BASIC_DB)


def open_store(path):
    return Chroma(persist_directory=path, embedding_function=embedder())


# ---- Step 1: smarter chunks, made once by a model ----
class Piece(BaseModel):
    headline: str          # a few words likely to match a question
    summary: str
    original_text: str


class Pieces(BaseModel):
    pieces: list[Piece]


@functools.cache
def cutter():
    return ChatOpenAI(model="gpt-4.1-mini", temperature=0).with_structured_output(Pieces)


def smart_chunks(doc):
    plan = ("Split this document into overlapping pieces that each cover one idea. "
            "For every piece give a headline, a short summary and the original text.\n\n" + doc.page_content)
    return [Document(page_content=f"{p.headline}\n{p.summary}\n{p.original_text}",
                     metadata={"source": doc.metadata["source"], "kind": doc.metadata["kind"]})
            for p in cutter().invoke(plan).pieces]


def build_smart(docs):
    with ThreadPoolExecutor(max_workers=4) as pool:
        groups = list(pool.map(smart_chunks, docs))
    return Chroma.from_documents([c for g in groups for c in g], embedder(), persist_directory=SMART_DB)


def build_all():  # added: ties the build steps together; slow steps run once and are reused
    docs = load_docs()
    print(len(docs), "files")
    if not os.path.exists(BASIC_DB):
        build_basic(docs)
    if not os.path.exists(SMART_DB):  # slow step: run once, then reuse
        build_smart(docs)
    print("stores ready:", BASIC_DB, SMART_DB)


# ---- Step 2: fetch more, then rerank ----
class Order(BaseModel):
    ranked: list[int]       # chunk numbers, best first


@functools.cache
def sorter():
    return ChatOpenAI(model="gpt-4.1-mini", temperature=0).with_structured_output(Order)


def rerank(question, chunks, keep=5):
    listing = "\n\n".join(f"[{i}] {c.page_content}" for i, c in enumerate(chunks))
    order = sorter().invoke(f"Question: {question}\n\nPut these chunk numbers in order, "
                            f"most useful for answering first:\n\n{listing}").ranked
    return [chunks[i] for i in order if 0 <= i < len(chunks)][:keep]


# ---- Step 3: rewrite the question before searching ----
def rewrite(question, history):
    chat = "\n".join(f"{m['role']}: {m['content']}" for m in history)
    return llm().invoke(f"Chat so far:\n{chat}\n\nTurn the last question into one standalone "
                        f"search query that names every person or thing. Query only.\n\n{question}").content.strip()


def fetch(question, history):
    store = open_store(SMART_DB)
    rewritten = rewrite(question, history)
    seen, merged = set(), []
    for q in (question, rewritten):                  # keep both: the rewrite may drift
        for c in store.similarity_search(q, k=20):
            if c.page_content not in seen:
                seen.add(c.page_content)
                merged.append(c)
    return rerank(rewritten, merged)


# ---- the basic chain from the retrieval chain lesson, kept for the before/after comparison ----
BASIC_TEMPLATE = """You help residents with questions about the town council.
Answer using only the context below.
If the answer is not in the context, say you do not know.
Context:
{context}"""


def answer_basic(question, history):
    chunks = open_store(BASIC_DB).as_retriever(search_kwargs={"k": 4}).invoke(question)
    context = "\n\n".join(c.page_content for c in chunks)
    messages = [("system", BASIC_TEMPLATE.format(context=context))]
    messages += [(m["role"], m["content"]) for m in history]
    messages.append(("user", question))
    return llm().invoke(messages).content


# ---- Step 4: cite sources, then prove it helped ----
def answer(question, history):
    chunks = fetch(question, history)
    context = "\n\n".join(f"Source: {c.metadata['source']}\n{c.page_content}" for c in chunks)
    system = ("Answer using only the context below. If it is not there, say you do not know. "
              "End with a line starting 'Sources:' listing the file names you used.\n\n" + context)
    messages = [("system", system)] + [(m["role"], m["content"]) for m in history]
    messages.append(("user", question))
    return llm().invoke(messages).content


def first_rank(keyword, chunks):
    for rank, c in enumerate(chunks, start=1):
        if keyword.lower() in c.page_content.lower():
            return rank
    return None                                   # not found


def score_retrieval(test, k=10, mode="full"):
    if mode == "basic":                           # the lesson-16 way: plain similarity search
        chunks = open_store(BASIC_DB).similarity_search(test["question"], k=k)
    else:                                         # now scores fetch(): rewrite, merge and rerank included
        chunks = fetch(test["question"], [])      # k is unused here: fetch keeps the best 5
    ranks = [first_rank(w, chunks) for w in test["keywords"]]
    mrr = sum(1 / r for r in ranks if r) / len(ranks)
    coverage = sum(1 for r in ranks if r) / len(ranks)
    return mrr, coverage


def load_tests(path="tests.jsonl"):
    return [json.loads(line) for line in open(path, encoding="utf-8") if line.strip()]


def report(k, mode="full"):
    by_cat = defaultdict(list)
    for t in load_tests():
        by_cat[t["category"]].append(score_retrieval(t, k, mode))
    for cat, rows in by_cat.items():
        print(f"  {cat:13s} MRR {sum(r[0] for r in rows) / len(rows):.2f}"
              f"  coverage {sum(r[1] for r in rows) / len(rows):.2f}")


# added: a small command line so the file runs on its own
if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["build", "ask", "chat", "eval"])
    ap.add_argument("question", nargs="?")
    args = ap.parse_args()
    if args.command == "build":
        build_all()
    elif args.command == "ask":
        print(answer(args.question or "Who is in charge of lift repairs?", []))
    elif args.command == "chat":
        import gradio as gr
        gr.ChatInterface(answer, type="messages").launch()
    else:
        print("basic chain (plain search, k=10):")
        report(10, "basic")
        print("full pipeline (smart chunks + rewrite + rerank):")
        report(10, "full")
