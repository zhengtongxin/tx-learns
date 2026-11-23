# A managed model service versus a vendor API (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/15-managed-models-vs-vendor-api.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'15-managed-models-vs-vendor-api.html' to that item only.

Topic: Managed models in the cloud. Planned item: "A managed model service versus a vendor API" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Swap the twin's brain from a vendor API to the cloud provider's managed model service, and know what changes.

## Steps
1. A managed model service gives many vendors' models through one API inside my cloud account: no servers to run, pay per request, requests stay in my region, access is controlled by the identity service.
2. Give the user group permission for the model service and for logs.
3. Request access to the models I want. The way to do this has changed over time, so read the current console instructions.
4. Change the code: a runtime client for the region, a model id, and a different request and response shape from the vendor one.
5. Give the function's role permission to call models, redeploy, test.

## What I got wrong
- Model id and region did not match, so "model not found". Some models are only in some regions, or need a regional prefix on the id.
- Forgot the function's role needs permission, not just my user.
- Messages must alternate user and assistant; a stray system message broke it.

## Try it yourself
1. Print the raw response once and find where the text hides.
2. Call the same prompt on both APIs and compare shape, time and cost.
3. List what you gain and lose by staying inside one cloud.

## Takeaways
Managed = less to run, more to configure in permissions. The code change is small; the access setup is where time goes.
