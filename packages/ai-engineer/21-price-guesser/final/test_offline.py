"""Offline check (no key, no network): the board works and a classic guesser beats "just say the average"."""
import price_guesser as pg

assert pg.parse_price("About $1,120.50 maybe") == 1120.5 and pg.parse_price("no idea") is None
assert len(pg.train) == 800 and len(pg.test) == 150
base = pg.evaluate(pg.average_pricer, pg.test)
best = pg.evaluate(pg.forest_pricer, pg.test)
assert best["avg_error"] < base["avg_error"], (best, base)
print(f"ok: average error ${base['avg_error']:.0f}, forest ${best['avg_error']:.0f} (forest should be lower)")
