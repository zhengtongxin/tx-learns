A DIGITAL TWIN LIVE ON THE INTERNET (project package)
=====================================================

WHAT YOU BUILD
--------------
A chat page that answers visitors the way Mei Ling would, from a short list of
true facts, and remembers each visitor's conversation even when the function
that runs it is replaced.

  browser -> CDN -> site bucket        (the page: plain static files)
  browser -> API gateway -> function -> model
                               \-> memory bucket (one JSON file per session)

You build and test it on your laptop first (memory in local files), then wire
the five cloud pieces back to front: memory bucket, function, API gateway, site
bucket, CDN.

All data (the facts, the profile PDF, the names) is invented demo data.

FOLDER STRUCTURE
----------------
14-digital-twin-live/
  README.txt
  env.example                  copy to .env
  final/                       complete reference
    backend/
      server.py                FastAPI route /api/chat + the function entry point
      context.py               builds the system prompt (role, facts, rules)
      resources.py             reads data/ once at startup
      memory.py                the handover book: local files or a bucket
      requirements.txt
      data/                    summary.txt, facts.txt, style.txt, profile.pdf
    frontend/
      app/twin/page.tsx        the chat page (reads the API address at build time)
      app/page.tsx, app/layout.tsx, next.config.js, package.json, tsconfig.json
    iam/trust-policy.json      lets the function service use the role
    iam/memory-policy.json     the role's only extra permission: its own bucket
    scripts/package.sh         builds backend/twin.zip
    scripts/create-backend.sh  memory bucket, role, function, API gateway
    scripts/publish-site.sh    build page, upload, clear the CDN cache
    scripts/teardown.sh        delete the backend pieces
  starter/                     same layout with TODO stubs (data files included)

REQUIREMENTS
------------
- Python 3.12 (3.10+ works locally) with pip
- Node 20+ and npm
- An OpenAI key  -> OPENAI_API_KEY
- For the cloud steps: AWS CLI v2 signed in as your limited daily user, default
  region ap-southeast-1 (or set REGION), and a budget alarm already set. The
  cloud steps need a real account and cost a little. The local steps need none.
- zip, bash (macOS or Linux; on Windows use WSL)

INSTALL
-------
1. Work inside final/ (or starter/). Create your ignore file first:
     printf '.env\n.env.local\nmemory/\nnode_modules/\nout/\nbackend/package/\nbackend/twin.zip\n__pycache__/\n' > .gitignore
2. cp ../env.example .env   and fill in YOUR key.
3. Backend:
     cd backend
     python3 -m venv .venv && source .venv/bin/activate
     pip install -r requirements.txt
4. Front end:
     cd ../frontend && npm install
     echo "NEXT_PUBLIC_API_BASE=http://localhost:8000" > .env.local

RUN (local first: do not touch the cloud until all of this works)
-----------------------------------------------------------------
Terminal 1 (from final/backend, with the venv on):
     set -a; source ../.env; set +a
     uvicorn server:app --reload --port 8000
Terminal 2 (from final/frontend):
     npm run dev
Open http://localhost:3000/twin

TEST / WHAT SUCCESS LOOKS LIKE
------------------------------
Local checklist:
 [ ] it answers in her voice (short, plain, a little humour)
 [ ] it admits what it does not know  (ask: "What was your salary last year?")
 [ ] say "Hi, I am Siti." then ask "What is my name?" in the next message: it
     says Siti, and a file memory/<session-id>.json now exists next to the backend
 [ ] ask it for her home address: it politely refuses

Check the API alone:
     curl -s -X POST http://localhost:8000/api/chat \
       -H "Content-Type: application/json" \
       -d '{"session_id": "test-1", "message": "Hi, what do you work on?"}'
  expect  {"reply": "..."}   and a file memory/test-1.json

Cloud steps, back to front, testing after each piece:
 1. bash scripts/package.sh                 -> backend/twin.zip
 2. export OPENAI_API_KEY=...  then  bash scripts/create-backend.sh
    It prints a curl line. Run it: expect {"reply": "..."} and a new object
    test-1.json in the memory bucket.
 3. Site bucket + CDN (console, five minutes): create a private bucket
    named like wharf-twin-site-YOURACCOUNTID; create a CDN distribution whose
    origin is that bucket (use the console's "origin access" option so the bucket
    stays private), default root object index.html. Note the CDN address and the
    distribution id.
 4. API=... SITE_BUCKET=... DISTRIBUTION_ID=... bash scripts/publish-site.sh
 5. Tighten the gateway's allowed origin from * to your CDN address
    (command in the header of scripts/create-backend.sh).
 6. Open the CDN address on your phone: say your name, ask again, then upload the
    zip again (or wait until the function is idle) and ask once more. The name
    must still be there: it lives in the bucket, not in the function.

One failure and its fix:
 - Symptom: the page loads but every chat fails; the browser console says a
   cross-site (CORS) rule blocked it. Cause: the gateway does not allow your
   page's address. Fix: set the gateway's allowed origin to the CDN address
   (and POST, OPTIONS, content-type). The function itself is fine.
 - Symptom: memory works locally but vanishes in the cloud. Cause: USE_BUCKET is
   not "true" in the function's settings, so it writes to a disk that disappears.
 - Symptom: you changed the page but still see the old one. Cause: the CDN
   cache. Fix: run an invalidation (publish-site.sh does it when
   DISTRIBUTION_ID is set).
 - Symptom: "access denied" for a new visitor. Cause: the role cannot list the
   bucket. Fix: keep the s3:ListBucket line in iam/memory-policy.json.

COST NOTE (approximate)
-----------------------
Idle, a small twin costs close to nothing: you pay per function call, a few
cents of storage and the CDN's small request charges. Most of the bill is model
calls. Check your bill page a day later; charges appear with a delay.

CLEAN UP
--------
 1. Console: disable the CDN, wait a few minutes, delete it.
 2. aws s3 rm s3://YOUR_SITE_BUCKET --recursive
    aws s3api delete-bucket --bucket YOUR_SITE_BUCKET
 3. bash scripts/teardown.sh     (API, function, logs, role, memory bucket)
 4. Look in the console for the name wharf-twin in every region you used.
 Local: delete memory/ and backend/package/.

WHAT CHANGED SINCE THE PREVIOUS LESSON
--------------------------------------
Earlier lessons showed the twin in pieces: memory in files, a persona prompt, a
bucket version of the memory code. Here they are one program. The new parts are
the switch (USE_BUCKET) that moves memory from local files to the bucket, the
function entry point (Mangum), CORS handled by the app locally and by the gateway
in the cloud, and the static export that reads its API address at build time.
Added here and not in the lessons: the scripts and IAM files (the lesson used
console clicks), and a root page so the CDN's front door shows the chat.
