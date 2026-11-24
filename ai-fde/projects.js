/* Project card data for each project lesson, shown by assets/site.js. Shape: window.PROJECTS[file]={goal,deliver,level:1-3,mins,accept:{en:[],zh:[]},solution:{en,zh},fail:[],stretch:[],pkg:{dir:"packages/<track>/<name>",files:[...],note}} (goal, deliver and list items are {en,zh}) */
window.PROJECTS=window.PROJECTS||{};
Object.assign(window.PROJECTS,{
 "03-claims-desk-pilot.html": {
  "goal": {
   "en": "Build a first pilot for the claims desk: a queue with a hard sign-off rule, and an agent that decides one claim at a time.",
   "zh": "做出理赔台的第一个试点：带硬性签字规则的队列，加一个逐份理赔做决定的智能体。"
  },
  "deliver": {
   "en": "A queue, an agent and a score on 25 invented claims, run with run_pilot.py.",
   "zh": "一个队列、一个智能体，以及在 25 份编造理赔上的得分，用 run_pilot.py 运行。"
  },
  "level": 1,
  "mins": 45,
  "accept": {
   "en": [
    "Running the pilot from final/ prints one line per claim (25 claims) and ends with 'agrees with handlers on N of M claims'.",
    "Every claim ends in exactly one state: waiting, in progress, waiting for sign-off or decided.",
    "Any approval over S$800 (C008, C009, C014, C017, C024) and every refer shows waiting_signoff, never decided.",
    "Only the scoring code opens the answer_key folder; the agent never does.",
    "The dry-run score proves the plumbing only; a real model struggles most on C012, C013, C019 and C025."
   ],
   "zh": [
    "在 final/ 里运行试点，每个理赔（共 25 个）打印一行，最后是 “agrees with handlers on N of M claims”。",
    "每个理赔最后只处于一个状态：等待、处理中、等待签批或已决定。",
    "任何超过 S$800 的批准（C008、C009、C014、C017、C024）和每个转交，都显示 waiting_signoff，绝不是 decided。",
    "只有评分代码会打开 answer_key 文件夹，智能体从不打开。",
    "试运行的分数只证明流程接通；真实模型在 C012、C013、C019 和 C025 上最吃力。"
   ]
  },
  "fail": [
   {
    "en": "The score looks great because the agent saw the answer key. Keep the key where the agent cannot read it.",
    "zh": "分数很漂亮，是因为智能体看过答案。答案要放在它读不到的地方。"
   },
   {
    "en": "The sign-off rule is only in the prompt, so a big payout slips through. Put the rule in record_decision.",
    "zh": "签字规则只写在提示词里，大额赔付被放过。把规则放进 record_decision。"
   },
   {
    "en": "FileNotFoundError for data/claims.json: you ran the script outside final/ or starter/.",
    "zh": "data/claims.json 报 FileNotFoundError：没有在 final/ 或 starter/ 里运行脚本。"
   }
  ],
  "stretch": [
   {
    "en": "Add five claims of your own, one of them tricky.",
    "zh": "加五份你自己的理赔，其中一份要刁钻。"
   },
   {
    "en": "Make the agent approve a big payout and check that the backend refuses to pay it.",
    "zh": "让智能体批准一笔大额赔付，确认后端拒绝直接赔。"
   }
  ],
  "pkg": {
   "dir": "packages/ai-fde/03-claims-desk-pilot",
   "files": [
    "README.txt",
    "requirements.txt",
    "env.example",
    "final/agent.py",
    "final/answer_key/handler_decisions.json",
    "final/data/claims.json",
    "final/data/policies.json",
    "final/data/policy_wording.txt",
    "final/desk_queue.py",
    "final/fake_model.py",
    "final/run_pilot.py",
    "starter/agent.py",
    "starter/desk_queue.py",
    "starter/fake_model.py",
    "starter/run_pilot.py"
   ],
   "note": {
    "en": "For a test without a key, run DRY_RUN=1 python run_pilot.py inside final/. starter/ has the same data files as final/.",
    "zh": "想不用密钥先试一遍，在 final/ 里运行 DRY_RUN=1 python run_pilot.py。starter/ 的数据文件与 final/ 相同。"
   }
  },
  "solution": {
   "en": "The finished version is in the final/ folder. Open it after you have tried it yourself and compare your work with it, starting with desk_queue.py, agent.py and run_pilot.py. Do not copy it: check that yours does the same jobs, then note one place where the reference chose differently and decide which you prefer.",
   "zh": "完成版在 final/ 文件夹里。先自己做，再打开它与你的作品对照，从desk_queue.py、agent.py、run_pilot.py看起。不要照抄：先看你的是否完成同样的事，再找出一处参考版做法不同的地方，判断你更喜欢哪种。"
  }
 },
 "06-cheapest-model-good-enough.html": {
  "goal": {
   "en": "Choose the claims desk’s model with a written reason: the cheapest one that clears a bar agreed before the contest.",
   "zh": "带着书面理由为理赔台选模型：在比赛前定好的及格线上，选最便宜的那个。"
  },
  "deliver": {
   "en": "A comparison table, a pick with a stronger fallback, and a half-page memo for Mr Goh (choose_model.py).",
   "zh": "一张对比表、一个带更强备用模型的选择，以及给 Goh 先生的半页说明（choose_model.py）。"
  },
  "level": 2,
  "mins": 40,
  "accept": {
   "en": [
    "python bench.py prints two lines, such as 'full 377 tokens, small 225 tokens, saved 40%' and 'approving everything scores 56%'.",
    "The bar is written as numbers in the code before any model runs.",
    "choose_model.py gives each candidate one row: accuracy by difficulty, cost per 1,000 claims, seconds per claim and wrong big approvals.",
    "A model clears the bar only if it passes every line of it.",
    "It prints the cheapest model that clears the bar, a fallback, and a memo with real numbers filled in."
   ],
   "zh": [
    "python bench.py 打印两行，例如 “full 377 tokens, small 225 tokens, saved 40%” 和 “approving everything scores 56%”。",
    "及格线在任何模型运行之前，就以数字写在代码里。",
    "choose_model.py 为每个候选模型一行：按难度的准确率、每 1,000 个理赔成本、每个理赔秒数和错误的大额批准数。",
    "只有通过全部条件的模型才算达标。",
    "它打印达标中最便宜的模型、一个备选，以及填入真实数字的备忘。"
   ]
  },
  "fail": [
   {
    "en": "“nobody clears the bar” is the program working. Improve the prompt or add a candidate. Do not lower the bar after seeing scores.",
    "zh": "“nobody clears the bar”说明程序在正常工作。改进提示词或加候选模型，别在看过分数后降低及格线。"
   },
   {
    "en": "A model name is not found on your gateway. Copy the exact name from its model list.",
    "zh": "网关上找不到某个模型名。从网关的模型列表里复制准确的名字。"
   },
   {
    "en": "A gap of one claim between two models is just luck. Run each model twice before you trust a row.",
    "zh": "两个模型只差一份理赔，多半只是运气。每个模型至少跑两遍再信这一行。"
   }
  ],
  "stretch": [
   {
    "en": "Add a fifth candidate and see if the pick changes.",
    "zh": "再加第五个候选模型，看选择会不会变。"
   },
   {
    "en": "Add a line to the bar for the cost per 1,000 claims.",
    "zh": "给及格线加一条：每 1,000 份的成本上限。"
   }
  ],
  "pkg": {
   "dir": "packages/ai-fde/06-cheapest-model-good-enough",
   "files": [
    "README.txt",
    "requirements.txt",
    "env.example",
    "final/answer_key/handler_decisions.json",
    "final/bench.py",
    "final/choose_model.py",
    "final/data/claims.json",
    "final/data/policies.json",
    "final/data/policy_wording.txt",
    "final/data/wording_sections.json",
    "final/fake_model.py",
    "starter/bench.py",
    "starter/choose_model.py",
    "starter/fake_model.py"
   ],
   "note": {
    "en": "Run DRY_RUN=1 python choose_model.py inside final/ to test the plumbing with no key. starter/ has the same data files as final/.",
    "zh": "在 final/ 里运行 DRY_RUN=1 python choose_model.py，可不用密钥测试流程。starter/ 的数据文件与 final/ 相同。"
   }
  },
  "solution": {
   "en": "The finished version is in the final/ folder. Open it after you have tried it yourself and compare your work with it, starting with choose_model.py, bench.py and the bar definition. Do not copy it: check that yours does the same jobs, then note one place where the reference chose differently and decide which you prefer.",
   "zh": "完成版在 final/ 文件夹里。先自己做，再打开它与你的作品对照，从choose_model.py、bench.py、及格线的定义看起。不要照抄：先看你的是否完成同样的事，再找出一处参考版做法不同的地方，判断你更喜欢哪种。"
  }
 },
 "09-agent-that-works-the-queue.html": {
  "goal": {
   "en": "Turn the pilot into one run that works the whole queue, with a to-do list to watch and failures that fix themselves.",
   "zh": "把试点变成一次处理整条队列的运行：有一份能看的待办清单，出错时能自己恢复。"
  },
  "deliver": {
   "en": "run_queue.py: orders the claims, uses a fresh helper per claim, saves todo.json, and handles failures in code.",
   "zh": "run_queue.py：给理赔排序，每份理赔用一个全新的助手，保存 todo.json，并在代码里处理失败。"
  },
  "level": 2,
  "mins": 45,
  "accept": {
   "en": [
    "DRY_RUN=1 python run_queue.py --limit 5 --break C003 prints the to-do list by state and ends 'Dry run: 5 claims worked.'",
    "done lists C001, C002, C004 and C005; for_handler lists C003.",
    "todo.json shows C003 with \"tries\": 2 and nothing left in to_do or in_progress.",
    "Running again without --break skips finished claims, and C003 stays for_handler.",
    "With a real model, each claim's \"read\" list shows which manual sections the helper opened."
   ],
   "zh": [
    "DRY_RUN=1 python run_queue.py --limit 5 --break C003 按状态打印待办清单，并以 “Dry run: 5 claims worked.” 结束。",
    "done 列出 C001、C002、C004、C005；for_handler 列出 C003。",
    "todo.json 中 C003 的 \"tries\" 为 2，to_do 和 in_progress 里都没有剩余。",
    "不加 --break 再运行，已完成的理赔被跳过，C003 仍留给人工处理。",
    "用真实模型时，每个理赔的 \"read\" 列表显示助手打开了哪些手册章节。"
   ]
  },
  "fail": [
   {
    "en": "Nothing happens on a re-run because todo.json says everything is done. Delete it for a fresh run.",
    "zh": "再跑一次什么也没发生，因为 todo.json 说全部已完成。要从头来，先删掉它。"
   },
   {
    "en": "The helper keeps asking for sections and never answers. The loop stops after six rounds and the claim goes to a handler.",
    "zh": "助手一直要手册部分却不作答。循环六轮后停止，这份理赔交给理赔员。"
   },
   {
    "en": "The model’s order includes an id that does not exist. Check the order: drop invented ids and add forgotten ones.",
    "zh": "模型给的顺序里有不存在的编号。要检查顺序：去掉编造的，补上漏掉的。"
   }
  ],
  "stretch": [
   {
    "en": "Kill the run halfway with Ctrl+C and start it again. Nothing should stay in progress and nothing should be decided twice.",
    "zh": "运行到一半按 Ctrl+C 打断，再启动。不该有理赔停在处理中，也不该有理赔被决定两次。"
   },
   {
    "en": "Add a limit on how many sections one helper may read.",
    "zh": "给每个助手能读的手册部分数加一个上限。"
   }
  ],
  "pkg": {
   "dir": "packages/ai-fde/09-agent-that-works-the-queue",
   "files": [
    "README.txt",
    "requirements.txt",
    "env.example",
    "final/data/claims.json",
    "final/data/manual.json",
    "final/data/policies.json",
    "final/desk_queue.py",
    "final/fake_model.py",
    "final/run_queue.py",
    "starter/desk_queue.py",
    "starter/fake_model.py",
    "starter/run_queue.py"
   ],
   "note": {
    "en": "Try it first with DRY_RUN=1 python run_queue.py --limit 5 --break C003 inside final/. starter/ has the same data files as final/.",
    "zh": "先在 final/ 里试 DRY_RUN=1 python run_queue.py --limit 5 --break C003。starter/ 的数据文件与 final/ 相同。"
   }
  },
  "solution": {
   "en": "The finished version is in the final/ folder. Open it after you have tried it yourself and compare your work with it, starting with desk_queue.py, run_queue.py and the retry rule. Do not copy it: check that yours does the same jobs, then note one place where the reference chose differently and decide which you prefer.",
   "zh": "完成版在 final/ 文件夹里。先自己做，再打开它与你的作品对照，从desk_queue.py、run_queue.py、重试规则看起。不要照抄：先看你的是否完成同样的事，再找出一处参考版做法不同的地方，判断你更喜欢哪种。"
  }
 },
 "12-scoreboard-for-the-agent.html": {
  "goal": {
   "en": "Turn “is the new version better?” from an argument into numbers kept for every run.",
   "zh": "把“新版本更好吗？”从争论变成每次运行都留存的数字。"
  },
  "deliver": {
   "en": "A scoreboard service: a held-out set, saved runs, a start route and a comparison of two runs (scoreboard.py, app.py).",
   "zh": "一个计分板服务：留出的测试集、保存的每次运行、启动接口，以及两次运行的对比（scoreboard.py、app.py）。"
  },
  "level": 2,
  "mins": 45,
  "accept": {
   "en": [
    "data/held_out_ids.json lists 10 claim ids and stays the same on every run.",
    "POST /evaluations answers 201 with agreement, mistake_cost_sgd, straight_through, kappa, and cost and seconds per claim.",
    "Every run is its own file in runs/, and GET /evaluations lists them.",
    "A second POST while one runs answers 409 'an evaluation is already running'.",
    "compare_runs.py prints better, same or WORSE for each number."
   ],
   "zh": [
    "data/held_out_ids.json 列出 10 个理赔编号，每次运行都不变。",
    "POST /evaluations 返回 201，含 agreement、mistake_cost_sgd、straight_through、kappa，以及每个理赔的成本和秒数。",
    "每次运行各有一个 runs/ 文件，GET /evaluations 把它们列出来。",
    "运行期间再次 POST 返回 409 “an evaluation is already running”。",
    "compare_runs.py 对每个数字打印 better、same 或 WORSE。"
   ]
  },
  "fail": [
   {
    "en": "A second start while one is running answers 409 “an evaluation is already running”. That is the lock working.",
    "zh": "有一次评估在跑时再启动，会返回 409“an evaluation is already running”。这正是锁在起作用。"
   },
   {
    "en": "The held-out claims were used to tune the prompt, so the score proves nothing. Tune on the other claims only.",
    "zh": "用留出的理赔去调提示词，分数就没意义了。只能用其余的理赔来调。"
   },
   {
    "en": "Waiting for a handler’s sign-off is counted as agent time. Tag it human_wait and leave it out.",
    "zh": "把等理赔员签字的时间算成了智能体用时。把它标成 human_wait 并排除。"
   }
  ],
  "stretch": [
   {
    "en": "Add a new number to the scoreboard and to the better/worse table.",
    "zh": "给计分板和好坏对比表加一个新的数字。"
   },
   {
    "en": "Run the evaluation in the background instead of making the request wait.",
    "zh": "让评估在后台运行，而不是让请求一直等着。"
   }
  ],
  "pkg": {
   "dir": "packages/ai-fde/12-scoreboard-for-the-agent",
   "files": [
    "README.txt",
    "requirements.txt",
    "env.example",
    "final/answer_key/handler_decisions.json",
    "final/app.py",
    "final/bench.py",
    "final/compare_runs.py",
    "final/data/claims.json",
    "final/data/policies.json",
    "final/data/policy_wording.txt",
    "final/data/wording_sections.json",
    "final/fake_model.py",
    "final/scoreboard.py",
    "final/scoring.py",
    "starter/app.py",
    "starter/bench.py",
    "starter/compare_runs.py",
    "starter/fake_model.py",
    "starter/scoreboard.py",
    "starter/scoring.py"
   ],
   "note": {
    "en": "Start with DRY_RUN=1 flask --app app run --port 5000 inside final/ to test with no key. starter/ has the same data files as final/.",
    "zh": "在 final/ 里用 DRY_RUN=1 flask --app app run --port 5000 启动，不需要密钥。starter/ 的数据文件与 final/ 相同。"
   }
  },
  "solution": {
   "en": "The finished version is in the final/ folder. Open it after you have tried it yourself and compare your work with it, starting with scoring.py, scoreboard.py and compare_runs.py. Do not copy it: check that yours does the same jobs, then note one place where the reference chose differently and decide which you prefer.",
   "zh": "完成版在 final/ 文件夹里。先自己做，再打开它与你的作品对照，从scoring.py、scoreboard.py、compare_runs.py看起。不要照抄：先看你的是否完成同样的事，再找出一处参考版做法不同的地方，判断你更喜欢哪种。"
  }
 },
 "15-agent-that-remembers-customers.html": {
  "goal": {
   "en": "Build a returning-customer flow with three data sources, each with its own owner and its own rule.",
   "zh": "做一个回头客流程：三个数据来源，各有各的负责人和规则。"
  },
  "deliver": {
   "en": "desk.py with records, memory and read-only reference data, notes written after each claim and shown to the handler.",
   "zh": "desk.py：包含记录、记忆和只读的参考数据，每份理赔后写笔记，并展示给理赔员。"
  },
  "level": 2,
  "mins": 40,
  "accept": {
   "en": [
    "After a run, three SQLite files exist: claims.db, memory.db and reference.db.",
    "The second claim (C042) reads the note the first (C041) wrote, and its reason says a note was used (1 note read).",
    "show_claim prints the decision, the reason and every note the agent read.",
    "Writing to reference.db fails with 'attempt to write a readonly database'.",
    "python reset.py clears the notes so the next demo starts clean."
   ],
   "zh": [
    "运行之后存在三个 SQLite 文件：claims.db、memory.db 和 reference.db。",
    "第二个理赔（C042）读到了第一个（C041）写下的备注，理由里说明用了备注（读了 1 条）。",
    "show_claim 打印决定、理由和智能体读过的每条备注。",
    "写入 reference.db 失败，提示 “attempt to write a readonly database”。",
    "python reset.py 清除备注，下一次演示从头开始。"
   ]
  },
  "fail": [
   {
    "en": "“reference.db is missing”: run make_reference.py once first, because the read-only connection needs the file to exist.",
    "zh": "“reference.db is missing”：先运行一次 make_reference.py，因为只读连接要求文件已存在。"
   },
   {
    "en": "The second claim read no notes. Notes are keyed by customer id, so check both claims use the same one.",
    "zh": "第二份理赔没读到笔记。笔记按客户编号存放，检查两份理赔用的是不是同一个。"
   },
   {
    "en": "Old notes confuse a new demo. Run reset.py to start with an empty queue.",
    "zh": "旧笔记会干扰新的演示。运行 reset.py，从空队列开始。"
   }
  ],
  "stretch": [
   {
    "en": "Make notes expire after 90 days and skip expired ones.",
    "zh": "让笔记 90 天后过期，并跳过过期的笔记。"
   },
   {
    "en": "Print a note’s source claim next to it on the handler’s page.",
    "zh": "在理赔员页面上，把每条笔记的来源理赔显示在旁边。"
   }
  ],
  "pkg": {
   "dir": "packages/ai-fde/15-agent-that-remembers-customers",
   "files": [
    "README.txt",
    "requirements.txt",
    "env.example",
    "final/desk.py",
    "final/make_reference.py",
    "final/reset.py",
    "starter/desk.py",
    "starter/make_reference.py",
    "starter/reset.py"
   ],
   "note": {
    "en": "Run python make_reference.py, then DRY_RUN=1 python desk.py inside final/. There is no data folder: the demo claims are in desk.py.",
    "zh": "在 final/ 里先运行 python make_reference.py，再运行 DRY_RUN=1 python desk.py。没有数据文件夹：示例理赔写在 desk.py 里。"
   }
  },
  "solution": {
   "en": "The finished version is in the final/ folder. Open it after you have tried it yourself and compare your work with it, starting with desk.py, make_reference.py and reset.py. Do not copy it: check that yours does the same jobs, then note one place where the reference chose differently and decide which you prefer.",
   "zh": "完成版在 final/ 文件夹里。先自己做，再打开它与你的作品对照，从desk.py、make_reference.py、reset.py看起。不要照抄：先看你的是否完成同样的事，再找出一处参考版做法不同的地方，判断你更喜欢哪种。"
  }
 },
 "18-swarm-with-a-cap.html": {
  "goal": {
   "en": "Start a dispatch from the dashboard, choose how many agents work at once, and see each claim’s progress.",
   "zh": "在看板上启动一次派发，选择同时有几个智能体工作，并看到每份理赔的进度。"
  },
  "deliver": {
   "en": "A FastAPI service (service.py) with a validated cap, one dispatch at a time, a run panel and summary read from records, and cost and time per claim.",
   "zh": "一个 FastAPI 服务（service.py）：有经过校验的上限、同一时间只跑一次派发、从记录读取的运行面板和总结，以及每份理赔的成本与用时。"
  },
  "level": 3,
  "mins": 45,
  "accept": {
   "en": [
    "python try_dispatcher.py prints 3 agents, 10 agents and 25 agents with the time falling (about 8.6, 3.2, 1.5 seconds) and {'done': 25} each time.",
    "A cap below 1 or above 25 (for example {\"n\": 0} or {\"n\": 26}) answers 422 before any agent starts.",
    "Pressing start twice answers 409 'A dispatch is already running.'",
    "The panel and a page reload show the same rows, and the five summary groups add up to 25 claims.",
    "With the service stopped, the saved page disables the button and says why."
   ],
   "zh": [
    "python try_dispatcher.py 打印 3、10、25 个智能体，用时递减（约 8.6、3.2、1.5 秒），每次都是 {'done': 25}。",
    "上限小于 1 或大于 25（例如 {\"n\": 0}、{\"n\": 26}）时，在任何智能体启动前返回 422。",
    "连按两次开始，第二次返回 409 “A dispatch is already running.”。",
    "面板和刷新后的页面显示相同的行，五组汇总加起来是 25 个理赔。",
    "服务停止后，保存的页面把按钮置灰并说明原因。"
   ]
  },
  "fail": [
   {
    "en": "Many claims show failed. You are hitting the provider’s rate limit, so lower the cap.",
    "zh": "很多理赔显示 failed。你撞上了服务商的速率限制，把上限调低。"
   },
   {
    "en": "The summary and the table disagree because a model wrote the summary. Count it from the rows instead.",
    "zh": "总结和表格对不上，因为总结是模型写的。改成从记录里数。"
   },
   {
    "en": "Two dispatches overlap and their numbers mix. Keep one current run and refuse a second start.",
    "zh": "两次派发重叠，数字混在一起。只保留一个当前运行，拒绝第二次启动。"
   }
  ],
  "stretch": [
   {
    "en": "Compare the run time and cost of caps 3, 10 and 25 using /runs/<run>/totals.",
    "zh": "用 /runs/<run>/totals 比较上限 3、10、25 的运行时间和成本。"
   },
   {
    "en": "Add a Stop button that lets running claims finish and starts no new ones.",
    "zh": "加一个停止按钮：让正在跑的理赔跑完，不再启动新的。"
   }
  ],
  "pkg": {
   "dir": "packages/ai-fde/18-swarm-with-a-cap",
   "files": [
    "README.txt",
    "requirements.txt",
    "env.example",
    "final/data/claims.json",
    "final/data/policies.json",
    "final/data/policy_wording.txt",
    "final/desk.py",
    "final/dispatcher.py",
    "final/fake_model.py",
    "final/service.py",
    "final/try_dispatcher.py",
    "starter/desk.py",
    "starter/dispatcher.py",
    "starter/fake_model.py",
    "starter/service.py",
    "starter/try_dispatcher.py"
   ],
   "note": {
    "en": "Run python try_dispatcher.py first (no key), then DRY_RUN=1 uvicorn service:app inside final/. starter/ has the same data files as final/.",
    "zh": "先运行 python try_dispatcher.py（不需要密钥），再在 final/ 里运行 DRY_RUN=1 uvicorn service:app。starter/ 的数据文件与 final/ 相同。"
   }
  },
  "solution": {
   "en": "The finished version is in the final/ folder. Open it after you have tried it yourself and compare your work with it, starting with dispatcher.py, service.py and try_dispatcher.py. Do not copy it: check that yours does the same jobs, then note one place where the reference chose differently and decide which you prefer.",
   "zh": "完成版在 final/ 文件夹里。先自己做，再打开它与你的作品对照，从dispatcher.py、service.py、try_dispatcher.py看起。不要照抄：先看你的是否完成同样的事，再找出一处参考版做法不同的地方，判断你更喜欢哪种。"
  }
 },
 "20-improver-a-human-approves.html": {
  "goal": {
   "en": "Let a second agent suggest improvements, with a person saying yes and code deciding what stays.",
   "zh": "让另一个智能体提出改进，由人点头，由代码决定哪些保留。"
  },
  "deliver": {
   "en": "Numbered configuration versions, an improver that proposes one change at a time, approve and reject routes, and a Configuration page (improver.py, config_app.py).",
   "zh": "带编号的配置版本、每次只提一个改动的改进者、批准与拒绝的接口，以及配置页面（improver.py、config_app.py）。"
  },
  "level": 3,
  "mins": 50,
  "accept": {
   "en": [
    "POST /rounds answers 201 {\"version\": 2}; version 2 shows as 'proposed', one field changed, approved by nobody, and the agent still runs version 1.",
    "A second POST /rounds while one is open answers 409 'a round is already open'.",
    "After a named person approves, code runs the held-out claims and the result is kept or rolled_back.",
    "A version is kept only if it is no worse and better on at least one number.",
    "POST /versions/2/use on a rolled-back version answers 400; rejecting changes nothing else."
   ],
   "zh": [
    "POST /rounds 返回 201 {\"version\": 2}；版本 2 显示为 “proposed”，改了一个字段，无人批准，智能体仍运行版本 1。",
    "已有一轮未结束时再 POST /rounds，返回 409 “a round is already open”。",
    "指定的人批准后，代码在留出的理赔上运行，结果为 kept 或 rolled_back。",
    "一个版本只有在不更差且至少一个数字更好时才被保留。",
    "对已回滚的版本调用 POST /versions/2/use 返回 400；拒绝则其余一切不变。"
   ]
  },
  "fail": [
   {
    "en": "The improver changed two fields at once. Code must refuse a proposal that is not exactly one of instructions, model or effort.",
    "zh": "改进者一次改了两个字段。代码必须拒绝不是恰好改一个字段（指令、模型或推理强度）的提议。"
   },
   {
    "en": "A recipe edit removed the step that waits for a person. The code refuses a recipe without “wait for a person”.",
    "zh": "一次食谱修改删掉了等人批准的那一步。代码会拒绝没有“wait for a person”的食谱。"
   },
   {
    "en": "Your gateway names the reasoning-effort setting differently. Change extra_body in run_config.",
    "zh": "你的网关对推理强度的叫法不同。改 run_config 里的 extra_body。"
   }
  ],
  "stretch": [
   {
    "en": "Add a third number to the keep rule, such as cost per claim.",
    "zh": "给保留规则加第三个数字，比如每份理赔的成本。"
   },
   {
    "en": "Show on the Configuration page which version each run used.",
    "zh": "在配置页面上显示每次运行用的是哪个版本。"
   }
  ],
  "pkg": {
   "dir": "packages/ai-fde/20-improver-a-human-approves",
   "files": [
    "README.txt",
    "requirements.txt",
    "env.example",
    "final/answer_key/handler_decisions.json",
    "final/bench.py",
    "final/config_app.py",
    "final/data/claims.json",
    "final/data/policies.json",
    "final/data/policy_wording.txt",
    "final/data/wording_sections.json",
    "final/fake_model.py",
    "final/improver.py",
    "final/recipe_cli.py",
    "final/scoreboard.py",
    "final/scoring.py",
    "final/versions.py",
    "starter/bench.py",
    "starter/config_app.py",
    "starter/fake_model.py",
    "starter/improver.py",
    "starter/recipe_cli.py",
    "starter/scoreboard.py",
    "starter/scoring.py",
    "starter/versions.py"
   ],
   "note": {
    "en": "Run DRY_RUN=1 flask --app config_app run --port 5001 inside final/. In a dry run no change is better, so version 2 is rolled back, which is the rule working. starter/ has the same data files as final/.",
    "zh": "在 final/ 里运行 DRY_RUN=1 flask --app config_app run --port 5001。试运行里没有任何改动会更好，所以第 2 版被退回，这正是规则在起作用。starter/ 的数据文件与 final/ 相同。"
   }
  },
  "solution": {
   "en": "The finished version is in the final/ folder. Open it after you have tried it yourself and compare your work with it, starting with improver.py, versions.py and config_app.py. Do not copy it: check that yours does the same jobs, then note one place where the reference chose differently and decide which you prefer.",
   "zh": "完成版在 final/ 文件夹里。先自己做，再打开它与你的作品对照，从improver.py、versions.py、config_app.py看起。不要照抄：先看你的是否完成同样的事，再找出一处参考版做法不同的地方，判断你更喜欢哪种。"
  }
 },
 "25-the-handover-copilot.html": {
  "goal": {
   "en": "Build a copilot that handlers ask in plain English, then check the pilot’s goals and tear it all down.",
   "zh": "做一个理赔员能用日常语言提问的助手，然后检查试点的目标，并把一切拆除。"
  },
  "deliver": {
   "en": "A sidebar copilot that acts as the signed-in handler, asks before paying, logs every step, and a handover check (copilot_*.py, copilot.js, criteria.py, handover.py).",
   "zh": "一个侧边栏助手：以登录的理赔员身份行事，付款前先问，记录每一步，再加一份交接检查（copilot_*.py、copilot.js、criteria.py、handover.py）。"
  },
  "level": 3,
  "mins": 60,
  "accept": {
   "en": [
    "python try_it.py prints False, True, the path for Aisha, a confirm for 'Pay S$300 on C007?', and a refusal line.",
    "As Aisha, 'pay C007 300' shows a Confirm button and pays only after you press it.",
    "As the junior handler, 'pay C008 1200' is refused and no Confirm button appears; a hand-made POST to /copilot/confirm is refused too.",
    "Each tool call shows as a readable step, and each handler sees only their own history.",
    "python criteria.py prints met, met, not measured; 'not measured' is never counted as a pass."
   ],
   "zh": [
    "python try_it.py 打印 False、True、Aisha 的路径、“Pay S$300 on C007?” 的确认，以及一行拒绝。",
    "以 Aisha 身份输入 “pay C007 300” 会出现确认按钮，按下之后才付款。",
    "以初级处理员身份输入 “pay C008 1200” 被拒绝，不出现确认按钮；手工构造的 /copilot/confirm 请求同样被拒绝。",
    "每次工具调用显示为一个可读的步骤，每位处理员只看到自己的历史。",
    "python criteria.py 打印 met、met、not measured；“not measured” 从不算通过。"
   ]
  },
  "fail": [
   {
    "en": "The copilot can pay by itself because the model could pass confirmed=True. Confirmation must go through a separate route that only the handler’s click calls.",
    "zh": "助手能自己付款，因为模型可以传 confirmed=True。确认必须走一条单独的路径，只有理赔员的点击才能调用。"
   },
   {
    "en": "The copilot uses its own powers instead of the handler’s. Every call must carry the handler’s token, and the service must check it too.",
    "zh": "助手用了自己的权限而不是理赔员的。每次调用都要带理赔员的令牌，服务端也要再检查一次。"
   },
   {
    "en": "ConnectionError in the step log: the stand-in gateway is not running on port 5001.",
    "zh": "步骤日志里出现 ConnectionError：占位网关没有在 5001 端口运行。"
   }
  ],
  "stretch": [
   {
    "en": "Add a seventh tool that lists the claims waiting for sign-off.",
    "zh": "加第七个工具，列出等待签字的理赔。"
   },
   {
    "en": "Write your own success criteria on day one for the next project and check them at the end.",
    "zh": "为下一个项目在第一天写好自己的成功标准，并在最后检查。"
   }
  ],
  "pkg": {
   "dir": "packages/ai-fde/25-the-handover-copilot",
   "files": [
    "README.txt",
    "requirements.txt",
    "env.example",
    "final/context/claim_rules.json",
    "final/context/glossary.json",
    "final/context/manual.json",
    "final/context/plans.json",
    "final/copilot.js",
    "final/copilot_agent.py",
    "final/copilot_api.py",
    "final/copilot_log.py",
    "final/copilot_tools.py",
    "final/criteria.py",
    "final/data/claims.json",
    "final/handover.py",
    "final/measured.json",
    "final/mock_gateway.py",
    "final/permissions.py",
    "final/pilot_notes.txt",
    "final/try_it.py",
    "starter/copilot.js",
    "starter/copilot_agent.py",
    "starter/copilot_api.py",
    "starter/copilot_log.py",
    "starter/copilot_tools.py",
    "starter/criteria.py",
    "starter/handover.py",
    "starter/mock_gateway.py",
    "starter/permissions.py",
    "starter/try_it.py"
   ],
   "note": {
    "en": "Start mock_gateway.py on port 5001 and DRY_RUN=1 flask --app copilot_api run --port 5000 inside final/. The teardown check needs the AWS command line and is optional. starter/ has the same data files as final/.",
    "zh": "在 final/ 里先在 5001 端口启动 mock_gateway.py，再运行 DRY_RUN=1 flask --app copilot_api run --port 5000。拆除检查需要 AWS 命令行，可选。starter/ 的数据文件与 final/ 相同。"
   }
  },
  "solution": {
   "en": "The finished version is in the final/ folder. Open it after you have tried it yourself and compare your work with it, starting with permissions.py, copilot_tools.py and criteria.py. Do not copy it: check that yours does the same jobs, then note one place where the reference chose differently and decide which you prefer.",
   "zh": "完成版在 final/ 文件夹里。先自己做，再打开它与你的作品对照，从permissions.py、copilot_tools.py、criteria.py看起。不要照抄：先看你的是否完成同样的事，再找出一处参考版做法不同的地方，判断你更喜欢哪种。"
  }
 }
});
