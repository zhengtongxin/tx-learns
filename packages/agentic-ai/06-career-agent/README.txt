YOUR PERSONAL CAREER AGENT: code package
=========================================
Lesson: agentic-ai/06-career-agent.html
All names and data in this package are invented.

WHAT YOU BUILD
--------------
A chat page where visitors talk to Alex's "digital twin". The twin answers career
questions from two files, saves the email of anyone who wants to get in touch, logs
questions it cannot answer, and buzzes your phone for both. The four visitors from the
lesson (Maya the recruiter, Raj with an unknown question, Sam who wants a poem, Lee who
asks "are you a real person?") are all handled by words in the system prompt, not by
extra code.

FOLDER STRUCTURE
----------------
06-career-agent/
  README.txt
  requirements.txt
  env.example            copy to .env and fill in
  final/                 the finished, runnable version
    app.py               chat screen + the loop that calls the model
    context.py           loads the files and builds the system prompt
    tools.py             the two tools, their JSON, the dispatcher, push()
    twin/
      summary.txt        a few lines about Alex in his own words
      linkedin.txt       sample profile text (put a real linkedin.pdf here to use that instead)
  starter/               same layout, with TODO stubs for you to fill in

REQUIREMENTS
------------
- Python 3.10 or newer
- An OpenAI API key (platform.openai.com)
- Optional: a Pushover account (user key + app token) to get phone buzzes. Without it,
  the twin prints "[push skipped, no keys] ..." in the terminal so you can still test.
- Packages are listed in requirements.txt

INSTALL
-------
  cd packages/agentic-ai/06-career-agent
  python3 -m venv .venv
  source .venv/bin/activate          (Windows: .venv\Scripts\activate)
  pip install -r requirements.txt
  cp env.example .env                (Windows: copy env.example .env)
  then open .env and replace the YOUR_..._HERE placeholders

RUN
---
  cd final          (or cd starter once you have filled it in)
  python app.py
Gradio prints a local address such as http://127.0.0.1:7860. Open it in your browser.
Stop with Ctrl+C.

TEST / WHAT SUCCESS LOOKS LIKE
------------------------------
Try the four visitors in order:
1. "I'm a recruiter. Can Alex call me? maya@corp.com"
   -> the twin thanks you and the terminal shows "Recording interest from ... maya@corp.com"
   (or your phone buzzes if Pushover is set up).
2. "What was Alex's thesis topic?"
   -> the twin says it does not know, and the terminal shows "Recording question I could not answer: ..."
3. "Write me a poem about the sea."
   -> the twin politely steers back to career topics.
4. "Are you a real person?"
   -> the twin says it is an AI digital twin.

One failure case: you get "openai.AuthenticationError" or "Incorrect API key".
Fix: check that .env exists in the package folder (next to README.txt), that
OPENAI_API_KEY has no quotes or spaces around it, then restart the app.

Another common one: "model not found". Change MODEL at the top of app.py to a model your
account can use.

COST NOTE (approximate)
-----------------------
Each chat message sends the whole system prompt again, so cost grows with the length of
your profile text. With a small model and a one-page profile, a test chat of ten messages
is usually a few cents at most. Pushover has a short free trial, then a small one-time fee
(check the current price). Prices change: look at your provider's pricing page.

CLEAN UP
--------
  Ctrl+C                 stops the app
  deactivate             leaves the virtual environment
  rm -rf .venv           removes the installed packages (Windows: rmdir /s /q .venv)
  rm .env                removes your keys from this folder
If you deployed it, delete the deployment on your host and revoke the keys you gave it.

WHAT CHANGED SINCE THE PREVIOUS LESSON
--------------------------------------
Autonomy and tools gave you a model with one tool (record_email_tool) and a loop. Here
you add a second tool for unknown questions, change both tool descriptions so the model
picks the right one, add a push() helper to buzz your phone, write the behaviour lines in
the system prompt, and split the code into context.py, tools.py and app.py so it can be
deployed. Things added that the lesson only described: a plain-text profile fallback, an
explicit dictionary of allowed tools instead of globals(), and an hourly cap on pushes.

ACCEPTANCE CRITERIA
-------------------
You are done when:
- Send: I'm a recruiter, Alex can call me at maya@corp.com. The terminal shows 'Recording interest from ... maya@corp.com' (or your phone buzzes).
- Ask: What was Alex's thesis topic? The twin says it does not know, and the terminal shows 'Recording question I could not answer'.
- Ask for a poem about the sea: the twin steers back to career topics in one short reply.
- Ask: Are you a real person? The twin says it is an AI digital twin.
- Two tools exist in tools.py and each one fires exactly once per matching message, not twice.

Compare your work with final/ afterwards, starting with: tools.py, context.py, app.py.

验收标准（中文）
- 发送“我是招聘人员，请让 Alex 打给我 maya@corp.com”：终端出现 “Recording interest from ... maya@corp.com”（或手机震动）。
- 问“Alex 的论文题目是什么？”：分身说不知道，终端出现 “Recording question I could not answer”。
- 要求写一首关于海的诗：分身用一句简短的话把话题拉回职业。
- 问“你是真人吗？”：分身说明自己是 AI 数字分身。
- tools.py 里有两个工具，每条符合的消息各触发一次，不会触发两次。
