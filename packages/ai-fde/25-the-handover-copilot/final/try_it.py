# try_it.py: the lesson's two small checks, in one file. No services and no key needed.
#   python try_it.py
import copilot_tools as t
from permissions import user_of, allowed

# Step 2: the same rule, different handlers
junior = user_of("Bearer demo-token-junior")
aisha = user_of("Bearer demo-token-aisha")
print(allowed(junior, "pay_claim", {"amount": 1200}))     # False
print(allowed(aisha, "pay_claim", {"amount": 1200}))      # True

# Step 3: swap the network call for a stand-in, so the tools run without services
t.send = lambda user, method, path, body=None: {"as": user["name"], "path": path}
print(t.run_tool(aisha, "lookup_claim", {"claim_id": "C007"}))        # runs straight away
print(t.run_tool(aisha, "pay_claim", {"claim_id": "C007", "amount": 300}))   # {'confirm': 'Pay S$300 on C007?', ...}
print(t.run_tool(junior, "pay_claim", {"claim_id": "C007", "amount": 1200}))   # refused: not allowed
