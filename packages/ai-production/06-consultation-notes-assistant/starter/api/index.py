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

PLAN_SLUG = "wharf_pro"  # use YOUR plan slug

# TODO 1: write SYSTEM_PROMPT. Ask for exactly three markdown sections:
#   "## Summary for the records", "## Next steps for the nurse", "## Email to the patient".
#   Say: use only facts in the notes; if something is missing, say so.
SYSTEM_PROMPT = "TODO"


# TODO 2: give Visit three fields: patient_name (str, min_length 1),
#   visit_date (a real date) and notes (str, min_length 1).
#   Hint: Field(min_length=1)
class Visit(BaseModel):
    pass


@app.post("/api/consultation")
def consultation(visit: Visit, creds: HTTPAuthorizationCredentials = Depends(guard)):
    # TODO 3: read the plan with creds.decoded.get("pla", "") and raise
    #   HTTPException(status_code=402, detail="Subscription needed") if PLAN_SLUG is not in it.
    # TODO 4: build user_note from the name, the date and the notes.
    # TODO 5: write generate(): call client.chat.completions.create(model="gpt-5.4-mini",
    #   stream=True, messages=[system message, user message]) and yield each
    #   chunk.choices[0].delta.content that is not empty.
    # TODO 6: return StreamingResponse(generate(), media_type="text/plain")
    raise HTTPException(status_code=501, detail="TODO")
