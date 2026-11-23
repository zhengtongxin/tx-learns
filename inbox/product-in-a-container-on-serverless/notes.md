# Project: the product in a container on serverless (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/10-product-in-a-container-on-serverless.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'10-product-in-a-container-on-serverless.html' to that item only.

Topic: Containers and a safe cloud account. Planned item: "Project: the product in a container on serverless" (project, tag "Containers and a safe cloud account · Project"). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Take the signed-in, paid, streaming product and move all of it onto the cloud account: container, registry, serverless function, public address.

## Steps
1. Start from the working product. Change the front end to a static export and the API to listen as a normal web server.
2. Write the Dockerfile; build and run it locally first.
3. Create a repository in the registry, log the container tool in with the account's temporary token, tag and push the image.
4. Create the function from the image, set env variables (model key, sign-in keys), turn on the function URL with streaming.
5. Point the sign-in service's allowed address at the new URL, then test sign-in, subscribe, stream.
6. Read the logs when it fails. It will.

## What I got wrong
- Pushed an image built for the wrong chip type; the function would not start.
- Sign-in kept failing: the allowed address in the sign-in service still pointed at the old host.
- Left test resources running and found them on the budget alert.

## Try it yourself
1. Redeploy after a one-line change and time the whole loop.
2. Delete everything you made and check the console is clean.
3. Compare the cost line with the previous host.

## Takeaways
Same product, new home. Most of the pain is config and addresses, not code. Always have a way to tear it all down.
