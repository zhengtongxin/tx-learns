# copilot_api.py: three routes for the page: ask, confirm and history (Step 4).
# Start it with:  flask --app copilot_api run --port 5000
from flask import Flask, jsonify, request, send_from_directory

from permissions import user_of
from copilot_agent import ask
from copilot_tools import run_tool
from copilot_log import history, steps, log_turn

app = Flask(__name__)


def who():
    return user_of(request.headers.get("Authorization", ""))


# added: a bare-bones dashboard page, so the copilot sidebar has somewhere to live.
# A real dashboard would use your sign-in system instead of these two demo buttons.
DASHBOARD = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Claims dashboard (demo)</title></head>
<body>
<main style="margin-right:340px;font-family:sans-serif">
<h1>Claims dashboard</h1>
<p><button id="aisha">Sign in as Aisha (limit S$5,000)</button>
   <button id="junior">Sign in as Junior handler (limit S$800)</button></p>
<p id="who">Not signed in.</p>
<p>Try: <i>look up C007</i>, <i>pay C007 300</i>, <i>pay C008 1200</i>, <i>what are the claim rules?</i></p>
</main>
<script>
function signIn(token, name) {
  sessionStorage.setItem("token", token);
  document.getElementById("who").textContent = "Signed in as " + name + ".";
}
document.getElementById("aisha").onclick = function () { signIn("demo-token-aisha", "Aisha"); };
document.getElementById("junior").onclick = function () { signIn("demo-token-junior", "Junior handler"); };
</script>
<script src="/copilot.js"></script>
</body></html>"""


@app.get("/")
def dashboard():
    return DASHBOARD


@app.get("/copilot.js")            # added: the sidebar script, loaded on every dashboard page
def sidebar_script():
    return send_from_directory(".", "copilot.js")


@app.post("/copilot/ask")
def ask_route():
    user = who()
    if user is None:
        return jsonify(error="sign in first"), 401
    out = ask(user, (request.get_json(silent=True) or {}).get("question", ""))
    out["steps"] = steps(user["name"], 10)
    return jsonify(out)


@app.post("/copilot/confirm")
def confirm_route():
    user = who()
    if user is None:
        return jsonify(error="sign in first"), 401
    args = request.get_json(silent=True) or {}
    result = run_tool(user, "pay_claim", args, confirmed=True)       # the handler's click, not the model
    log_turn(user["name"], "step", "confirmed pay_claim " + str(args) + " -> " + str(result)[:300])
    return jsonify(result)


@app.get("/copilot/history")
def history_route():
    user = who()
    if user is None:
        return jsonify(error="sign in first"), 401
    return jsonify(history(user["name"]))
