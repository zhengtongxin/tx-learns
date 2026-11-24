"""floor/tracing.py: your own tracer. Every span is written to the log with the uncle's name."""
from agents import TracingProcessor

from floor.accounts import STRATEGIES
from floor.db import write_log

NAMES = {n.lower(): n for n in STRATEGIES}  # added: put the proper capital letters back


class FloorLog(TracingProcessor):
    def _who(self, x):  # trace ids look like trace_<name>0<random>
        # TODO: write this function
        # Hint: read the name back out of trace_<name>0<random>
        raise NotImplementedError("TODO")

    def on_trace_start(self, t):
        # TODO: write this function
        # Hint: write_log(who, "trace", f"start {t.name}") when who is known
        raise NotImplementedError("TODO")

    def on_trace_end(self, t):
        # TODO: write this function
        # Hint: same, with "end"
        raise NotImplementedError("TODO")

    def on_span_start(self, s):
        # TODO: write this function
        # Hint: write_log(who, span type, "start <name>")
        raise NotImplementedError("TODO")

    def on_span_end(self, s):
        pass

    def shutdown(self):
        pass

    def force_flush(self):
        pass
