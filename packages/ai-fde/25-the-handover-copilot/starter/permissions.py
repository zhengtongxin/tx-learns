# permissions.py  (demo tokens only; real ones come from your sign-in system)
USERS = {
    "demo-token-aisha":  {"name": "Aisha",  "role": "senior", "limit": 5000},
    "demo-token-junior": {"name": "Junior handler", "role": "junior", "limit": 800},
}


def user_of(header):
    # TODO: strip Bearer from the header, look the token up in USERS, return a copy of the user plus its token, or None
    raise NotImplementedError("TODO: user_of")


def allowed(user, tool, args):
    # TODO: for pay_claim only: the amount must be a number no bigger than the user limit; anything else (missing, not a number) is refused
    raise NotImplementedError("TODO: allowed")
