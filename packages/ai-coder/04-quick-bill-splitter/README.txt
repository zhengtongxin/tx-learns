Quick bill splitter: package
============================
What this is: a tiny throwaway tool you vibe-code with a coding agent. The test
is the brief: it says exactly what "done" means.

Folders
  starter/   split.js with nothing built, and the test.
  final/     a finished split.js and the same test.

What you need
  - Node.js 18 or newer (no install step).
  - Any coding agent (editor, terminal or cloud) for the build itself.

Offline check (no keys, no network)
  cd starter
  node test_split.js     (fails until the agent finishes the job)
  cd ../final
  node test_split.js     (prints one "ok:" line)

Use it
  1. Give your agent the brief from the lesson and tell it to run the test.
  2. Run it yourself, then read the diff for new packages or rounding shortcuts.
  3. Keep it (add a README) or delete it, within your time box.

The dishes and names are made up. Never give a quick build real secrets.
