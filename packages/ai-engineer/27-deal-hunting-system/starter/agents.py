"""All the agents (starter). Fill in each TODO.
The demo agents and NeuralAgent are already complete, so you can run the whole system in DEMO_MODE=1 as soon as
EnsembleAgent, PlannerAgent and the other pieces marked TODO are done.
"""
import json
import os
import re

import numpy as np
import requests
from pydantic import BaseModel
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_extraction.text import CountVectorizer, HashingVectorizer
from sklearn.linear_model import LinearRegression
from sklearn.metrics.pairwise import cosine_similarity

from logbus import log


def parse_number(text):
    found = re.search(r"\d[\d,]*\.?\d*", text)
    return float(found.group().replace(",", "")) if found else None


class Deal(BaseModel):
    description: str
    price: float
    url: str


class DealList(BaseModel):
    deals: list[Deal]


# ============ the live agents ============

def tidy(client, raw: str) -> str:
    # TODO: ask a cheap model to rewrite a messy listing as one plain sentence (item, size, condition, no emoji)
    raise NotImplementedError


class SpecialistAgent:
    def __init__(self, client=None):
        self.client, self.fn = client, None

    def price(self, description: str) -> float:
        # TODO: look up modal.Function.from_name("price-guesser", "price") once, tidy the description if a client
        # was given, call .remote(text), log the estimate with log("specialist", ...), return it
        raise NotImplementedError


class FrontierAgent:
    def __init__(self, store, embedder, client):
        self.store, self.embedder, self.client = store, embedder, client

    def price(self, description: str) -> float:
        # TODO: embed the description (embedder.encode([...]).tolist()), query the store for 5 nearest items,
        # show them in the prompt as "<text> costs $<price>", ask the big model for a number only,
        # parse it with parse_number (fall back to the average of the similar items if there is no number)
        raise NotImplementedError


class NeuralAgent:
    """The small neural network from the predictor lesson (complete: the lesson that taught it was earlier)."""

    def __init__(self, rows, epochs=30):
        import torch
        import torch.nn as nn
        self.torch = torch
        self.hasher = HashingVectorizer(n_features=5000)

        class PriceNet(nn.Module):
            def __init__(self):
                super().__init__()
                self.layers = nn.Sequential(nn.Linear(5000, 128), nn.ReLU(), nn.Linear(128, 32), nn.ReLU(), nn.Linear(32, 1))

            def forward(self, x):
                return self.layers(x).squeeze(-1)

        self.net = PriceNet()
        X = torch.tensor(self.hasher.transform([r["description"] for r in rows]).toarray(), dtype=torch.float32)
        y = torch.tensor([r["price"] / 100 for r in rows], dtype=torch.float32)
        opt = torch.optim.Adam(self.net.parameters(), lr=1e-3)
        for _ in range(epochs):
            for i in range(0, len(rows), 64):
                loss = nn.functional.l1_loss(self.net(X[i:i + 64]), y[i:i + 64])
                opt.zero_grad()
                loss.backward()
                opt.step()
        self.net.eval()

    def price(self, description: str) -> float:
        torch = self.torch
        x = torch.tensor(self.hasher.transform([description]).toarray(), dtype=torch.float32)
        with torch.no_grad():
            estimate = float(self.net(x)[0]) * 100
        log("neural", f"${estimate:.0f} for {description[:40]}...")
        return estimate


class EnsembleAgent:
    def __init__(self, agents, val_guesses, val_truth):
        # TODO: keep the agents; fit LinearRegression(positive=True) from the validation guesses
        # (one column per agent) to the true prices
        raise NotImplementedError

    def price(self, description: str) -> float:
        # TODO: ask every agent, predict with the fitted weights, log("ensemble", ...), return a float
        raise NotImplementedError


class ScannerAgent:
    def __init__(self, client):
        self.client = client

    def scan(self, feed_text: str) -> list[Deal]:
        # TODO: ask a cheap model to pick the five best-described deals as a DealList (structured output:
        # client.chat.completions.parse(..., response_format=DealList)); return reply.choices[0].message.parsed.deals
        raise NotImplementedError


class MessengerAgent:
    def alert(self, deal: Deal, estimate: float) -> None:
        # TODO: build the message "Deal: <description> for $<price> (worth about $<estimate>) <url>";
        # if PUSHOVER_APP_TOKEN and PUSHOVER_USER_KEY are set, POST it to https://api.pushover.net/1/messages.json;
        # always log("messenger", text)
        raise NotImplementedError


# ============ the demo agents (complete) ============

class LinearAgent:
    def __init__(self, rows):
        self.counter = CountVectorizer(max_features=1500, stop_words="english")
        X = self.counter.fit_transform([r["description"] for r in rows])
        self.model = LinearRegression().fit(X, [r["price"] for r in rows])

    def price(self, description: str) -> float:
        return float(self.model.predict(self.counter.transform([description]))[0])


class ForestAgent:
    def __init__(self, rows):
        self.counter = CountVectorizer(max_features=1500, stop_words="english")
        X = self.counter.fit_transform([r["description"] for r in rows])
        self.model = RandomForestRegressor(n_estimators=100, n_jobs=-1, random_state=42).fit(X, [r["price"] for r in rows])

    def price(self, description: str) -> float:
        return float(self.model.predict(self.counter.transform([description]))[0])


class NearestAgent:
    def __init__(self, rows):
        self.counter = CountVectorizer(stop_words="english")
        self.X = self.counter.fit_transform([r["description"] for r in rows])
        self.prices = np.array([r["price"] for r in rows])

    def price(self, description: str) -> float:
        sims = cosine_similarity(self.counter.transform([description]), self.X)[0]
        return float(self.prices[np.argsort(sims)[-5:]].mean())


class DemoScanner:
    def scan(self, feed_text: str) -> list[Deal]:
        deals = []
        for line in feed_text.splitlines():
            parts = [p.strip() for p in line.split("|")]
            if len(parts) == 3:
                deals.append(Deal(description=parts[0], price=float(parts[1]), url=parts[2]))
        log("scanner", f"read {len(deals)} listings from the sample feed")
        return deals


# ============ the planner ============

SEEN = os.getenv("SEEN_FILE", "seen_deals.json")


class PlannerAgent:
    def __init__(self, scanner, ensemble, messenger, threshold=50):
        self.scanner, self.ensemble, self.messenger, self.threshold = scanner, ensemble, messenger, threshold
        self.seen = set(json.load(open(SEEN))) if os.path.exists(SEEN) else set()

    def run(self, feed_text):
        # TODO: for each deal from the scanner: skip it if its url is in self.seen; ask the ensemble for the
        # estimate; if estimate - deal.price > self.threshold, alert, remember the url and keep (deal, estimate).
        # Save self.seen to the SEEN file as a sorted JSON list, log("planner", ...) at start and end, return the list.
        raise NotImplementedError


def make_tools():
    return [{"type": "function", "function": {"name": name, "description": desc,
             "parameters": {"type": "object", "properties": props, "required": list(props)}}}
            for name, desc, props in [
        ("scan_for_bargains", "Get the five best current deals", {}),
        ("estimate_value", "Estimate the true price of an item", {"description": {"type": "string"}}),
        ("notify_user", "Send a phone alert about one deal", {"message": {"type": "string"}})]]


def run_planner(client, handlers, max_steps=8):
    # TODO: the tool-calling loop with a step cap. System message: "Scan once, estimate each deal once,
    # notify only for big gaps, then stop." Each turn: call the model with tools; if no tool_calls return the text;
    # otherwise run each call through handlers[name](**json.loads(arguments)) and append a "tool" message per call id.
    raise NotImplementedError


def fake_handlers():
    return {"scan_for_bargains": lambda: [{"description": "Used Nova phone, 128 GB, good", "price": 60}],
            "estimate_value": lambda description: {"estimate": 180},
            "notify_user": lambda message: {"sent": True, "message": message}}
