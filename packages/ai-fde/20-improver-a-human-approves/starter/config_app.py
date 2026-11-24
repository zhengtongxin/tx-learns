# config_app.py: a Configuration page, routes to approve, reject and roll back (Step 6).
# Start it with:  flask --app config_app run --port 5001
import html

from flask import Flask, jsonify, request

from versions import load, save, find
from improver import propose, approve, reject, finish_round, Busy

app = Flask(__name__)


@app.get("/configuration")
def configuration():
    # TODO: one table row per version, every cell passed through html.escape
    raise NotImplementedError("TODO: configuration")


@app.post("/rounds")
def new_round():
    # TODO: call propose(): 201 with the version, 409 when Busy
    raise NotImplementedError("TODO: new_round")


@app.post("/versions/<int:n>/approve")
def approve_route(n):
    # TODO: approve, then finish_round, and return the result
    raise NotImplementedError("TODO: approve_route")


@app.post("/versions/<int:n>/reject")
def reject_route(n):
    # TODO: reject and return the result
    raise NotImplementedError("TODO: reject_route")


@app.post("/versions/<int:n>/use")
def roll_back_to(n):
    # TODO: only a kept version can be put back in use: move the pointer, log who did it
    raise NotImplementedError("TODO: roll_back_to")
