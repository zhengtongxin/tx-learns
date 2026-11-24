"""The screen: a table of deals, a timer that runs while you sleep, and a live log.

Run:  python app.py            start the screen
      python app.py once       run the system once with no screen and print the deals
      python app.py reset      reset the memory file to two old deals (to test with fresh deals)
      python app.py planner    watch a model plan with three FAKE tools (needs OPENAI_API_KEY; no real agents)
"""
import json
import sys

from deal_system import DealSystem
from logbus import drain_log

TABLE_HEADERS = ["Item", "Price", "Estimate", "Discount", "Link"]


def rows_from(system):
    return [[d.description, d.price, round(est), round(est - d.price), d.url] for d, est in system.opportunities]


def build_screen(system):
    import gradio as gr

    def table_rows():
        system.run()
        return rows_from(system)

    with gr.Blocks(title="Deal hunter") as screen:
        gr.Markdown("# Deals found while you sleep")
        table = gr.Dataframe(headers=TABLE_HEADERS, interactive=False)
        gr.Button("Look now").click(table_rows, outputs=table)
        timer = gr.Timer(300)                      # every five minutes: each run uses models, so keep it slow
        timer.tick(table_rows, outputs=table)
        log_box = gr.HTML()
        log_timer = gr.Timer(2)                    # added: the log refreshes often; reading the queue costs nothing
        log_timer.tick(drain_log, outputs=log_box)
    return screen


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
            build_screen(system).queue().launch()   # first live run: expect a cold start, then watch the log fill
