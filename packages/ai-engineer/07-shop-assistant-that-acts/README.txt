SHOP ASSISTANT THAT ACTS
========================

What you build
--------------
A desk assistant for Uncle Raj's weekend coach trips. You type a question in a
chat screen. A chat model decides whether to look up a price in a small SQLite
database (it asks, your code runs the lookup). If a place was looked up, an
image model draws a pop-art picture of it. The reply is also spoken aloud.
Image and voice are separate model calls, and the picture is drawn only when a
tool actually looked something up (pictures cost real money).

Folder structure
----------------
  README.txt
  requirements.txt
  env.example            copy to .env and add your key
  final/
    assistant.py         complete working version (tools, loop, picture, voice, screen)
    test_tools.py        offline check of the database tools (no key, no network)
  starter/
    assistant.py         same layout, with TODO stubs
    test_tools.py        the same check (passes once get_price and set_price are done)

Requirements
------------
  - Python 3.10 or newer
  - Packages: see requirements.txt (openai, gradio, pillow, python-dotenv)
  - An OpenAI API key with credit. The image model may ask you to verify your
    organisation in the provider's dashboard before it will draw.
  - A browser and speakers for the screen

Install
-------
  python3 -m venv .venv
  source .venv/bin/activate          (Windows: .venv\Scripts\activate)
  pip install -r requirements.txt
  cp env.example .env                (then edit .env and replace YOUR_KEY_HERE)

Run
---
  cd final
  python assistant.py
  Open the local address it prints (usually http://127.0.0.1:7860).

For the starter: cd starter, fill in the TODOs, run the same way.

Test / what success looks like
------------------------------
Offline check (no key needed):
  cd final
  python test_tools.py
  -> ok: get_price and set_price work; looked_up = [...]
  (The first lookup creates trips.db in the folder you ran from.)

On the screen, type "How much is Ipoh and Genting?". Expect:
  - the terminal prints two "tool call: get_price ..." lines;
  - the reply says Ipoh is S$62 and Genting is S$55;
  - a pop-art picture appears on the right (of the last place looked up);
  - the reply plays as audio.
Type "Say hello". Expect a reply and a voice, but no new picture and no tool
calls (nothing was looked up).

One failure case: an error about "tool_call_id" or "tool messages".
  Every tool call the model asks for needs one tool message back with the same
  id. Check that your loop appends a tool message inside the for loop.
Another: the picture step fails with a permission or verification error.
  Verify your organisation with the provider, or comment out the draw() line
  to run without pictures.

Cost note (approximate)
-----------------------
Chat and voice calls cost a fraction of a cent each. Each picture costs a few
cents, which is why it is only drawn after a lookup. A short test session is
usually well under a dollar. Prices change, so check your provider's page.

Clean up
--------
  Press Ctrl+C in the terminal to stop the screen.
  rm -f trips.db reply.mp3           (the database and the audio file)
  deactivate
  rm -rf .venv .env

What changed since the previous lesson
--------------------------------------
Earlier lessons showed the pieces one at a time: the chat screen, the tool
loop with a database, and the picture and voice calls. Here they are joined in
one file. New: a dispatch table that maps tool names to functions, the
looked_up list that decides whether to draw, and two chained callbacks on the
screen (add the user message, then get the answer). Added to make it run on
its own: loading .env and a database connection that works across threads.
