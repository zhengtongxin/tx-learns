# Subscriptions and gating a feature (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-production/05-subscriptions-and-feature-gates.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'05-subscriptions-and-feature-gates.html' to that item only.

Topic: Users, sign-in and money. Planned item: "Subscriptions and gating a feature" (concept lesson). Track story: STORY.md (the wharf; end with the "At the wharf" callout).

## Goal
Let only paying users into the main feature, using the same sign-in service's billing.

## Steps
1. Turn on billing in the service's dashboard and create one plan (name, monthly price, a short feature list). Copy the plan id.
2. Show a pricing table on the landing page; the service hosts the payment form.
3. A protect component on the product page shows its content only to people on that plan; everyone else sees the pricing table.
4. Use the test payment mode and a test card to try the whole flow. Check where subscriptions can be managed or cancelled.
5. Ideas: more tiers, usage limits per plan, a custom table.

## What I got wrong
- Wrong plan id: "plan not found".
- Always saw the pricing table even after subscribing: the plan id in the gate did not match the one I bought.
- Forgot the gate only hides the screen; the API still needs its own check if it must be paid-only.

## Try it yourself
1. Add a second, cheaper plan and gate one extra feature behind the expensive one.
2. Cancel the test subscription and see what the user sees.
3. Write down which checks live in the browser and which on the server.

## Takeaways
Billing is a gate with a plan id. Hiding a button is not security; check the plan on the server too.
