# app.py: two routes for the dashboard (Step 5).
# Start it with:  flask --app app run --port 5000
from flask import Flask, jsonify, request
from scoreboard import run_evaluation, list_runs, Busy

app = Flask(__name__)


@app.post("/evaluations")
def start_evaluation():
    # TODO: read the label, call run_evaluation, answer 201 with the report, or 409 when Busy
    raise NotImplementedError("TODO: start_evaluation")


@app.get("/evaluations")
def evaluations():
    # TODO: return list_runs() as JSON
    raise NotImplementedError("TODO: evaluations")
