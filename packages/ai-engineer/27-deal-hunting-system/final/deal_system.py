"""The whole system in one class: DealSystem holds the agents and the memory, and exposes one method, run().

DEMO_MODE=1 (the default) uses local stand-in agents and the sample feed: no keys, no GPU, no cost.
DEMO_MODE=0 uses the real agents: a tuned model on a serverless GPU, retrieval with a big model,
a small neural net, a model-powered scanner and phone alerts.
"""
import json
import os
import threading

import numpy as np
import requests
from dotenv import load_dotenv  # added: read settings from .env

from agents import (EnsembleAgent, ForestAgent, FrontierAgent, LinearAgent, MessengerAgent, NearestAgent,
                    NeuralAgent, PlannerAgent, ScannerAgent, SpecialistAgent, DemoScanner)
from logbus import log

load_dotenv()  # added
DEMO = os.getenv("DEMO_MODE", "1") == "1"
THRESHOLD = float(os.getenv("THRESHOLD", "50"))   # how many dollars under the estimate counts as a deal
VAL_SIZE = int(os.getenv("VAL_SIZE", "50"))       # validation items used to fit the ensemble weights


def load_jsonl(path):  # added
    return [json.loads(line) for line in open(path, encoding="utf-8") if line.strip()]


def build_store(rows):  # added: the vector store of known items and prices that FrontierAgent searches
    import chromadb
    from sentence_transformers import SentenceTransformer
    embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")   # 384 numbers per item
    collection = chromadb.PersistentClient(path="deals_db").get_or_create_collection("items")
    if collection.count() == 0:   # built last time: reuse it, no new embedding
        collection.add(ids=[str(i) for i in range(len(rows))],
                       documents=[r["description"] for r in rows],
                       embeddings=embedder.encode([r["description"] for r in rows]).tolist(),
                       metadatas=[{"price": r["price"]} for r in rows])
    return collection, embedder


def build_ensemble():  # the lesson calls this "a small helper of yours": assemble the guessers into the ensemble
    train, val = load_jsonl("data/train.jsonl"), load_jsonl("data/val.jsonl")[:VAL_SIZE]
    if DEMO:
        agents = [LinearAgent(train), ForestAgent(train), NearestAgent(train)]
    else:
        from openai import OpenAI
        client = OpenAI()
        store, embedder = build_store(train)
        agents = [SpecialistAgent(client), FrontierAgent(store, embedder, client), NeuralAgent(train)]
    log("system", f"fitting ensemble weights on {len(val)} validation items")
    val_guesses = np.array([[a.price(r["description"]) for a in agents] for r in val])
    return EnsembleAgent(agents, val_guesses, [r["price"] for r in val])


def fetch_feed():  # the lesson calls this "a small helper of yours": the current deals feed as text
    source = os.getenv("FEED_URL", "data/feed_sample.txt")
    if source.startswith("http"):
        return requests.get(source, timeout=15).text
    return open(source, encoding="utf-8").read()


def build_scanner():  # added: the demo reads the sample feed; the real scanner asks a model to pick
    if DEMO:
        return DemoScanner()
    from openai import OpenAI
    return ScannerAgent(OpenAI())


class DealSystem:
    def __init__(self):
        self.planner = PlannerAgent(build_scanner(), build_ensemble(), MessengerAgent(), threshold=THRESHOLD)
        self.opportunities = []                 # kept between runs
        self.lock = threading.Lock()            # added: the button and the timer may fire at the same time

    def run(self):
        with self.lock:
            new = self.planner.run(fetch_feed())
            self.opportunities.extend(new)
            return self.opportunities
