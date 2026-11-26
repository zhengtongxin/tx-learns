Shop voice assistant: package
=============================
What this is: the lookup half of a voice assistant for a made-up bicycle shop.
A voice agent (ElevenLabs) calls an n8n webhook with a question; the workflow
embeds the question, searches the product chunks in Supabase and returns the
closest facts. The voice agent turns the facts into a spoken answer.

Folders
  starter/   products.txt, the test, and chunk.js with the function left empty.
  final/     a finished version, plus search.sql and workflow.json.

What you need
  - Node.js 18 or newer for the offline check (no install step).
  - n8n (free Cloud trial), a free Supabase project, a model API key for
    embeddings, and an ElevenLabs account. See env.example for the names.

Offline check (no keys, no network)
  cd final
  node test_chunk.js
  It prints one "ok:" line. Run it in starter/ first: it fails until you finish.

Build it
  1. In Supabase, open the SQL Editor and run final/search.sql.
  2. Ingest: run chunkMarkdown on products.txt and store each chunk with its
     embedding (the lesson shows the n8n ingest workflow).
  3. In n8n, import final/workflow.json, pick your credentials on the two HTTP
     Request nodes, replace YOUR-PROJECT in the Supabase address and activate.
  4. In ElevenLabs add a server tool that POSTs {"question": "..."} to the
     production webhook address and reads "answer" from the reply.
  If the import complains about a node, rebuild it by hand from the lesson:
  node settings change between n8n versions.

The shop, products and prices are made up.
