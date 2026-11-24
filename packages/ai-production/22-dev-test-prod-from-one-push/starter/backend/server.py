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

# Only for running on a laptop. In the cloud the API gateway sends the CORS headers.
if not USE_BUCKET:
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["POST", "OPTIONS"], allow_headers=["content-type"])


def to_messages(saved: list) -> list:
    """saved: [{"role": ..., "text": ...}]  ->  the model service's message shape."""
    # TODO: skip any role that is not "user" or "assistant"; merge two same-role neighbours into one
    # (join with a newline) so roles alternate; each message is
    # {"role": role, "content": [{"text": text}]}; the first message must be from the user.
    return []


def ask_managed(system_prompt: str, saved: list) -> str:
    # TODO: client.converse(modelId=MODEL_ID, system=[{"text": system_prompt}],
    #       messages=to_messages(saved), inferenceConfig={"maxTokens": 300})
    # The answer hides under  output -> message -> content -> [0] -> text
    return "TODO"


class Chat(BaseModel):
    session_id: str
    message: str


@app.post("/chat")
def chat(body: Chat):
    # TODO: load history (a bad session id -> HTTP 400), append the user message, ask the model with
    # only the latest 20 messages, append the reply, save the FULL history, return {"reply": reply}
    raise HTTPException(status_code=501, detail="TODO")


handler = Mangum(app)  # the function's entry point: server.handler
