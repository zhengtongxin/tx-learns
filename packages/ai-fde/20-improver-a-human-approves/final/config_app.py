# config_app.py: a Configuration page, routes to approve, reject and roll back (Step 6).
# Start it with:  flask --app config_app run --port 5001
import html

from flask import Flask, jsonify, request

from versions import load, save, find
from improver import propose, approve, reject, finish_round, Busy

app = Flask(__name__)


@app.get("/configuration")
def configuration():
    state = load()
    rows = ""
    for v in state["versions"]:
        scores = v["scores"] or {}
        cells = [("▶ " if v["n"] == state["active"] else "") + str(v["n"]), v["status"], v["changed"], v["why"],
                 v["proposed_by"], v["approved_by"] or "", scores.get("agreement", ""), scores.get("mistake_cost_sgd", "")]
        rows += "<tr>" + "".join("<td>" + html.escape(str(c)) + "</td>" for c in cells) + "</tr>"
    head = "Version,Status,Changed,Why,Proposed by,Approved by,Agreement,Mistake cost S$".split(",")
    return "<h1>Configuration</h1><table><tr>" + "".join("<th>" + h + "</th>" for h in head) + "</tr>" + rows + "</table>"


@app.post("/rounds")
def new_round():
    try:
        return jsonify(version=propose()), 201
    except Busy as e:
        return jsonify(error=str(e)), 409


@app.post("/versions/<int:n>/approve")
def approve_route(n):
    approve(n, request.get_json()["handler"])
    return jsonify(result=finish_round(n))


@app.post("/versions/<int:n>/reject")
def reject_route(n):
    reject(n, request.get_json()["handler"])
    return jsonify(result="rejected")


@app.post("/versions/<int:n>/use")
def roll_back_to(n):
    state = load()
    if find(state, n)["status"] != "kept":
        return jsonify(error="only a kept version can be put back in use"), 400
    state["active"] = n
    state["log"].append({"handler": request.get_json()["handler"], "put_back": n})
    save(state)
    return jsonify(active=n)
