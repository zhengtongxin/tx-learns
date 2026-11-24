"""floor/tracing.py: your own tracer. Every span is written to the log with the uncle's name."""
from agents import TracingProcessor

from floor.accounts import STRATEGIES
from floor.db import write_log

NAMES = {n.lower(): n for n in STRATEGIES}  # added: put the proper capital letters back


class FloorLog(TracingProcessor):
    def _who(self, x):  # trace ids look like trace_<name>0<random>
        tag = x.trace_id.split("_")[1]
        who = tag.split("0")[0] if "0" in tag else None
        return NAMES.get(who)

    def on_trace_start(self, t):
        (w := self._who(t)) and write_log(w, "trace", f"start {t.name}")

    def on_trace_end(self, t):
        (w := self._who(t)) and write_log(w, "trace", f"end {t.name}")

    def on_span_start(self, s):
        if (w := self._who(s)) and s.span_data:
            write_log(w, s.span_data.type, f"start {getattr(s.span_data, 'name', '')}")

    def on_span_end(self, s):
        pass

    def shutdown(self):
        pass

    def force_flush(self):
        pass
