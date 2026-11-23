# Gateway, keys and policy (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-fde/22-gateway-keys-and-policy.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'22-gateway-keys-and-policy.html' to that item only.

Topic: Improving and securing. Planned item: "Gateway, keys and policy" (tag "Improving and securing · Lesson 22"). This is a concept lesson with one runnable idea. Setting: Kaya Travel Cover, the Tanjong Pagar shophouse insurer in ai-fde/STORY.md; end with the "Back at the shophouse" callout.

## Goal
Put a gateway and a policy in front of the agent's actions, and give every caller a key.

## Build order
1. Security found: the agent sends nothing to identify itself, so anyone who can reach the backend can record decisions or pay a claim.
2. Give the agent an API key sent in a header on every call; the backend refuses routes without it.
3. Put the app on a public address only after that.
4. Put a gateway in front of the agent's routes. The agent sees them as tools.
5. Write a policy in a rule language: refuse any payment over the limit.
6. Test which layer says no: the prompt, the guardrail, the backend or the policy.
7. Start the policy in log-only mode, read the decisions, then enforce it.

## Typical outcome pattern
The policy only helps if every call really goes through the gateway. If the agent still calls the app directly, the policy never sees it.

## What I got wrong
I had the policy in place but the agent still called the backend directly, so it protected nothing. Move the agent onto the gateway's tools.

## Try it yourself
1. Try a call with no key, a wrong key and the right key.
2. Try a payment above the limit through each layer.
3. Switch the policy from log-only to enforce.

## Takeaways
Every caller gets a key. A policy only protects what goes through it. Start in log-only mode. Keep several layers.
