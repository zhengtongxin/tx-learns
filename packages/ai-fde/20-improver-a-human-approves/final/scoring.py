# scoring.py: the scoring maths from "Right and wrong answers that cost differently".
# added: saved here so this project runs on its own. The scoreboard uses it unchanged.
from collections import Counter

ACTIONS = ["approve", "decline", "refer"]


def matrix(pairs):
    """pairs: one (handler's decision, agent's decision) per claim."""
    counts = Counter(pairs)
    return [[counts[(h, a)] for a in ACTIONS] for h in ACTIONS]   # rows: handler, columns: agent


def accuracy(grid):
    total = sum(map(sum, grid))
    return sum(grid[i][i] for i in range(3)) / total


# (handler's decision, agent's decision) -> what kind of mistake
KIND = {("decline", "approve"): "wrongful payment", ("refer", "approve"): "wrongful payment",
        ("approve", "decline"): "wrongful decline", ("refer", "decline"): "wrongful decline",
        ("approve", "refer"): "needless referral", ("decline", "refer"): "needless referral"}


def mistakes(grid):
    found = Counter()
    for i, handler in enumerate(ACTIONS):
        for j, agent in enumerate(ACTIONS):
            if i != j:
                found[KIND[(handler, agent)]] += grid[i][j]
    return dict(found)


def approval_precision_recall(grid):
    said_approve = sum(row[0] for row in grid)     # the agent's approve column
    should_approve = sum(grid[0])                  # the handler's approve row
    right = grid[0][0]
    return right / said_approve, right / should_approve


def kappa(grid):
    total = sum(map(sum, grid))
    seen = accuracy(grid)
    by_handler = [sum(row) for row in grid]                        # row totals
    by_agent = [sum(row[j] for row in grid) for j in range(3)]     # column totals
    by_chance = sum(h * a for h, a in zip(by_handler, by_agent)) / total ** 2
    return (seen - by_chance) / (1 - by_chance)


def straight_through(grid):
    total = sum(map(sum, grid))
    referred = sum(row[2] for row in grid)    # the agent's refer column
    return 1 - referred / total


PRICE = {"wrongful payment": 400, "wrongful decline": 150, "needless referral": 15}   # S$, invented


def mistake_cost(grid, price=PRICE):
    return sum(price[kind] * n for kind, n in mistakes(grid).items())


if __name__ == "__main__":
    # practice data typed as counts: rows = handler, columns = agent (approve, decline, refer)
    GRID_A = [[12, 0, 2],
              [3, 3, 0],
              [1, 0, 4]]
    GRID_B = [[10, 2, 2],
              [0, 5, 1],
              [0, 1, 4]]
    for name, grid in [("A", GRID_A), ("B", GRID_B)]:
        print(name, f"{accuracy(grid):.0%}", f"kappa {kappa(grid):.2f}",
              f"straight-through {straight_through(grid):.0%}", "cost S$", mistake_cost(grid))
