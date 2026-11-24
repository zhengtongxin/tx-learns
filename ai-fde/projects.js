/* Project card data for each project lesson, shown by assets/site.js. Shape: window.PROJECTS[file]={goal,deliver,level:1-3,mins,accept:[{en,zh}],fail:[],stretch:[],pkg:{dir:"packages/<track>/<name>",files:[...],note}} (goal, deliver and list items are {en,zh}) */
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
  "accept": [
   {
    "en": "Every claim ends in exactly one state: waiting, in progress, waiting for sign-off or decided.",
    "zh": "每份理赔最终只处于一种状态：等待、处理中、等待签字或已决定。"
   },
   {
    "en": "Any approval over S$800 and every refer waits for sign-off. None of them shows as decided.",
    "zh": "超过 S$800 的批准和所有转交都停在等待签字，没有一个直接变成已决定。"
   },
   {
    "en": "The run ends with the line “agrees with handlers on N of M claims”.",
    "zh": "运行结束时会打印“agrees with handlers on N of M claims”这一行。"
   },
   {
    "en": "Only the scoring code opens the answer_key folder. The agent never does.",
    "zh": "只有打分代码会打开 answer_key 文件夹，智能体从不读它。"
   }
  ],
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
  "accept": [
   {
    "en": "The bar is written in numbers in the code before any model runs.",
    "zh": "在任何模型运行之前，及格线已经用数字写进代码。"
   },
   {
    "en": "Each candidate runs all claims twice and gets one row: accuracy by difficulty, cost per 1,000 claims, seconds per claim, wrong big approvals.",
    "zh": "每个候选模型把全部理赔跑两遍，得到一行：按难度的准确率、每 1,000 份的成本、每份用时、错误的大额批准数。"
   },
   {
    "en": "A model counts as clearing the bar only if it passes every line of it.",
    "zh": "只有通过及格线上的每一条，模型才算过关。"
   },
   {
    "en": "The program prints the cheapest model that clears the bar, a fallback, and the memo with real numbers filled in.",
    "zh": "程序打印出过关的最便宜模型、备用模型，以及填好真实数字的说明。"
   }
  ],
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
  "accept": [
   {
    "en": "python run_queue.py --limit 5 works five claims and prints the to-do list by state.",
    "zh": "python run_queue.py --limit 5 处理五份理赔，并按状态打印待办清单。"
   },
   {
    "en": "todo.json shows each claim as to_do, in_progress, done or for_handler, and nothing is left in progress.",
    "zh": "todo.json 里每份理赔都是 to_do、in_progress、done 或 for_handler，没有一份停在处理中。"
   },
   {
    "en": "A claim that fails goes back once, then is left for a handler. The rest of the run carries on.",
    "zh": "失败的理赔退回一次，再失败就留给理赔员，其余的继续跑。"
   },
   {
    "en": "Each claim’s read list shows which manual sections the helper opened.",
    "zh": "每份理赔的 read 列表显示助手打开过手册的哪些部分。"
   }
  ],
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
  "accept": [
   {
    "en": "data/held_out_ids.json lists 10 claim ids and stays the same on every run.",
    "zh": "data/held_out_ids.json 列出 10 个理赔编号，每次运行都不变。"
   },
   {
    "en": "POST /evaluations answers 201 with agreement, mistake cost in S$, straight-through rate, kappa, and cost and seconds per claim.",
    "zh": "POST /evaluations 返回 201，带着一致率、以 S$ 计的错误代价、直通率、kappa，以及每份理赔的成本和用时。"
   },
   {
    "en": "Every run is its own file in runs/, and GET /evaluations lists them.",
    "zh": "每次运行都是 runs/ 里的一个独立文件，GET /evaluations 能列出它们。"
   },
   {
    "en": "compare_runs.py says better, same or WORSE for each number.",
    "zh": "compare_runs.py 对每个数字说明更好、相同或更差。"
   }
  ],
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
  "accept": [
   {
    "en": "Three SQLite files exist after a run: claims.db, memory.db and reference.db.",
    "zh": "运行之后有三个 SQLite 文件：claims.db、memory.db 和 reference.db。"
   },
   {
    "en": "The second claim from the same customer reads the note the first one wrote.",
    "zh": "同一位客户的第二份理赔会读到第一份留下的笔记。"
   },
   {
    "en": "show_claim prints the decision, the reason and every note the agent read.",
    "zh": "show_claim 打印决定、理由，以及智能体读过的每条笔记。"
   },
   {
    "en": "Writing to reference.db fails with “attempt to write a readonly database”.",
    "zh": "写 reference.db 会失败，报“attempt to write a readonly database”。"
   }
  ],
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
  "accept": [
   {
    "en": "A cap below 1 or above 25 is refused before any agent starts.",
    "zh": "低于 1 或高于 25 的上限，会在任何智能体启动前被拒绝。"
   },
   {
    "en": "Pressing start twice answers 409 with a clear message.",
    "zh": "连按两次开始，第二次返回 409 和清楚的提示。"
   },
   {
    "en": "The panel and a page reload show the same rows, and the summary adds up to all claims.",
    "zh": "面板和刷新后的页面显示同样的行，总结加起来等于全部理赔。"
   },
   {
    "en": "With the service stopped, the saved page disables the button and says why.",
    "zh": "服务停掉后，保存下来的页面会禁用按钮并说明原因。"
   }
  ],
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
  "accept": [
   {
    "en": "POST /rounds creates version 2 as “proposed” and the agent keeps running version 1.",
    "zh": "POST /rounds 创建状态为“proposed”的第 2 版，智能体仍运行第 1 版。"
   },
   {
    "en": "A second POST /rounds while one is open answers 409.",
    "zh": "已有一轮未结束时再次 POST /rounds，返回 409。"
   },
   {
    "en": "After a named person approves, code runs the held-out claims and marks the version kept or rolled_back.",
    "zh": "有人署名批准后，由代码跑留出的理赔，并把这一版标为 kept 或 rolled_back。"
   },
   {
    "en": "Rejecting changes nothing, and only a kept version can be put back in use.",
    "zh": "拒绝不会改变任何东西，而且只有 kept 的版本才能重新启用。"
   }
  ],
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
  "accept": [
   {
    "en": "“pay C007 300” as Aisha shows a Confirm button and pays only after you press it.",
    "zh": "以 Aisha 的身份说“pay C007 300”，会出现确认按钮，按下之后才付款。"
   },
   {
    "en": "As the junior handler, “pay C008 1200” is refused and no Confirm button appears.",
    "zh": "以初级理赔员的身份说“pay C008 1200”会被拒绝，也不会出现确认按钮。"
   },
   {
    "en": "Each tool call shows up as a readable step, and each handler sees only their own history.",
    "zh": "每次工具调用都显示成可读的一步，每位理赔员只看到自己的历史。"
   },
   {
    "en": "criteria.py reports each goal as met, NOT met or not measured. Not measured is never a pass.",
    "zh": "criteria.py 把每个目标报告为 met、NOT met 或 not measured。未测量绝不算通过。"
   }
  ],
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
  }
 }
});
