# app.py: two routes for the dashboard (Step 5).
# Start it with:  flask --app app run --port 5000
from flask import Flask, jsonify, request
from scoreboard import run_evaluation, list_runs, Busy

app = Flask(__name__)


@app.post("/evaluations")
def start_evaluation():
    label = (request.get_json(silent=True) or {}).get("label", "unnamed")
    try:
        name, report = run_evaluation(label)
    except Busy:
        return jsonify(error="an evaluation is already running"), 409
    return jsonify(run=name, **report), 201


@app.get("/evaluations")
def evaluations():
    return jsonify(list_runs())
