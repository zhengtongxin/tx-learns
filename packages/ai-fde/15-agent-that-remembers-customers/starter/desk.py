# desk.py: the agent's side. Three stores: records, memory, reference.
#   python make_reference.py     once, first
#   python reset.py              fresh queue
#   python desk.py               process two claims from the same customer
import datetime
import json
import os
import sqlite3
import sys

from openai import OpenAI

DRY_RUN = os.environ.get("DRY_RUN") == "1"   # added: DRY_RUN=1 swaps the model for a stand-in
client = None if DRY_RUN else OpenAI()

if not os.path.exists("reference.db"):       # added: the read-only connection needs the file to exist
    sys.exit("reference.db is missing: run python make_reference.py first")

# Step 1: three stores, three owners
db = sqlite3.connect("claims.db")      # records: owned by the handlers
mem = sqlite3.connect("memory.db")     # notes: owned by the agent
ref = sqlite3.connect("file:reference.db?mode=ro", uri=True)   # reference: read only

db.execute("""CREATE TABLE IF NOT EXISTS claims (id TEXT PRIMARY KEY, customer_id TEXT, story TEXT,
              amount REAL, action TEXT, payout REAL, reason TEXT, notes_used TEXT)""")
mem.execute("CREATE TABLE IF NOT EXISTS notes (customer_id TEXT, note TEXT, claim_id TEXT, saved TEXT)")


# Step 2: after each claim, write a short note
def write_notes(claim, decision):
    if DRY_RUN:                                   # added
        return [f"Claim {claim['id']}: receipts were attached (dry run note)."]
    # TODO: ask the model for at most two factual notes as JSON {"notes": [...]}; no guesses, nothing private
    raise NotImplementedError("TODO: write_notes")


def remember(claim, decision):
    # TODO: insert each note into mem with the customer id, the claim id and today as the saved date; commit
    raise NotImplementedError("TODO: remember")


# Step 3: before a claim, read that customer's notes
def recall(customer_id):
    # TODO: SELECT this customer only, oldest first, and return readable strings with claim id and saved date
    raise NotImplementedError("TODO: recall")


def decide(claim, notes):
    cover, limit_amt = ref.execute("SELECT cover, limit_amt FROM policies WHERE id = ?",
                                   (claim["policy_id"],)).fetchone()
    if DRY_RUN:                                   # added: a stand-in answer that shows when a note was used
        reason = "dry run: paid the amount claimed, up to the limit."
        if notes:
            reason = f"dry run: a note from an earlier claim was used ({len(notes)} note read)."
        return {"action": "approve", "payout": min(claim["amount"], limit_amt), "reason": reason}
    # TODO: put the policy cover, limit and the notes (as leads, not proof) in the prompt, ask for JSON, return it
    raise NotImplementedError("TODO: decide")


# Step 4: one function ties it together
def process(claim):
    # TODO: recall, decide, save the claim and the notes used into claims.db, then remember; return the decision
    raise NotImplementedError("TODO: process")


# Step 5: show the handler what the agent used
def show_claim(claim_id):
    # TODO: print the decision, the reason and each note the agent read
    raise NotImplementedError("TODO: show_claim")


if __name__ == "__main__":
    c1 = {"id": "C041", "customer_id": "K-0412", "policy_id": "P003",
          "story": "My checked bag never arrived. Receipts for everything inside are attached.", "amount": 420}
    c2 = {"id": "C042", "customer_id": "K-0412", "policy_id": "P003",
          "story": "My bag was lost again on the flight home. Receipts attached.", "amount": 380}
    print(process(c1))
    print(process(c2))
    show_claim("C042")

    # Step 6: the reference store is read only, enforced by permissions, not by an instruction
    try:
        ref.execute("UPDATE policies SET limit_amt = 99999 WHERE id = 'P003'")
    except sqlite3.OperationalError as e:
        print("blocked:", e)          # attempt to write a readonly database
