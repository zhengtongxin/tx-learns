"""Offline check (no keys, no GPU, no network): the whole system runs in demo mode and never repeats a deal."""
import os
import tempfile

os.environ["DEMO_MODE"] = "1"
os.environ["SEEN_FILE"] = os.path.join(tempfile.mkdtemp(), "seen_deals.json")   # a throw-away memory file

from deal_system import DealSystem
from logbus import drain_log

system = DealSystem()
first = system.run()
urls = {deal.url for deal, _ in first}
bargains = {"https://shop.example/listing/1001", "https://shop.example/listing/1004", "https://shop.example/listing/1006"}
assert bargains <= urls, f"missed bargains: {bargains - urls}"
assert all(est - deal.price > 50 for deal, est in first)

again = system.run()
assert len(again) == len(first), "the second run found something it had already sent"
assert os.path.exists(os.environ["SEEN_FILE"])
assert "[planner]" in drain_log()
print(f"ok: found {len(first)} deals, including the 3 planted bargains; the second run added none")
