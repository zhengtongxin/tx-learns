# Containers in plain words (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/08-containers-in-plain-words.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'08-containers-in-plain-words.html' to that item only.

Topic: Containers and a safe cloud account. Planned item: "Containers in plain words" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Understand what a container really is and why packaging the app as one makes deploying calmer.

## Steps
1. A container is the app plus everything it needs to run, sealed in one box that runs the same on my laptop and on the cloud.
2. A Dockerfile is the recipe: start from a base image with Python, copy my files, install requirements, say how to start.
3. Build gives an image; run starts a container from it. A registry stores images so the cloud can pull them.
4. Install the desktop app for containers and check it with the hello-world image.
5. Turn the front end into static files (a static export) so the container only serves plain pages and the API.
6. Point the front end at relative API paths again, add CORS and the sign-in settings to the API.

## What I got wrong
- Built an image that was huge because I copied everything. Use an ignore file and small base images.
- Used a Mac-built image on a different chip type. Build for the platform you deploy to.
- Forgot the container does not see my env file unless I pass it in.

## Try it yourself
1. Build the image, run it locally, hit it in the browser.
2. Look at the image size and shrink it once.
3. Explain "image" versus "container" to a friend without using either word's twin.

## Takeaways
Container = same box everywhere. The recipe is code too, so it can be reviewed and rebuilt.
