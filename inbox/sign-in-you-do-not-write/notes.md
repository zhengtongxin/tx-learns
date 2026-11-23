# Sign-in you do not write yourself (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/04-sign-in-you-do-not-write.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'04-sign-in-you-do-not-write.html' to that item only.

Topic: Users, sign-in and money. Planned item: "Sign-in you do not write yourself" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Protect the product so only signed-in people can use it, without writing a login system myself.

## Steps
1. Use a hosted sign-in service. Create an app there, pick the sign-in methods (email, Google, GitHub...).
2. Install its React package, wrap the app in its provider, and put keys in a local env file (never committed; add it to .gitignore). The public key goes to the browser, the secret one stays on the server.
3. Pages redirect visitors who are signed out; a sign-in modal and a user button handle the rest.
4. The browser gets a session token (a JWT) and sends it with each API request.
5. The Python API checks the token's signature against the service's published public keys (JWKS) and reads the user id from it.
6. Add the same environment variables in the host settings, then redeploy.

## What I got wrong
- Kept getting "unauthorized": the key in the host settings was different from my local one.
- Tokens are short-lived (about a minute), so a stale token looks like a random failure. Fetch a fresh one per request.
- Almost committed the secret key.

## Try it yourself
1. Call the API from the command line without a token and read the error.
2. Decode a token on a debugging site and look at what is inside (never paste a real one anywhere public).
3. Add a second sign-in method.

## Takeaways
Do not write passwords handling. Verify a signed token on the server for every request; the browser check alone is only for looks.
