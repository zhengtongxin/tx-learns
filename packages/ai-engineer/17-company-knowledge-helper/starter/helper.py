"""Company knowledge helper (starter). Fill in each TODO.

Commands:
  python helper.py build | ask "question" | chat | eval
"""
import argparse
import functools
import json
import os
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pydantic import BaseModel

load_dotenv()
FILES = "council_files"
BASIC_DB = "council_db"
SMART_DB = "council_db_smart"


@functools.cache
def embedder():
    return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")


@functools.cache
def llm():
    return ChatOpenAI(model="gpt-4.1-mini", temperature=0)


def load_docs(folder=FILES):
    # TODO: one Document per *.txt file under `folder` (search sub-folders too; the files are .txt).
    # metadata: {"source": file name, "kind": name of the parent folder}
    raise NotImplementedError


def build_basic(docs):
    # TODO: RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200), split_documents,
    # then Chroma.from_documents(..., persist_directory=BASIC_DB)
    raise NotImplementedError


def open_store(path):
    # TODO: Chroma(persist_directory=path, embedding_function=embedder())
    raise NotImplementedError


class Piece(BaseModel):
    headline: str
    summary: str
    original_text: str


class Pieces(BaseModel):
    pieces: list[Piece]


@functools.cache
def cutter():
    # TODO: a ChatOpenAI(temperature=0) that returns Pieces (with_structured_output)
    raise NotImplementedError


def smart_chunks(doc):
    # TODO: ask cutter() to split the document into pieces; make one Document per piece whose text is
    # headline + summary + original text, and whose metadata keeps "source" and "kind"
    raise NotImplementedError


def build_smart(docs):
    # TODO: run smart_chunks over all docs, four at a time (ThreadPoolExecutor), flatten, store in SMART_DB
    raise NotImplementedError


def build_all():
    docs = load_docs()
    print(len(docs), "files")
    if not os.path.exists(BASIC_DB):
        build_basic(docs)
    if not os.path.exists(SMART_DB):  # slow step: run once, then reuse
        build_smart(docs)
    print("stores ready:", BASIC_DB, SMART_DB)


class Order(BaseModel):
    ranked: list[int]       # chunk numbers, best first


@functools.cache
def sorter():
    # TODO: a ChatOpenAI(temperature=0) that returns Order
    raise NotImplementedError


def rerank(question, chunks, keep=5):
    # TODO: number the chunks, ask sorter() for the best-first order, keep only valid
    # numbers (0 <= i < len(chunks)) and return the best `keep`
    raise NotImplementedError


def rewrite(question, history):
    # TODO: ask llm() to turn the last question plus the chat so far into one standalone search query
    raise NotImplementedError


def fetch(question, history):
    # TODO: rewrite the question; search the smart store (k=20) with BOTH the original and the rewrite;
    # merge without duplicates; return rerank(rewritten, merged)
    raise NotImplementedError


BASIC_TEMPLATE = """You help residents with questions about the town council.
Answer using only the context below.
If the answer is not in the context, say you do not know.
Context:
{context}"""


def answer_basic(question, history):
    # TODO: top 4 chunks from the basic store, paste into BASIC_TEMPLATE, add history and question, invoke llm()
    raise NotImplementedError


def answer(question, history):
    # TODO: fetch() the chunks; put "Source: <file>" above each chunk in the context;
    # tell the model to end with a 'Sources:' line; invoke llm() with history and question
    raise NotImplementedError


def first_rank(keyword, chunks):
    # TODO: rank (starting at 1) of the first chunk containing the keyword (ignore case), or None
    raise NotImplementedError


def score_retrieval(test, k=10, mode="full"):
    # TODO: chunks from plain similarity_search on the basic store (mode "basic") or from fetch() (mode "full");
    # then MRR = average of 1/rank (0 if missing) and coverage = share of keywords found
    raise NotImplementedError


def load_tests(path="tests.jsonl"):
    return [json.loads(line) for line in open(path, encoding="utf-8") if line.strip()]


def report(k, mode="full"):
    by_cat = defaultdict(list)
    for t in load_tests():
        by_cat[t["category"]].append(score_retrieval(t, k, mode))
    for cat, rows in by_cat.items():
        print(f"  {cat:13s} MRR {sum(r[0] for r in rows) / len(rows):.2f}"
              f"  coverage {sum(r[1] for r in rows) / len(rows):.2f}")


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
