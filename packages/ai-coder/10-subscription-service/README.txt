Subscription service: package
=============================
What this is: the one slice of a subscription service that only you decide:
what each plan allows, and how billing events are handled safely. Sign-in,
payments and the database come from hosted services; this is the logic around
them, built and tested with a terminal agent.

Folders
  starter/   spec.txt left blank, billing.js with empty functions, the test.
  final/     a finished spec.txt and billing.js, and the same test.

What you need
  - Node.js 18 or newer (no install step).
  - A terminal agent. For the full service: a hosted sign-in, a payment
    provider (use its test mode) and a database.

Offline check (no keys, no network)
  cd final
  node test_billing.js     prints one "ok:" line.
  Run it in starter/ first: it fails until the agent finishes.

Use it
  1. Fill in spec.txt for a service of your own and cut it into slices.
  2. Get the tests passing, then try to break it: a 4th free use, the same
     event twice, a plan that does not exist.
  3. In a real build, verify the provider's webhook signature too.

The photo-captioning shop is only an example.
