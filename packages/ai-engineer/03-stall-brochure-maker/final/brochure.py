"""Stall brochure maker: two chained model calls turn a shop website into a short brochure.

Usage:  python brochure.py https://example.com [--stream]
"""
import json
import sys
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv  # added: the lesson says the key lives in .env, so load it here
from openai import OpenAI

load_dotenv()  # added: reads OPENAI_API_KEY from .env
client = OpenAI()
MODEL = "gpt-5-mini"  # models get retired; swap in a current one if this name stops working


# ---- Step 1: fetch a page and ask one question about it ----
def fetch(url):
    # added: one place for the request, with a browser-like header and a clear error
    resp = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0 (brochure-maker demo)"})
    resp.raise_for_status()
    return resp.text


def page_text(url):
    soup = BeautifulSoup(fetch(url), "html.parser")
    for junk in soup(["script", "style", "img"]):
        junk.decompose()
    return soup.get_text(separator="\n", strip=True)


def ask(system, user):
    reply = client.chat.completions.create(model=MODEL, messages=[
        {"role": "system", "content": system},
        {"role": "user", "content": user}])
    return reply.choices[0].message.content


# ---- Step 2: let the model choose the links ----
def all_links(url):
    soup = BeautifulSoup(fetch(url), "html.parser")
    return [urljoin(url, a["href"]) for a in soup.find_all("a", href=True)]


link_system = """Pick the links a customer or job seeker would want.
Skip terms, privacy and mailto. Reply as JSON like:
{"links": [{"type": "about page", "url": "https://shop.example/about"}]}"""


def pick_links(url, links):
    reply = client.chat.completions.create(model=MODEL, messages=[
        {"role": "system", "content": link_system},
        {"role": "user", "content": f"Site: {url}\nLinks:\n" + "\n".join(links)}],
        response_format={"type": "json_object"})
    return json.loads(reply.choices[0].message.content)["links"]


# ---- Step 3: gather the pages and write the brochure ----
brochure_system = ("Write a short brochure in markdown for customers and job seekers. "
                   "Include culture, customers and careers if present. Tone: warm and plain.")


def build_material(url):
    parts = ["Landing page:\n" + page_text(url)]
    for link in pick_links(url, all_links(url)):
        try:  # added: one dead link should not kill the whole brochure
            parts.append("Link: " + link["type"] + "\n" + page_text(link["url"]))
        except requests.RequestException as err:
            print("skipped", link.get("url"), "->", err, file=sys.stderr)
    return "\n\n".join(parts)[:5000]


def brochure(url):
    return ask(brochure_system, build_material(url))


# ---- Step 4: stream the answer ----
def brochure_stream(url):
    stream = client.chat.completions.create(model=MODEL, stream=True, messages=[
        {"role": "system", "content": brochure_system},
        {"role": "user", "content": build_material(url)}])
    text = ""
    for chunk in stream:
        if not chunk.choices:  # added: some chunks carry no choices
            continue
        text += chunk.choices[0].delta.content or ""
        yield text


# added: a small command line so the file runs on its own
if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Usage: python brochure.py https://example.com [--stream]")
    site = sys.argv[1]
    if "--stream" in sys.argv:
        shown = ""
        for so_far in brochure_stream(site):
            print(so_far[len(shown):], end="", flush=True)
            shown = so_far
        print()
    else:
        print(brochure(site))
