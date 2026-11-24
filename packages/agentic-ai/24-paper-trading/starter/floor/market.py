"""floor/market.py: the price simulator. Made-up prices that move slowly."""
import math
import time

BASE = {"KOPI": 10.0, "ROTI": 5.0, "TEHT": 8.0, "NASI": 12.0}


def get_price(symbol: str) -> float:
    # TODO: write this function
    # Hint: t = time.time()/600; two sine waves seeded by the symbol; round(BASE[symbol] * (1 + 0.08 * wave), 2)
    raise NotImplementedError("TODO")
