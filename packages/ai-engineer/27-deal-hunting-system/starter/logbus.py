"""The live log: agents drop coloured lines into a queue, the screen drains it at its own pace.
A queue is safe to share between threads, so lines never get interleaved."""
import queue

log_queue = queue.Queue()
COLOURS = {"scanner": "#4ea1ff", "ensemble": "#ffb347", "messenger": "#5fd38d", "planner": "#c792ea",
           # added: one colour for each agent the lesson did not list here
           "specialist": "#ff7f9f", "frontier": "#f2e35c", "neural": "#7fe0e0", "system": "#aaaaaa"}


def log(agent, text):
    print(f"[{agent}] {text}")  # added: also print, so the terminal shows the same story
    log_queue.put(f'<span style="color:{COLOURS.get(agent, "#aaaaaa")}">[{agent}] {text}</span>')


lines = []


def drain_log():
    while not log_queue.empty():
        lines.append(log_queue.get())
    return "<br>".join(lines[-30:])
