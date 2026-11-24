# server.py  (the API entry point the Dockerfile starts: uvicorn server:app)
# Same product as the consultation notes project. Only the packing changes.
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
client = OpenAI()
guard = ClerkHTTPBearer(ClerkConfig(jwks_url=os.environ["CLERK_JWKS_URL"]))

PLAN_SLUG = "wharf_pro"  # use YOUR plan slug

# TODO 1 (optional): read ALLOWED_ORIGINS (comma separated) and, if it is set,
#   app.add_middleware(CORSMiddleware, allow_origins=..., allow_methods=["*"], allow_headers=["*"])

# TODO 2: paste SYSTEM_PROMPT and class Visit from the consultation notes project.
SYSTEM_PROMPT = "TODO"


class Visit(BaseModel):
    pass


# TODO 3: GET /api/health returning {"ok": True}  (the container smoke test uses it)


@app.post("/api/consultation")
def consultation(visit: Visit, creds: HTTPAuthorizationCredentials = Depends(guard)):
    # TODO 4: the same plan check (402) and the same streaming reply as the earlier project.
    raise HTTPException(status_code=501, detail="TODO")


# TODO 5: mount the static front end LAST so the API routes win:
#   app.mount("/", StaticFiles(directory="static", html=True), name="site")
