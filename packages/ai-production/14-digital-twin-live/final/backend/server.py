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

# added: locally the page (port 3000) and the API (port 8000) are different addresses,
# so the browser needs CORS headers. In the cloud the API gateway sends them instead,
# so we switch this off there (two sets of headers would clash).
if not USE_BUCKET:
    origins = os.environ.get("ALLOWED_ORIGIN", "http://localhost:3000").split(",")
    app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["POST", "OPTIONS"], allow_headers=["content-type"])


class Chat(BaseModel):
    session_id: str
    message: str


def reply_to(session_id: str, message: str) -> str:
    history = load_history(session_id)
    history.append({"role": "user", "content": message})
    result = client.chat.completions.create(
        model="gpt-5.4-mini",
        messages=[{"role": "system", "content": build_prompt()}] + history[-20:],  # only the latest 20
    )
    reply = result.choices[0].message.content
    history.append({"role": "assistant", "content": reply})
    save_history(session_id, history)  # the stored book keeps everything
    return reply


@app.post("/api/chat")
def chat(body: Chat):
    try:
        return {"reply": reply_to(body.session_id, body.message)}
    except ValueError:  # added: a bad session id is the caller's mistake, not a crash
        raise HTTPException(status_code=400, detail="bad session id")


handler = Mangum(app)  # the function's entry point: server.handler
