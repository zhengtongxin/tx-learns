# permissions.py  (demo tokens only; real ones come from your sign-in system)
USERS = {
    "demo-token-aisha":  {"name": "Aisha",  "role": "senior", "limit": 5000},
    "demo-token-junior": {"name": "Junior handler", "role": "junior", "limit": 800},
}


def user_of(header):
    token = header.removeprefix("Bearer ").strip()
    found = USERS.get(token)
    return None if found is None else {**found, "token": token}


def allowed(user, tool, args):
    if tool == "pay_claim":
        try:
            return float(args.get("amount")) <= user["limit"]
        except (TypeError, ValueError):
            return False                                   # missing or not a number: refuse
    return True
