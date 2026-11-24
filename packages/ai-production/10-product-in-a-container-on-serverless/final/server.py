# server.py  (the API entry point the Dockerfile starts: uvicorn server:app)
# Same product as the consultation notes project. Only the packing changes:
# the API now also serves the static front end, so page and API share one address.
import os
from datetime import date

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from openai import OpenAI
from pydantic import BaseModel, Field

app = FastAPI()
client = OpenAI()  # reads OPENAI_API_KEY from the environment
guard = ClerkHTTPBearer(ClerkConfig(jwks_url=os.environ["CLERK_JWKS_URL"]))

PLAN_SLUG = "wharf_pro"  # use YOUR plan slug

# added: CORS only matters if a front end is hosted on another address.
# Same address (the normal case here) needs none. Set ALLOWED_ORIGINS to turn it on.
origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]
if origins:
    app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["*"], allow_headers=["*"])

SYSTEM_PROMPT = """You help a clinic nurse write up a visit.
Use only facts that are in the notes. If something is missing, say so.
Answer in markdown with exactly these three sections:
## Summary for the records
Short, factual, for the file.
## Next steps for the nurse
A checklist of follow-ups.
## Email to the patient
Friendly, plain language, no jargon."""


class Visit(BaseModel):
    patient_name: str = Field(min_length=1)
    visit_date: date
    notes: str = Field(min_length=1)


@app.get("/api/health")
def health():
    return {"ok": True}


# The sign-in check and the plan check stay exactly as they were.
@app.post("/api/consultation")
def consultation(visit: Visit, creds: HTTPAuthorizationCredentials = Depends(guard)):
    if PLAN_SLUG not in creds.decoded.get("pla", ""):
        raise HTTPException(status_code=402, detail="Subscription needed")

    user_note = f"Patient: {visit.patient_name}\nDate: {visit.visit_date}\nNotes: {visit.notes}"

    def generate():
        stream = client.chat.completions.create(
            model="gpt-5.4-mini",
            stream=True,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_note},
            ],
        )
        for chunk in stream:
            piece = chunk.choices[0].delta.content
            if piece:
                yield piece

    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# Last, so the API routes above win. "static" holds the exported front end.
app.mount("/", StaticFiles(directory="static", html=True), name="site")
