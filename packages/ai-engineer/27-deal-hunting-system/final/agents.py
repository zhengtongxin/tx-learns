"""All the agents. Each is a small class with one job.

Live agents (need keys and a deployed price model):  SpecialistAgent, FrontierAgent, NeuralAgent,
                                                     ScannerAgent, MessengerAgent
Demo agents (no keys, no GPU, same method names):    LinearAgent, ForestAgent, NearestAgent, DemoScanner
Both kinds plug into the same EnsembleAgent, PlannerAgent and DealSystem.
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


def parse_number(text):  # added: the defensive parse from the price guesser project, shared by the agents below
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
    """From the API lesson: make a messy listing look like the training data."""
    reply = client.chat.completions.create(model=os.getenv("CHEAP_MODEL", "gpt-5-mini"), messages=[
        {"role": "system", "content": "Rewrite this listing as one plain sentence about the item, its size and its condition. No emoji."},
        {"role": "user", "content": raw}])
    return reply.choices[0].message.content


class SpecialistAgent:
    """Calls the tuned model on the serverless GPU (deployed with: modal deploy price_guesser.py)."""

    def __init__(self, client=None):
        self.client, self.fn = client, None

    def price(self, description: str) -> float:
        import modal  # added: imported here so the demo mode does not need it
        if self.fn is None:
            self.fn = modal.Function.from_name("price-guesser", "price")
        text = tidy(self.client, description) if self.client else description
        estimate = self.fn.remote(text)
        log("specialist", f"${estimate:.0f} for {description[:40]}...")
        return estimate


class FrontierAgent:
    def __init__(self, store, embedder, client):
        self.store, self.embedder, self.client = store, embedder, client

    def price(self, description: str) -> float:
        vec = self.embedder.encode([description]).tolist()
        near = self.store.query(query_embeddings=vec, n_results=5)
        lines = [f"{d} costs ${m['price']}" for d, m in zip(near["documents"][0], near["metadatas"][0])]
        ask = "Similar items and what they cost:\n" + "\n".join(lines) + f"\n\nNow price this one, number only: {description}"
        reply = self.client.chat.completions.create(model=os.getenv("BIG_MODEL", "gpt-5"), messages=[{"role": "user", "content": ask}])
        number = parse_number(reply.choices[0].message.content)  # added: the lesson's strip("$") breaks on "About $120"
        if number is None:
            number = float(np.mean([m["price"] for m in near["metadatas"][0]]))
            log("frontier", "unreadable reply, used the average of the similar items")
        log("frontier", f"${number:.0f} for {description[:40]}...")
        return number


class NeuralAgent:
    """The small neural network from the predictor lesson, trained here on the training items."""

    def __init__(self, rows, epochs=30):
        import torch  # added: imported here so the demo mode does not need torch
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
        y = torch.tensor([r["price"] / 100 for r in rows], dtype=torch.float32)   # added: small targets train more steadily
        opt = torch.optim.Adam(self.net.parameters(), lr=1e-3)
        for _ in range(epochs):
            for i in range(0, len(rows), 64):          # batches of 64
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
        # val_guesses: one column per agent, from validation items
        self.agents = agents
        self.fit = LinearRegression(positive=True).fit(val_guesses, val_truth)

    def price(self, description: str) -> float:
        guesses = np.array([[a.price(description) for a in self.agents]])
        estimate = float(self.fit.predict(guesses)[0])
        log("ensemble", f"combined estimate ${estimate:.0f}")
        return estimate


class ScannerAgent:
    def __init__(self, client):  # added: the lesson used a global `client`
        self.client = client

    def scan(self, feed_text: str) -> list[Deal]:
        # added: structured-output parsing moved out of beta in newer openai versions; use whichever exists
        parse = getattr(self.client.chat.completions, "parse", None) or self.client.beta.chat.completions.parse
        reply = parse(
            model=os.getenv("CHEAP_MODEL", "gpt-5-mini"), response_format=DealList,
            messages=[{"role": "user", "content": "Pick the five deals with the clearest descriptions:\n" + feed_text}])
        deals = reply.choices[0].message.parsed.deals
        log("scanner", f"picked {len(deals)} deals from the feed")
        return deals


class MessengerAgent:
    def alert(self, deal: Deal, estimate: float) -> None:
        text = f"Deal: {deal.description} for ${deal.price} (worth about ${estimate:.0f}) {deal.url}"
        app_token, user_key = os.getenv("PUSHOVER_APP_TOKEN"), os.getenv("PUSHOVER_USER_KEY")
        if app_token and user_key:  # added: without keys it only logs, so nothing breaks
            requests.post("https://api.pushover.net/1/messages.json",
                          data={"token": app_token, "user": user_key, "message": text}, timeout=15)
        log("messenger", text)


# ============ the demo agents (same method names, no keys) ============

class LinearAgent:
    """Word counts plus linear regression: a stand-in for the tuned model."""

    def __init__(self, rows):
        self.counter = CountVectorizer(max_features=1500, stop_words="english")
        X = self.counter.fit_transform([r["description"] for r in rows])
        self.model = LinearRegression().fit(X, [r["price"] for r in rows])

    def price(self, description: str) -> float:
        return float(self.model.predict(self.counter.transform([description]))[0])


class ForestAgent:
    """Word counts plus a random forest: a stand-in for the neural network."""

    def __init__(self, rows):
        self.counter = CountVectorizer(max_features=1500, stop_words="english")
        X = self.counter.fit_transform([r["description"] for r in rows])
        self.model = RandomForestRegressor(n_estimators=100, n_jobs=-1, random_state=42).fit(X, [r["price"] for r in rows])

    def price(self, description: str) -> float:
        return float(self.model.predict(self.counter.transform([description]))[0])


class NearestAgent:
    """Average price of the five most similar known items: a stand-in for the retrieval agent."""

    def __init__(self, rows):
        self.counter = CountVectorizer(stop_words="english")
        self.X = self.counter.fit_transform([r["description"] for r in rows])
        self.prices = np.array([r["price"] for r in rows])

    def price(self, description: str) -> float:
        sims = cosine_similarity(self.counter.transform([description]), self.X)[0]
        return float(self.prices[np.argsort(sims)[-5:]].mean())


class DemoScanner:
    """Reads the sample feed (description | price | url) instead of asking a model to pick."""

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
        log("planner", "starting a run")
        found = []
        for deal in self.scanner.scan(feed_text):
            if deal.url in self.seen:
                continue
            estimate = self.ensemble.price(deal.description)
            if estimate - deal.price > self.threshold:
                self.messenger.alert(deal, estimate)
                self.seen.add(deal.url)
                found.append((deal, estimate))
        json.dump(sorted(self.seen), open(SEEN, "w"))
        log("planner", f"run finished, {len(found)} new deals")
        return found


# ---- the other option: let a model plan (needs OPENAI_API_KEY) ----
def make_tools():
    return [{"type": "function", "function": {"name": name, "description": desc,
             "parameters": {"type": "object", "properties": props, "required": list(props)}}}
            for name, desc, props in [
        ("scan_for_bargains", "Get the five best current deals", {}),
        ("estimate_value", "Estimate the true price of an item", {"description": {"type": "string"}}),
        ("notify_user", "Send a phone alert about one deal", {"message": {"type": "string"}})]]


def run_planner(client, handlers, max_steps=8):
    tools = make_tools()
    messages = [{"role": "system", "content": "Scan once, estimate each deal once, notify only for big gaps, then stop."},
                {"role": "user", "content": "Find me bargains."}]
    for _ in range(max_steps):                      # the cap
        reply = client.chat.completions.create(model=os.getenv("CHEAP_MODEL", "gpt-5-mini"), messages=messages, tools=tools)
        msg = reply.choices[0].message
        messages.append(msg)
        if not msg.tool_calls:
            return msg.content
        for call in msg.tool_calls:
            result = handlers[call.function.name](**json.loads(call.function.arguments))
            messages.append({"role": "tool", "tool_call_id": call.id, "content": json.dumps(result)})
    return "Stopped: step cap reached."


def fake_handlers():  # added: canned tools so you can watch the loop with no real agent and no money spent
    return {"scan_for_bargains": lambda: [{"description": "Used Nova phone, 128 GB, good", "price": 60}],
            "estimate_value": lambda description: {"estimate": 180},
            "notify_user": lambda message: {"sent": True, "message": message}}
