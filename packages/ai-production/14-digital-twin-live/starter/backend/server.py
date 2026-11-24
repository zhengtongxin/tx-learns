# server.py: the twin's API. Run locally with uvicorn, or in the cloud as a function.
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from openai import OpenAI
from pydantic import BaseModel

from context import build_prompt
from memory import USE_BUCKET, load_history, save_history

app = FastAPI()
client = OpenAI()  # reads OPENAI_API_KEY from the environment

# Locally the page (port 3000) and the API (port 8000) are different addresses, so the
# browser needs CORS headers. In the cloud the API gateway sends them instead.
if not USE_BUCKET:
    origins = os.environ.get("ALLOWED_ORIGIN", "http://localhost:3000").split(",")
    app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["POST", "OPTIONS"], allow_headers=["content-type"])


class Chat(BaseModel):
    session_id: str
    message: str


def reply_to(session_id: str, message: str) -> str:
    # TODO 1: load the history, append the user message
    # TODO 2: call client.chat.completions.create(model="gpt-5.4-mini", messages=...) with the
    #         system prompt from build_prompt() first, then only the last 20 history messages
    # TODO 3: append the assistant reply, save the FULL history, return the reply text
    return "TODO"


@app.post("/api/chat")
def chat(body: Chat):
    # TODO 4: return {"reply": reply_to(...)}; turn a ValueError (bad session id) into HTTP 400
    raise HTTPException(status_code=501, detail="TODO")


handler = Mangum(app)  # the function's entry point: server.handler
