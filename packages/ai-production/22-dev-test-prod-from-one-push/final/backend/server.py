# server.py: the twin's API, running as a function. The model is the managed model service
# (chosen per environment by MODEL_ID); memory is the bucket (USE_BUCKET=true, set by Terraform).
import os

import boto3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel

from context import build_prompt
from memory import USE_BUCKET, load_history, save_history

app = FastAPI()
client = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION", "ap-southeast-1"))
MODEL_ID = os.environ.get("MODEL_ID", "apac.amazon.nova-lite-v1:0")

# added: only for running on a laptop. In the cloud the API gateway sends the CORS headers.
if not USE_BUCKET:
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["POST", "OPTIONS"], allow_headers=["content-type"])


def to_messages(saved: list) -> list:
    """saved: [{"role": ..., "text": ...}] read from the memory bucket."""
    messages = []
    for m in saved:
        if m["role"] not in ("user", "assistant"):
            continue  # a stray system line would break the call
        if messages and messages[-1]["role"] == m["role"]:
            messages[-1]["content"][0]["text"] += "\n" + m["text"]  # keep it alternating
        else:
            messages.append({"role": m["role"], "content": [{"text": m["text"]}]})
    while messages and messages[0]["role"] != "user":
        messages.pop(0)  # added: the model needs the first message to come from the user
    return messages


def ask_managed(system_prompt: str, saved: list) -> str:
    resp = client.converse(
        modelId=MODEL_ID,
        system=[{"text": system_prompt}],
        messages=to_messages(saved),
        inferenceConfig={"maxTokens": 300},
    )
    return resp["output"]["message"]["content"][0]["text"]


class Chat(BaseModel):
    session_id: str
    message: str


@app.post("/chat")
def chat(body: Chat):
    try:
        history = load_history(body.session_id)
    except ValueError:  # the session id had unsafe characters
        raise HTTPException(status_code=400, detail="bad session id")
    history.append({"role": "user", "text": body.message})
    reply = ask_managed(build_prompt(), history[-20:])  # only the latest 20 go to the model
    history.append({"role": "assistant", "text": reply})
    save_history(body.session_id, history)  # the stored book keeps everything
    return {"reply": reply}


handler = Mangum(app)  # the function's entry point: server.handler
