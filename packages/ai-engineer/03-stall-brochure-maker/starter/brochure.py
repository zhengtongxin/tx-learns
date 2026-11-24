"""Stall brochure maker (starter). Fill in every TODO, then run: python brochure.py https://example.com"""
import json
import sys
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI()
MODEL = "gpt-5-mini"


def fetch(url):
    resp = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0 (brochure-maker demo)"})
    resp.raise_for_status()
    return resp.text


def page_text(url):
    # TODO: parse fetch(url) with BeautifulSoup, decompose script/style/img tags,
    # then return soup.get_text(separator="\n", strip=True)
    raise NotImplementedError


def ask(system, user):
    # TODO: one chat completion with a system and a user message; return the reply text
    raise NotImplementedError


def all_links(url):
    # TODO: every <a href> on the page, made absolute with urljoin
    raise NotImplementedError


link_system = """Pick the links a customer or job seeker would want.
Skip terms, privacy and mailto. Reply as JSON like:
{"links": [{"type": "about page", "url": "https://shop.example/about"}]}"""


def pick_links(url, links):
    # TODO: call the model with link_system and response_format={"type": "json_object"}
    # Hint: the reply is a string. json.loads it, then return the "links" list.
    raise NotImplementedError


brochure_system = ("Write a short brochure in markdown for customers and job seekers. "
                   "Include culture, customers and careers if present. Tone: warm and plain.")


def build_material(url):
    # TODO: landing page text + the text of each picked link, joined under headings,
    # then cut to 5000 characters so the call stays cheap
    raise NotImplementedError


def brochure(url):
    # TODO: ask(brochure_system, build_material(url))
    raise NotImplementedError


def brochure_stream(url):
    # TODO: same call with stream=True. Add each chunk.choices[0].delta.content to the text so far
    # (it can be None) and yield the text so far.
    raise NotImplementedError


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
