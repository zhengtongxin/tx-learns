CONSULTATION NOTES ASSISTANT (project package)
==============================================

WHAT YOU BUILD
--------------
A small web product for the wharf clinic's nurse. She signs in, is on the paid
plan, types a patient name, a visit date and messy notes, and presses one
button. The page streams back three tidy sections: a summary for the records,
next steps for the nurse and a plain email for the patient.

It joins everything from the first five lessons: the two-halves layout
(Next.js page + FastAPI API), streaming, hosted sign-in and the plan gate.

DEMO ONLY. All data here is invented. Never type real patient data into it.
Real use needs privacy-law compliance, encryption, audit logs, access roles
and consent.

FOLDER STRUCTURE
----------------
06-consultation-notes-assistant/
  README.txt           this file
  env.example          copy to .env.local (see Install)
  final/               the complete, working reference
    api/index.py       FastAPI: Pydantic check, sign-in check, plan check, stream
    api/requirements.txt   the Python packages (the API half installs its own)
    pages/_app.tsx     wraps the app in the sign-in provider
    pages/index.tsx    the form, the fetch + stream reader, the plan gate
    styles/globals.css, tailwind.config.js, postcss.config.js, tsconfig.json
                       the boilerplate create-next-app would write for you
    package.json       the Node packages
    vercel.json        sends /api/... to the Python file
    gitignore.txt      copy to .gitignore before your first commit
  starter/             the same layout with TODO stubs for you to fill in

REQUIREMENTS
------------
- Node 20 or newer and npm
- Python 3.10 or newer (3.12 is fine)
- The Vercel command line: npm install -g vercel   (needed for "vercel dev")
- Accounts (all have free or test modes):
    * an OpenAI key                      -> OPENAI_API_KEY
    * a hosted sign-in service (Clerk)   -> publishable key, secret key, JWKS URL
    * billing turned on in that service, with ONE plan whose slug you copy.
      The code uses the slug wharf_pro; change PLAN_SLUG in api/index.py and
      the plan= value in pages/index.tsx if yours is different.

INSTALL
-------
1. Copy the folder you want to work in (final/ or starter/) somewhere, then:
     cd final
     cp gitignore.txt .gitignore         (do this BEFORE the next step)
2. Copy ../env.example to .env.local in that folder and fill in YOUR values.
   The file stays on your laptop. It is listed in .gitignore.
3. Install the two halves:
     npm install
     python3 -m venv .venv && source .venv/bin/activate
     pip install -r api/requirements.txt
   (On Vercel the api folder installs its own requirements file.)

RUN
---
     vercel link              (once, to connect the folder to a project)
     vercel dev               (runs page and API together on one address)
Open the address it prints (usually http://localhost:3000).

To deploy, add the same four variables on the host, then redeploy:
     vercel env add OPENAI_API_KEY
     vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
     vercel env add CLERK_SECRET_KEY
     vercel env add CLERK_JWKS_URL
     vercel            (a preview address: test it here first)
     vercel --prod

TEST / WHAT SUCCESS LOOKS LIKE
------------------------------
Walk the path like the nurse would:
 1. Signed out: you see only the sign-in button.
 2. Sign in, free plan: you see the pricing table, not the form.
 3. Subscribe with the service's TEST card: the form appears.
 4. Fill it with invented data, for example:
      Name:  Test Patient
      Date:  2026-11-23   (the date picker always gives year-month-day)
      Notes: dizzy after lunch, bp a bit high, told to rest and drink water
 5. Text appears bit by bit and ends as three headed sections:
      Summary for the records / Next steps for the nurse / Email to the patient

No browser? Check the API alone (it must refuse you):
     curl -i -X POST http://localhost:3000/api/consultation \
       -H "Content-Type: application/json" \
       -d '{"patient_name":"A","visit_date":"2026-11-23","notes":"x"}'
 expect a 401 or 403 (no sign-in token). With a valid token on the free plan
 you get 402 "Subscription needed". With a bad date you get 422.

One failure to know:
 - Symptom: "Method Not Allowed" (405). Cause: the route is still GET or the
   page calls the wrong path. Fix: the route must be @app.post and the page must
   fetch with method: "POST" to /api/consultation.
 - Symptom: every call is 401. Cause: CLERK_JWKS_URL on the host differs from
   your local one, or the key was added but you did not redeploy. Fix: set the
   same variables on the host and redeploy.
 - Symptom: always see the pricing table after paying. Cause: wrong plan slug.
   Fix: copy the slug (not the long id) from the dashboard.

COST NOTE (approximate)
-----------------------
With a small model and a few test requests, the model cost is cents. The
hosting and sign-in services have free tiers for learning. Billing runs in test
mode, so no real money moves. Prices change: check each dashboard.

CLEAN UP
--------
     vercel remove YOUR-PROJECT-NAME       (deletes the project and its deployments)
In the sign-in dashboard: delete the test app (or just the test plan).
In the model provider dashboard: revoke the key you made for this project.
Delete your local .env.local if you no longer need it.

WHAT CHANGED SINCE THE PREVIOUS LESSON
--------------------------------------
Nothing new is installed. The earlier lessons gave you a sign-in, a plan gate
and a streaming route that answered GET. Now the route is POST with a checked
body (Pydantic), the model gets a three-section system prompt, and the page
reads the stream with fetch (not EventSource) so it can send the token.
Added here and not in the lessons: an error message on the page, a stop
to the form's page reload, and a PLAN_SLUG constant.

ACCEPTANCE CRITERIA
-------------------
You are done when:
- Signed out, you see only the sign-in button; signed in on the free plan you see the pricing table, not the form.
- After subscribing with the TEST card, the form appears.
- Submitting invented notes streams text bit by bit and ends in three headed sections: Summary for the records, Next steps for the nurse, Email to the patient.
- The API alone answers 401 or 403 without a token, 402 on the free plan, and 422 for a bad date.
- A GET request to the route is refused with 405.

Compare your work with final/ afterwards, starting with: the api folder (the consultation route), the pages folder, vercel.json.

验收标准（中文）
- 退出登录时只看到登录按钮；以免费套餐登录时看到价格表而不是表单。
- 用测试卡订阅后，表单出现。
- 提交虚构的记录后文字逐步流出，最后是三个带标题的部分：Summary for the records、Next steps for the nurse、Email to the patient。
- 单独调用 API：没有令牌返回 401 或 403，免费套餐返回 402，日期错误返回 422。
- 对该路由发 GET 请求被拒绝，返回 405。
