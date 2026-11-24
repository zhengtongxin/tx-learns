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
    prompt = f"""A claim was just decided. Write at most two short notes that the claims desk
may want the next time this customer files. Facts only, taken from the claim and decision below.
No guesses, no card or passport numbers.
Reply with JSON only: {{"notes": ["...", "..."]}} (an empty list is fine)

Claim: {json.dumps(claim)}
Decision: {json.dumps(decision)}"""
    reply = client.chat.completions.create(
        model="gpt-5.4-mini", messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"})
    return json.loads(reply.choices[0].message.content)["notes"]


def remember(claim, decision):
    for note in write_notes(claim, decision):
        mem.execute("INSERT INTO notes VALUES (?, ?, ?, ?)",
                    (claim["customer_id"], note, claim["id"], datetime.date.today().isoformat()))
    mem.commit()


# Step 3: before a claim, read that customer's notes
def recall(customer_id):
    rows = mem.execute("SELECT note, claim_id, saved FROM notes WHERE customer_id = ? ORDER BY saved",
                       (customer_id,)).fetchall()
    return [f"{note} (claim {cid}, saved {saved})" for note, cid, saved in rows]


def decide(claim, notes):
    cover, limit_amt = ref.execute("SELECT cover, limit_amt FROM policies WHERE id = ?",
                                   (claim["policy_id"],)).fetchone()
    if DRY_RUN:                                   # added: a stand-in answer that shows when a note was used
        reason = "dry run: paid the amount claimed, up to the limit."
        if notes:
            reason = f"dry run: a note from an earlier claim was used ({len(notes)} note read)."
        return {"action": "approve", "payout": min(claim["amount"], limit_amt), "reason": reason}
    prompt = f"""You decide travel insurance claims for Kaya Travel Cover.
Policy cover: {cover}. Limit: S${limit_amt}.
Notes from this customer's earlier claims (leads to check against today's claim, not proof): {json.dumps(notes)}
The claim: {json.dumps(claim)}
If a note helped you, say so in the reason.
Reply with JSON only: {{"action": "approve" or "decline" or "refer", "payout": a number in S$, "reason": two or three short sentences}}"""
    reply = client.chat.completions.create(
        model="gpt-5.4-mini", messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"})
    return json.loads(reply.choices[0].message.content)


# Step 4: one function ties it together
def process(claim):
    notes = recall(claim["customer_id"])
    decision = decide(claim, notes)
    db.execute("INSERT OR REPLACE INTO claims VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
               (claim["id"], claim["customer_id"], claim["story"], claim["amount"],
                decision["action"], decision["payout"], decision["reason"], json.dumps(notes)))
    db.commit()
    remember(claim, decision)
    return decision


# Step 5: show the handler what the agent used
def show_claim(claim_id):
    action, payout, reason, used = db.execute(
        "SELECT action, payout, reason, notes_used FROM claims WHERE id = ?", (claim_id,)).fetchone()
    print(f"{claim_id}  {action}  S${payout}")
    print("  why:", reason)
    print("  notes the agent read:")
    for note in json.loads(used) or ["(none)"]:
        print("   -", note)


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
