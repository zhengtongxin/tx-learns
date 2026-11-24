"""The whole system in one class (starter). Fill in each TODO.

DEMO_MODE=1 (the default) uses local stand-in agents and the sample feed: no keys, no GPU, no cost.
"""
import json
import os
import threading

import numpy as np
import requests
from dotenv import load_dotenv

from agents import (EnsembleAgent, ForestAgent, FrontierAgent, LinearAgent, MessengerAgent, NearestAgent,
                    NeuralAgent, PlannerAgent, ScannerAgent, SpecialistAgent, DemoScanner)
from logbus import log

load_dotenv()
DEMO = os.getenv("DEMO_MODE", "1") == "1"
THRESHOLD = float(os.getenv("THRESHOLD", "50"))
VAL_SIZE = int(os.getenv("VAL_SIZE", "50"))


def load_jsonl(path):
    return [json.loads(line) for line in open(path, encoding="utf-8") if line.strip()]


def build_store(rows):
    import chromadb
    from sentence_transformers import SentenceTransformer
    embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    collection = chromadb.PersistentClient(path="deals_db").get_or_create_collection("items")
    if collection.count() == 0:
        collection.add(ids=[str(i) for i in range(len(rows))],
                       documents=[r["description"] for r in rows],
                       embeddings=embedder.encode([r["description"] for r in rows]).tolist(),
                       metadatas=[{"price": r["price"]} for r in rows])
    return collection, embedder


def build_ensemble():
    # TODO: load train.jsonl and the first VAL_SIZE rows of val.jsonl. Pick the agents:
    # demo: LinearAgent, ForestAgent, NearestAgent (train rows)
    # live: SpecialistAgent(client), FrontierAgent(store, embedder, client), NeuralAgent(train)
    # Then collect every agent's guess for every validation item (one column per agent) and return
    # EnsembleAgent(agents, val_guesses, true_prices)
    raise NotImplementedError


def fetch_feed():
    # TODO: FEED_URL (default data/feed_sample.txt): download it if it starts with "http", otherwise read the file
    raise NotImplementedError


def build_scanner():
    if DEMO:
        return DemoScanner()
    from openai import OpenAI
    return ScannerAgent(OpenAI())


class DealSystem:
    def __init__(self):
        # TODO: a PlannerAgent made from the scanner, the ensemble, a MessengerAgent and THRESHOLD;
        # an empty list `opportunities`; a threading.Lock
        raise NotImplementedError

    def run(self):
        # TODO: under the lock: run the planner on fetch_feed(), extend opportunities with the new deals, return them all
        raise NotImplementedError
