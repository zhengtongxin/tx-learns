"""floor/market.py: the price simulator. Made-up prices that move slowly."""
import math
import time

BASE = {"KOPI": 10.0, "ROTI": 5.0, "TEHT": 8.0, "NASI": 12.0}


def get_price(symbol: str) -> float:
    t = time.time() / 600  # a slow clock: a gentle change every few minutes
    seed = sum(map(ord, symbol))
    wave = math.sin(t + seed) * 0.6 + math.sin(t * 2.3 + seed * 1.7) * 0.3
    return round(BASE[symbol] * (1 + 0.08 * wave), 2)
