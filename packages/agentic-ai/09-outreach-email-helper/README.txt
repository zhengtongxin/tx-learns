AN OUTREACH EMAIL HELPER: code package
=======================================
Lesson: agentic-ai/09-outreach-email-helper.html
All names and data in this package are invented (Little Lanterns is a made-up tutoring centre).

WHAT YOU BUILD
--------------
A small team of agents that writes and sends one invitation email to parents about a new
Saturday coding club. The same team runs three ways, so you can compare them:
  code     your Python is the boss: three writers run at once, a picker chooses, your code sends
  manager  a Coordinator agent is the boss and uses the writers as tools, then sends
  handoff  the Coordinator picks a draft, then hands the job to a Mailroom agent that sends

FOLDER STRUCTURE
----------------
09-outreach-email-helper/
  README.txt
  requirements.txt
  env.example            copy to .env and fill in
  final/                 the finished, runnable version
    mail.py              send_by_email, push, send_message (the one door for sending)
    team.py              writers, picker, send_email tool, mailroom, coordinators
    main.py              runs one of the three modes
  starter/               same layout, with TODO stubs

REQUIREMENTS
------------
- Python 3.10 or newer
- An OpenAI API key
- To really send mail: an email account that allows SMTP with an app password. If you do
  not set it up, the helper falls back to a phone push (Pushover), and if that is not set
  up either, it simply prints the email in your terminal. That is enough to learn.

INSTALL
-------
  cd packages/agentic-ai/09-outreach-email-helper
  python3 -m venv .venv
  source .venv/bin/activate          (Windows: .venv\Scripts\activate)
  pip install -r requirements.txt
  cp env.example .env                (Windows: copy env.example .env)
  open .env and replace the placeholders. Start with only OPENAI_API_KEY.

RUN
---
  cd final
  python main.py code
  python main.py manager
  python main.py handoff
Always test with your own address (MAIL_TO) first. Never point it at real parents until
you are happy with the result.

TEST / WHAT SUCCESS LOOKS LIKE
------------------------------
- With no mail or push settings, you see "[nothing sent: no mail or push settings]"
  followed by one invitation email: a subject line and a short body about the Saturday
  coding club for kids aged 9 to 12.
- "manager" mode prints the Coordinator's final reply and sends exactly one email.
- "handoff" mode prints "Last agent: Mailroom".
- In your OpenAI dashboard, open the Traces page and you will see each run as one entry.

One failure case: with the small model, the manager sometimes asks only two writers or
sends two emails, and in handoff mode the Mailroom sometimes never sends.
Fix: keep the numbered steps in the instructions ("do not go on until you have all
three", "send exactly one email"), keep tool_choice="required" on the Mailroom, and if it
still wanders, try a bigger model by changing MODEL in team.py.

Another one: "SyntaxError: 'await' outside function". That happens if you paste the
lesson's top-level await lines into a .py file. Keep them inside async def functions, as
main.py does.

COST NOTE (approximate)
-----------------------
"code" mode makes 4 model calls. "manager" and "handoff" modes make roughly 5 to 8 calls
because the manager also talks. With a small model each run is normally a few cents or
less. Prices change, so check your provider's pricing page.

CLEAN UP
--------
  deactivate
  rm -rf .venv        (Windows: rmdir /s /q .venv)
  rm .env             removes your keys from this folder
Revoke the SMTP app password in your email settings if you will not use it again.

WHAT CHANGED SINCE THE PREVIOUS LESSON
--------------------------------------
The agent SDK lessons used one or two agents. Here you build a team of five (three
writers, a picker, a mailroom), run them in parallel with asyncio.gather, turn sending
into a tool with @function_tool, force real tool use with tool_choice="required", and try
both ways of letting an LLM be the manager: agents as tools and a handoff. Added beyond
what the lesson showed: a small working push() helper, a print fallback when nothing is
set up, and a command-line switch between the three modes.
