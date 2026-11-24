"""A deliberately awkward test program (invented for this project).
It makes pseudo-random prices, finds the best run of gains (Kadane), and
builds a hash. The hash multiplies by 31 in a field of size 2**61 - 1, so the
middle value is bigger than 64 bits: a sloppy C++ translation overflows and
prints a wrong number with no error.
"""

M = 2 ** 61 - 1


def prices(n, seed=12345):
    x = seed
    for _ in range(n):
        x = (x * 1664525 + 1013904223) % 2 ** 32
        yield x - 2 ** 31          # a price change, positive or negative


def main():
    best = cur = 0
    h = 7
    for change in prices(3_000_000):
        cur = max(0, cur + change)
        best = max(best, cur)
        h = (h * 31 + change) % M  # h * 31 can exceed 64 bits: the trap
    print("best run:", best)
    print("hash:", h)


main()
