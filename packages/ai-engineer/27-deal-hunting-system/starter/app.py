"""The screen (starter). Fill in build_screen.

Run:  python app.py [once | reset | planner]
"""
import json
import sys

from deal_system import DealSystem
from logbus import drain_log

TABLE_HEADERS = ["Item", "Price", "Estimate", "Discount", "Link"]


def rows_from(system):
    # TODO: one row per opportunity: [description, price, round(estimate), round(estimate - price), url]
    raise NotImplementedError


def build_screen(system):
    import gradio as gr
    # TODO: gr.Blocks(title="Deal hunter") with:
    #   a Markdown title, a gr.Dataframe(headers=TABLE_HEADERS, interactive=False),
    #   a "Look now" button whose click runs system.run() and returns rows_from(system),
    #   a gr.Timer(300) whose tick does the same (every five minutes),
    #   a gr.HTML log box refreshed by a second gr.Timer(2) calling drain_log.
    # Return the Blocks object.
    raise NotImplementedError


def reset_memory():
    import os
    path = os.getenv("SEEN_FILE", "seen_deals.json")
    json.dump(["https://example.com/old-deal-1", "https://example.com/old-deal-2"], open(path, "w"))
    print("memory reset in", path)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "screen"
    if cmd == "reset":
        reset_memory()
    elif cmd == "planner":
        from openai import OpenAI
        from agents import fake_handlers, run_planner
        print(run_planner(OpenAI(), fake_handlers()))
    else:
        system = DealSystem()
        if cmd == "once":
            print(system.run())
        else:
            build_screen(system).queue().launch()
