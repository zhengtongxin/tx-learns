# api/index.py  (the FastAPI half, run by the host's Python runtime)
import os
from datetime import date

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from openai import OpenAI
from pydantic import BaseModel, Field

app = FastAPI()
client = OpenAI()  # reads OPENAI_API_KEY from the environment
guard = ClerkHTTPBearer(ClerkConfig(jwks_url=os.environ["CLERK_JWKS_URL"]))

PLAN_SLUG = "wharf_pro"  # added: one place to change; use YOUR plan slug

# Step 3: one prompt, three outputs
SYSTEM_PROMPT = """You help a clinic nurse write up a visit.
Use only facts that are in the notes. If something is missing, say so.
Answer in markdown with exactly these three sections:
## Summary for the records
Short, factual, for the file.
## Next steps for the nurse
A checklist of follow-ups.
## Email to the patient
Friendly, plain language, no jargon."""


# Step 2: a checked request
class Visit(BaseModel):
    patient_name: str = Field(min_length=1)
    visit_date: date
    notes: str = Field(min_length=1)


# Step 4: verify the sign-in, check the plan, then stream
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

    # Plain text, no "data:" lines: the page reads it with fetch.
    return StreamingResponse(
        generate(),
        media_type="text/plain",
        # added: from the streaming lesson, so nothing in the middle holds pieces back
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
