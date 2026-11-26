Business agent team: package
============================
What this is: the planning sheet and the first tested piece of a small agent
team: a router that decides which helper takes a request and whether a person
must approve first. Build the rest (voice front desk, knowledge, booking,
billing) in n8n and ElevenLabs as in the lessons, and keep this test as your
safety net.

Folders
  starter/   agents.txt, the test, and router.js with the rules left empty.
  final/     a finished router and the same planning sheet.

What you need
  - Node.js 18 or newer for the offline check (no install step).
  - For the full team: n8n, an ElevenLabs account, a Supabase project and a
    model API key, as in the earlier lessons.

Offline check (no keys, no network)
  cd final
  node test_router.js
  It prints one "ok:" line. Run it in starter/ first: it fails until you finish.

Use it
  1. Fill in agents.txt for your own small business (made-up is fine).
  2. Write your own 20 test requests into test_router.js.
  3. Change the rules until every test passes, then build the helpers.

The made-up tuition centre is only an example. Use your own business.
