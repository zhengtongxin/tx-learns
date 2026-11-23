# A product in two halves: front end and API (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/02-product-in-two-halves.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'02-product-in-two-halves.html' to that item only.

Topic: From laptop to live. Planned item: "A product in two halves: front end and API" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Understand one product made of two halves that deploy together: a React front end (Next.js) and a Python API (FastAPI) in an `api` folder, under one web address.

## Steps
1. Create the Next.js project (TypeScript, Tailwind, the older "pages" layout), clear out the sample content.
2. Add an `api/index.py` with a FastAPI route and a requirements file for the Python half.
3. Make the home page a "client component" (it runs in the browser) that calls `/api` and shows the reply.
4. A host config sends `/api/...` to Python and everything else to Next.js, so the browser sees one site and CORS trouble disappears.
5. Link the folder to the host project, set the model key as an environment variable, deploy a preview, then promote to production.
6. Tailwind is just short class names for styling; the typography plugin makes rendered markdown look decent.

## What I got wrong
- Called the API with a full address locally and it broke in production. A relative `/api` path works in both.
- Forgot the Python requirements file, so the API half failed while the page looked fine.

## Try it yourself
1. Add a second route `/api/hello` and show it on the page.
2. Open the preview address and the production address and notice they are separate deployments.
3. Draw the request path on paper, from the browser to the model and back.

## Takeaways
Two halves, one address. The front end is just files in the browser; the secret-holding work happens in the API half.
