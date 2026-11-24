THE PRODUCT IN A CONTAINER ON SERVERLESS (project package)
===========================================================

WHAT YOU BUILD
--------------
The same signed-in, paid, streaming consultation notes product, moved onto
your own cloud account:

  your code + static front end  ->  Docker image  ->  registry
        ->  serverless function  ->  public streaming address

The product does not change. How it is packed does. The API also serves the
static front end, so the page and the API share one address.

This package holds the API, the Dockerfile and the scripts. The front end is the
Next.js page from the consultation notes project: you export it and drop it into
the static folder (see Install, step 3). A tiny placeholder page is included so
the container runs on its own.

Parts that need a paid cloud account (a registry, a function, logs) cannot run
on your laptop. For those, final/ is the reference; the local steps (build, run,
health check) work with only Docker.

FOLDER STRUCTURE
----------------
10-product-in-a-container-on-serverless/
  README.txt
  env.example                copy to final/.env (or starter/.env)
  final/
    server.py                the API: sign-in check, plan check, stream, static files
    requirements.txt         Python packages
    Dockerfile               the recipe (adapter + streaming switch)
    Dockerfile.dockerignore  keeps junk and secrets out of the image
    static/index.html        placeholder page; replace with your front end export
    scripts/build-static.sh  export your Next.js page into static/
    scripts/push-image.sh    build, create repository, log in, tag, push
    scripts/create-function.sh  role + function + streaming function URL
    scripts/teardown.sh      delete everything this project made
  starter/                   same layout with TODO stubs

REQUIREMENTS
------------
- Docker (Docker Desktop on Mac or Windows, Docker Engine on Linux), recent
  enough to use BuildKit (Docker 23 or newer)
- Python 3.12 only inside the container (your laptop needs nothing extra)
- Node 20+ to export the front end
- The cloud command-line tool (AWS CLI v2), signed in as your limited daily
  user (not root), with the default region set to ap-southeast-1 (or set REGION)
- Your cloud user needs permission for the registry, the function service,
  logs and roles
- The three keys from the consultation notes project: OPENAI_API_KEY,
  CLERK_SECRET_KEY, CLERK_JWKS_URL (all placeholders in env.example)

INSTALL
-------
1. cd final     (or starter)
2. cp ../env.example .env    and fill in YOUR values.
   .env is kept out of the image by Dockerfile.dockerignore. Never commit it.
3. Build the front end into static/ (needs the consultation notes project, with
   module.exports = { output: "export" } in its next.config.js):
     bash scripts/build-static.sh /path/to/consultation-notes-assistant/final
   Skip this to keep the placeholder page.
   Note: your sign-in service must allow the new address (see Test, step 4).

RUN (on your laptop first, always)
----------------------------------
     docker build --platform linux/amd64 -t canteen-helper .
     docker run --env-file .env -p 8000:8000 canteen-helper
Open http://localhost:8000 . The log shows "Uvicorn running on 0.0.0.0:8000".

Then, in the cloud (these cost a little and need your account):
     bash scripts/push-image.sh          # repository + login + push
     bash scripts/create-function.sh     # role + function + streaming URL
It prints the function URL, for example
     https://abc123.lambda-url.ap-southeast-1.on.aws/

TEST / WHAT SUCCESS LOOKS LIKE
------------------------------
1. Local: http://localhost:8000/api/health  shows  {"ok":true}
2. Local: the page loads (placeholder or your real front end).
3. Cloud: open the function URL. The first request after a quiet spell takes a
   few seconds (a cold start). The next one is quick.
4. In your sign-in dashboard add the function URL to the allowed addresses.
   Then test in order: sign in, subscribe with the TEST card, ask a question and
   watch it stream.
5. Read the log:
     aws logs tail /aws/lambda/canteen-helper --since 10m --region ap-southeast-1
   Find the REPORT line: Duration, Billed Duration and (only on a cold start)
   Init Duration.

Failure cases and fixes:
 - Symptom: the function will not start, or the image is rejected.
   Cause: the image was built for the wrong chip type, or has extra metadata.
   Fix: build with  --platform linux/amd64 --provenance=false  (push-image.sh does).
 - Symptom: sign-in keeps failing on the new address.
   Cause: the sign-in service still lists only the old host.
   Fix: add the function URL to its allowed addresses.
 - Symptom: the answer arrives all at once, not word by word.
   Cause: invoke mode is BUFFERED, or the Dockerfile lacks
   AWS_LWA_INVOKE_MODE=response_stream. Both must say streaming.
 - Symptom: it times out on long answers. Fix: timeout 60 s, not the default.

COST NOTE (approximate)
-----------------------
A function used a few times a day costs cents or nothing (you pay for the
milliseconds it runs, plus the model calls). Storing one image in the registry
is a few cents a month. Logs cost a little if left forever. The budget alarm from
your safe-account setup is the safety net. Prices change: check your bill page.

CLEAN UP
--------
     bash scripts/teardown.sh
It deletes the function (and its URL), the image repository, the log group and
the role. Then open the console in every region you used and check nothing is
left. Local cleanup:
     docker rmi canteen-helper
Remove the function URL from your sign-in service's allowed addresses.

WHAT CHANGED SINCE THE PREVIOUS LESSON
--------------------------------------
The consultation notes project ran on a hosting service with two folders (page
and api). Now the API is one ordinary web server (server.py) that also serves
the exported page, an extra /api/health route is added, and a Dockerfile plus
four scripts pack and ship it. Added here and not in the lessons: the scripts
(the lesson used the console for the function), --provenance=false, and an
optional ALLOWED_ORIGINS setting for CORS.
