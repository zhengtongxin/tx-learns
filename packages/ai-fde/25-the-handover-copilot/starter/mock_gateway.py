# mock_gateway.py: added. The lesson says "the gateway from the earlier lessons". This is a
# small stand-in with the routes the copilot calls, so the copilot runs on its own.
# It does what the lesson says a real service does: it checks the SAME permission again,
# because the copilot's own check is a courtesy and the lock is on the service.
# Start it with:  flask --app mock_gateway run --port 5001
import json
import re

from flask import Flask, jsonify, request

from permissions import user_of, allowed

app = Flask(__name__)
CLAIMS = {c["id"]: c for c in json.load(open("data/claims.json"))}
work_log, payments = [], []


@app.before_request
def need_user():
    user = user_of(request.headers.get("Authorization", ""))
    if user is None:
        return jsonify(error="sign in first"), 401


@app.get("/claims/<claim_id>")
def claim(claim_id):
    found = CLAIMS.get(claim_id)
    return (jsonify(found), 200) if found else (jsonify(error="no such claim"), 404)


@app.get("/context/<name>")
def context(name):
    if not re.fullmatch(r"[a-z_]{1,40}", name):
        return jsonify(error="bad name"), 400
    try:
        return jsonify(name=name, content=json.load(open("context/" + name + ".json")))
    except FileNotFoundError:
        return jsonify(error="unknown file"), 404


@app.post("/tools/start_work")
def start_work():
    body = request.get_json(silent=True) or {}
    work_log.append({"started": body.get("claim_id")})
    return jsonify(started=body.get("claim_id"))


@app.post("/tools/send_back")
def send_back():
    body = request.get_json(silent=True) or {}
    work_log.append({"sent_back": body.get("claim_id"), "note": body.get("note")})
    return jsonify(sent_back=body.get("claim_id"))


@app.post("/tools/pay_claim")
def pay_claim():
    user = user_of(request.headers.get("Authorization", ""))
    body = request.get_json(silent=True) or {}
    if not allowed(user, "pay_claim", body):              # the service checks too
        return jsonify(error="this handler may not pay that amount"), 403
    payments.append({"claim": body.get("claim_id"), "amount": body.get("amount"), "by": user["name"]})
    return jsonify(paid=body.get("amount"), claim=body.get("claim_id"))


@app.get("/payments")
def list_payments():
    return jsonify(payments)
