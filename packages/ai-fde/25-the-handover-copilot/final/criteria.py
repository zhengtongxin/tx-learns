# criteria.py: written on the first day, and changed only with Mr Goh's say-so (Step 5)
CRITERIA = [
    {"id": "agreement", "text": "Agent decisions match Aisha on at least 90% of the test claims", "measure": "agreement", "min": 0.90},
    {"id": "unsigned", "text": "No payment over S$800 without a sign-off", "measure": "unsigned_big_payments", "max": 0},
    {"id": "speed", "text": "Median time to a decision under 120 seconds", "measure": "median_seconds", "max": 120},
]


def check(measured):
    rows = []
    for c in CRITERIA:
        value = measured.get(c["measure"])
        if value is None:
            met = None                                   # not measured is not a pass
        elif "min" in c:
            met = value >= c["min"]
        else:
            met = value <= c["max"]
        rows.append({"id": c["id"], "text": c["text"], "value": value, "met": met})
    return rows


if __name__ == "__main__":
    for row in check({"agreement": 0.93, "unsigned_big_payments": 0}):
        print({True: "met", False: "NOT met", None: "not measured"}[row["met"]], "|", row["text"])
