/* Project card data for each project lesson, shown by assets/site.js. Shape: window.PROJECTS[file]={goal,deliver,level:1-3,mins,accept:[{en,zh}],fail:[],stretch:[],pkg:{dir:"packages/<track>/<name>",files:[...],note}} (goal, deliver and list items are {en,zh}) */
window.PROJECTS=window.PROJECTS||{};

window.PROJECTS["03-stall-brochure-maker.html"]={
  goal:{en:"Turn a shop's web address into a short brochure with two chained model calls.",zh:"用两次串联的模型调用，把一家店的网址变成一份简短的宣传册。"},
  deliver:{en:"A script that takes a web address and prints a markdown brochure, with an optional streaming mode.",zh:"一个脚本：输入网址，输出 markdown 宣传册，还可以选择边生成边显示。"},
  level:1,mins:25,
  accept:[
    {en:"python test_offline.py in final/ prints an ok line and needs no key.",zh:"在 final/ 里运行 python test_offline.py，打印 ok，不需要密钥。"},
    {en:"On a small shop site with an About page, the script prints a markdown brochure with a heading and a short body.",zh:"对一个有“关于我们”页的小店网站，脚本打印出带标题和简短正文的 markdown 宣传册。"},
    {en:"Changing one sentence of the brochure prompt (warm to funny) visibly changes the tone.",zh:"改掉宣传册提示词里的一句话（温暖改成幽默），语气明显变了。"},
    {en:"With --stream the words appear as they arrive, not all at once.",zh:"加上 --stream，文字是边生成边出现，而不是一次全出来。"}],
  fail:[
    {en:"A site that blocks scrapers or draws itself with JavaScript gives a 403 or a nearly empty brochure. That is a limit of the simple fetch helper.",zh:"拦截爬虫或靠 JavaScript 绘制的网站，会得到 403 或几乎空白的宣传册。这是简单抓取函数的局限。"},
    {en:"The picked links come back as a JSON string. Forgetting json.loads gives a type error.",zh:"挑出的链接是 JSON 字符串。忘了 json.loads 就会报类型错误。"},
    {en:"Pasting a whole site into one prompt hits the length limit. Pick pages first, then cut the text.",zh:"把整个网站塞进一个提示词会超长。先选页面，再截断文字。"}],
  stretch:[
    {en:"Make a brochure for a business you know.",zh:"为你熟悉的一家店做一份宣传册。"},
    {en:"Swap in a local model and note what gets worse (the JSON links are a good place to look).",zh:"换成本地模型，看看哪里变差（JSON 链接最值得看）。"}],
  pkg:{dir:"packages/ai-engineer/03-stall-brochure-maker",
    files:["README.txt","requirements.txt","env.example","final/brochure.py","final/test_offline.py","starter/brochure.py","starter/test_offline.py"],
    note:{en:"Runs with a model API key. Copy env.example to .env first. Read README.txt for install, run and clean-up steps.",zh:"需要模型 API 密钥。先把 env.example 复制成 .env。安装、运行和清理步骤见 README.txt。"}}};

window.PROJECTS["07-shop-assistant-that-acts.html"]={
  goal:{en:"Join a chat model, a database, a picture and a voice into one desk assistant that acts.",zh:"把聊天模型、数据库、图片和语音合成一个会动手的柜台助手。"},
  deliver:{en:"A Gradio screen where you ask about coach trip prices, the assistant looks them up, draws a picture and speaks the reply.",zh:"一个 Gradio 界面：你问旅游巴士的价格，助手去查库、画一张图，并把回答读出来。"},
  level:1,mins:30,
  accept:[
    {en:"python test_tools.py in final/ prints an ok line and needs no key.",zh:"在 final/ 里运行 python test_tools.py，打印 ok，不需要密钥。"},
    {en:"Asking about two places prints two tool call lines and the reply gives both prices from the database.",zh:"问两个地点，终端打印两行 tool call，回答里给出数据库中的两个价格。"},
    {en:"A picture appears only after a lookup. A message like Say hello draws nothing.",zh:"只有查过价格才会出图。像“Say hello”这样的消息不会画图。"},
    {en:"The reply is also spoken aloud.",zh:"回答同时会被读出来。"}],
  fail:[
    {en:"Every tool call needs its own tool message with the same id. Missing one gives an API error.",zh:"每个工具调用都要回一条带相同 id 的 tool 消息。漏掉一条会报 API 错误。"},
    {en:"Drawing a picture on every message is slow and costs money. Draw only when a tool looked something up.",zh:"每条消息都画图又慢又花钱。只在工具查过东西时才画。"},
    {en:"One callback that does everything fights over the history list. Split adding the user message from getting the answer.",zh:"一个回调包办一切会和历史列表打架。把“加入用户消息”和“获取回答”拆开。"}],
  stretch:[
    {en:"Add a book-a-trip tool that writes a row in a second table.",zh:"加一个“订座”工具，往第二张表里写一行。"},
    {en:"Replace the database with a CSV and see what changes.",zh:"把数据库换成 CSV，看看有什么变化。"}],
  pkg:{dir:"packages/ai-engineer/07-shop-assistant-that-acts",
    files:["README.txt","requirements.txt","env.example","final/assistant.py","final/test_tools.py","starter/assistant.py","starter/test_tools.py"],
    note:{en:"Needs a model API key with credit. Pictures and voice are paid calls. Read README.txt for the cost note.",zh:"需要有额度的模型 API 密钥。图片和语音是收费调用。费用说明见 README.txt。"}}};

window.PROJECTS["10-meeting-minutes-writer.html"]={
  goal:{en:"Chain two open models, ears then brain, to turn a recording into meeting minutes.",zh:"把两个开源模型串起来：先听、再写，把录音变成会议纪要。"},
  deliver:{en:"A script that turns an audio file or a transcript into minutes with a summary, decisions and action items.",zh:"一个脚本：把音频或文字稿变成含摘要、决定和待办事项的纪要。"},
  level:2,mins:25,
  accept:[
    {en:"python test_split.py in final/ prints an ok line with no GPU.",zh:"在 final/ 里运行 python test_split.py，不需要 GPU，打印 ok。"},
    {en:"On a GPU, the sample transcript streams out minutes with a summary, decisions and action items with owners.",zh:"在有 GPU 的机器上，示例文字稿会流式输出含摘要、决定和负责人待办的纪要。"},
    {en:"With --long, a long transcript is chunked, each part summarised, then the summaries are summarised.",zh:"加上 --long，长文字稿会先分块、逐块总结，再对总结做总结。"},
    {en:"Names listed in the prompt come out spelled correctly in the minutes.",zh:"提示词里列出的名字，在纪要里拼写正确。"}],
  fail:[
    {en:"An empty transcript usually means a wrong audio format or sampling rate, or ffmpeg missing.",zh:"文字稿为空，通常是音频格式或采样率不对，或者没装 ffmpeg。"},
    {en:"A long recording overflows the context window and the minutes only cover the start. Chunk it.",zh:"长录音超出上下文窗口，纪要只覆盖开头。要分块。"},
    {en:"CUDA out of memory means the chat model is too big for the GPU. Pick a smaller one.",zh:"CUDA 显存不足说明聊天模型对这块 GPU 太大。换小一点的。"}],
  stretch:[
    {en:"Record a two-minute chat with a friend and run it end to end.",zh:"录一段两分钟的闲聊，完整跑一遍。"},
    {en:"Add decisions and open questions sections to the prompt.",zh:"在提示词里加上“决定”和“未决问题”两个部分。"},
    {en:"Swap the chat model for a frontier API and compare the minutes.",zh:"把聊天模型换成云端大模型 API，对比纪要。"}],
  pkg:{dir:"packages/ai-engineer/10-meeting-minutes-writer",
    files:["README.txt","requirements.txt","env.example","final/minutes.py","final/sample_transcript.txt","final/test_split.py","starter/minutes.py","starter/sample_transcript.txt","starter/test_split.py"],
    note:{en:"Needs an NVIDIA GPU (a free cloud notebook GPU is enough). No per-call bill. The offline check runs anywhere.",zh:"需要 NVIDIA GPU（免费云端 notebook 的 GPU 就够）。没有按次计费。离线检查在任何电脑上都能跑。"}}};

window.PROJECTS["12-code-translator.html"]={
  goal:{en:"Turn slow Python into fast C++ with a model, and rank models by what actually runs.",zh:"用模型把慢的 Python 翻成快的 C++，并按“真正跑出来的结果”给模型排名。"},
  deliver:{en:"A script that asks each model on your shortlist for C++, compiles it, runs it, checks the output against Python and prints the speedup.",zh:"一个脚本：让候选名单里的每个模型写 C++，编译、运行、和 Python 的输出比对，再打印提速倍数。"},
  level:2,mins:30,
  accept:[
    {en:"python test_offline.py in final/ prints an ok line and needs no key.",zh:"在 final/ 里运行 python test_offline.py，打印 ok，不需要密钥。"},
    {en:"For each model the script prints one of: failed to compile, WRONG OUTPUT, or ok with a speedup.",zh:"对每个模型，脚本打印三种之一：编译失败、输出错误，或通过并显示提速倍数。"},
    {en:"A correct translation prints exactly the same two lines as hard_program.py.",zh:"正确的翻译，输出和 hard_program.py 的两行完全一致。"},
    {en:"Removing the optimisation flags from COMPILE shrinks the speedup a lot.",zh:"把 COMPILE 里的优化参数去掉，提速倍数明显变小。"}],
  fail:[
    {en:"Markdown fences left in main.cpp make the compiler choke. strip_fences must remove them.",zh:"main.cpp 里残留 markdown 围栏会让编译器报错。strip_fences 必须把它们去掉。"},
    {en:"A model uses 64-bit ints where the middle value needs more, so it prints a wrong hash with no error.",zh:"模型在中间值更大的地方用了 64 位整数，哈希结果悄悄算错，没有任何报错。"},
    {en:"g++ not found means the compiler is not installed.",zh:"提示找不到 g++，说明没装编译器。"}],
  stretch:[
    {en:"Port a loop you wrote to Rust or C++ and compare timings.",zh:"把你自己写的一个循环移植到 Rust 或 C++，比较耗时。"},
    {en:"Rank three models by speedup divided by cost.",zh:"按“提速倍数除以成本”给三个模型排名。"}],
  pkg:{dir:"packages/ai-engineer/12-code-translator",
    files:["README.txt","requirements.txt","env.example","final/translate.py","final/hard_program.py","final/test_offline.py","starter/translate.py","starter/hard_program.py","starter/test_offline.py"],
    note:{en:"Needs g++ and a model API key. The hard test program is invented and has a deliberate overflow trap.",zh:"需要 g++ 和模型 API 密钥。难度测试程序是虚构的，里面故意埋了整数溢出的坑。"}}};

window.PROJECTS["17-company-knowledge-helper.html"]={
  goal:{en:"Upgrade a basic retrieval chain with four fixes and prove each one with numbers.",zh:"用四个改进升级基础检索链，并用数字证明每一个都有效。"},
  deliver:{en:"A helper that answers from the council files, names the source files, and a test run that scores it per question type.",zh:"一个根据市政文件回答问题并标明来源文件的助手，以及一次按题型打分的测试。"},
  level:2,mins:35,
  accept:[
    {en:"python test_offline.py in final/ prints an ok line with no key and no model download.",zh:"在 final/ 里运行 python test_offline.py，不需要密钥也不用下载模型，打印 ok。"},
    {en:"After build, asking who handles lift repairs names Hafiz Rahman and ends with a Sources line.",zh:"build 之后，问谁负责修电梯，回答是 Hafiz Rahman，并以 Sources 一行结尾。"},
    {en:"The follow-up And her manager? works after a question about a person, because the question is rewritten first.",zh:"问完某个人后，追问“她的上司呢？”也能答对，因为问题先被改写了。"},
    {en:"python helper.py eval prints MRR and coverage per category for the basic chain and the full pipeline.",zh:"python helper.py eval 会按类别打印基础链和完整流程的 MRR 与覆盖率。"}],
  fail:[
    {en:"Changing the embedding model but keeping the old store gives rubbish results. Delete the store folders and rebuild.",zh:"换了向量模型却沿用旧的库，结果会是一团糟。删掉库文件夹重新构建。"},
    {en:"A follow-up with he or she finds nothing, because search only sees the latest question.",zh:"带“他/她”的追问搜不到东西，因为检索只看最新的一句。"},
    {en:"Rebuilding the slow model-made chunks on every start wastes time and money. Build once and reuse.",zh:"每次启动都重建用模型切块的库，既慢又花钱。只建一次，之后复用。"}],
  stretch:[
    {en:"Turn reranking off and compare the scores with it on.",zh:"关掉重排，对比开启时的分数。"},
    {en:"Try a smaller, cheaper model for reranking and check whether the scores hold.",zh:"用更小更便宜的模型做重排，看分数是否保持。"},
    {en:"Add a Sources line under each answer in your chat page.",zh:"在聊天页每个回答下面加一行 Sources。"}],
  pkg:{dir:"packages/ai-engineer/17-company-knowledge-helper",
    files:["README.txt","requirements.txt","env.example","final/helper.py","final/test_offline.py","final/tests.jsonl","final/council_files/staff/hafiz-rahman.txt","final/council_files/staff/grace-ng.txt","final/council_files/staff/siti-aminah.txt","final/council_files/services/lift-repairs.txt","final/council_files/services/bulky-waste.txt","final/council_files/services/hall-booking.txt","final/council_files/services/noticeboard.txt","final/council_files/notices/lift-servicing-notice.txt","starter/helper.py","starter/test_offline.py","starter/tests.jsonl"],
    note:{en:"Needs a model API key. The files are invented. The starter uses the same council_files folder and tests: copy them from final/.",zh:"需要模型 API 密钥。文件内容都是虚构的。starter 用同样的 council_files 文件夹和测试：从 final/ 复制过去。"}}};

window.PROJECTS["21-price-guesser.html"]={
  goal:{en:"Build a screen that guesses a gadget's price and shows each guesser's accuracy, cost and speed.",zh:"做一个估价界面，并展示每个预测器的准确度、成本和速度。"},
  deliver:{en:"A scoring table for the average, linear, forest and frontier guessers, plus a small screen where they can disagree.",zh:"一张给平均值、线性、森林和大模型预测器打分的表，加一个让它们各抒己见的小界面。"},
  level:3,mins:30,
  accept:[
    {en:"python test_offline.py in final/ prints an ok line and needs no key.",zh:"在 final/ 里运行 python test_offline.py，打印 ok，不需要密钥。"},
    {en:"python price_guesser.py table prints a row for each guesser, with average error, hit rate, cost and seconds.",zh:"python price_guesser.py table 为每个预测器打印一行：平均误差、命中率、成本和秒数。"},
    {en:"The order from worst to best is average, then linear, then forest.",zh:"从差到好的顺序是：平均值、线性、森林。"},
    {en:"A reply like About $120 maybe is parsed, and unreadable replies are counted instead of scored as zero.",zh:"像 About $120 maybe 这样的回复能被解析；读不出的回复会被计数，而不是当成零分。"}],
  fail:[
    {en:"A failed parse scored as zero makes the frontier model look terrible. Use a fallback and count the failures.",zh:"解析失败就当零分，会让大模型看起来很糟。要用备用值，并统计失败次数。"},
    {en:"FileNotFoundError for data/train.jsonl means make_data.py has not been run yet.",zh:"data/train.jsonl 找不到，说明还没运行 make_data.py。"},
    {en:"A model-not-found error means the model name was retired. Set FRONTIER_MODEL to a current one.",zh:"提示模型不存在，是模型名已下线。把 FRONTIER_MODEL 改成当前可用的。"}],
  stretch:[
    {en:"Add your own category of items and re-run the table.",zh:"加入你自己的商品类别，重新跑表。"},
    {en:"Run the frontier guesser three times and show the spread as a confidence band.",zh:"让大模型预测器跑三次，把差距当作置信区间显示出来。"},
    {en:"Write a rule for when a guess is good enough to act on.",zh:"定一条规则：什么时候一个估价好到可以据此行动。"}],
  pkg:{dir:"packages/ai-engineer/21-price-guesser",
    files:["README.txt","requirements.txt","env.example","final/price_guesser.py","final/make_data.py","final/test_offline.py","final/data/train.jsonl","final/data/test.jsonl","starter/price_guesser.py","starter/make_data.py","starter/test_offline.py"],
    note:{en:"The classic guessers need no key. A key is only for the frontier row. The listings are invented. The starter has its own copy of data/.",zh:"传统预测器不需要密钥，只有大模型那一行要。商品数据是虚构的。starter 里有自己的 data/ 副本。"}}};

window.PROJECTS["24-fine-tuned-price-guesser.html"]={
  goal:{en:"Fine-tune a small open model on price tags and test it honestly against the alternatives.",zh:"用价格标签微调一个小型开源模型，并和其他方案公平对比。"},
  deliver:{en:"A QLoRA training run and a comparison table: average error, cost per 1,000 guesses and seconds per guess for each contender.",zh:"一次 QLoRA 训练，以及一张对比表：每个选手的平均误差、每 1000 次猜测的成本和每次猜测的秒数。"},
  level:3,mins:30,
  accept:[
    {en:"python test_offline.py in final/ prints an ok line with no GPU and no key.",zh:"在 final/ 里运行 python test_offline.py，不需要 GPU 和密钥，打印 ok。"},
    {en:"prepare_data.py writes train, validation and test files once, and the same command gives the same split.",zh:"prepare_data.py 只生成一次训练、验证、测试文件，再运行得到同样的划分。"},
    {en:"On a GPU, train.py --subset 2000 finishes and the loss lines go down.",zh:"在 GPU 上，train.py --subset 2000 能跑完，损失值在下降。"},
    {en:"compare.py prints one row each for average, forest and tuned, scored on the same test set.",zh:"compare.py 为平均值、森林和微调模型各打印一行，都在同一个测试集上评分。"}],
  fail:[
    {en:"Scoring on data the model already saw makes the result look amazing. Split once and never touch the test set.",zh:"在模型见过的数据上评分，结果会好得离谱。只切分一次，绝不碰测试集。"},
    {en:"Validation loss rising while training loss falls means the model is memorising. Stop earlier.",zh:"验证损失上升而训练损失下降，说明模型在死记硬背。要早停。"},
    {en:"CUDA out of memory: use a smaller base model, a smaller batch or shorter descriptions.",zh:"CUDA 显存不足：换更小的底座模型、减小批大小或缩短描述。"}],
  stretch:[
    {en:"Train on 1,000 examples, then on 10,000, and plot test error against data size.",zh:"分别用 1000 和 10000 条样例训练，画出测试误差随数据量的变化。"},
    {en:"Try r=8 and r=32 and see whether the thicker add-on is worth it.",zh:"试试 r=8 和 r=32，看更厚的附加层值不值得。"},
    {en:"Work out the cost of 1,000 guesses for the tuned model and for the frontier model.",zh:"算一算微调模型和大模型各自 1000 次猜测的成本。"}],
  pkg:{dir:"packages/ai-engineer/24-fine-tuned-price-guesser",
    files:["README.txt","requirements.txt","env.example","final/common.py","final/make_tags.py","final/prepare_data.py","final/train.py","final/compare.py","final/test_offline.py","starter/common.py","starter/make_tags.py","starter/prepare_data.py","starter/train.py","starter/compare.py","starter/test_offline.py"],
    note:{en:"Training and comparing need an NVIDIA GPU. The data steps and the offline check run on any laptop. The price tags are invented.",zh:"训练和对比需要 NVIDIA GPU。数据步骤和离线检查在任何笔记本上都能跑。价格标签是虚构的。"}}};

window.PROJECTS["27-deal-hunting-system.html"]={
  goal:{en:"Put every earlier piece together into one running system with a screen, a timer and a live log.",zh:"把前面所有部件合成一个运行中的系统：有界面、定时器和实时日志。"},
  deliver:{en:"A deal-hunting screen: a table of listings priced well below their estimate, refreshed on a timer, with a colour-coded agent log.",zh:"一个淘好价界面：表格列出远低于估价的商品，按定时器刷新，旁边有按颜色区分的智能体日志。"},
  level:3,mins:40,
  accept:[
    {en:"python test_offline.py in final/ (demo mode) prints an ok line with no key and no GPU.",zh:"在 final/ 里（演示模式）运行 python test_offline.py，不需要密钥和 GPU，打印 ok。"},
    {en:"python app.py once finds the three planted bargains in the sample feed.",zh:"python app.py once 能在示例数据里找出三个埋好的好价。"},
    {en:"Running again finds nothing new, because the memory file remembers what was sent.",zh:"再运行一次不会有新结果，因为记忆文件记得已经发过什么。"},
    {en:"On the screen the table fills, and coloured log lines from several agents appear in order.",zh:"界面上表格会被填上，多个智能体的彩色日志按顺序出现。"}],
  fail:[
    {en:"The first real-mode run looks hung. It is the serverless GPU cold start. Wait for the log to fill.",zh:"真实模式第一次运行像卡住了。这是无服务器 GPU 的冷启动，等日志出现就好。"},
    {en:"Log lines from several threads come out mixed up. Agents write to a queue and only the screen reads it.",zh:"多个线程的日志混在一起。智能体只往队列里写，只由界面来读。"},
    {en:"A timer set to seconds spends money all night. Keep cheap models and a five-minute timer.",zh:"定时器设成几秒会一整晚都在花钱。用便宜的模型，间隔设五分钟。"}],
  stretch:[
    {en:"Change the alert threshold and count how many alerts you get in a night.",zh:"改一改提醒门槛，数数一晚上会收到几条提醒。"},
    {en:"Swap one agent for a different implementation behind the same method name.",zh:"在同一个方法名下，换成另一种实现的智能体。"},
    {en:"Add a reject button that stores deals you never want to see again.",zh:"加一个“不要了”按钮，把你永远不想再看到的商品记下来。"}],
  pkg:{dir:"packages/ai-engineer/27-deal-hunting-system",
    files:["README.txt","requirements.txt","env.example","final/agents.py","final/deal_system.py","final/app.py","final/logbus.py","final/price_guesser.py","final/make_data.py","final/test_offline.py","final/data/train.jsonl","final/data/val.jsonl","final/data/feed_sample.txt","starter/agents.py","starter/deal_system.py","starter/app.py","starter/logbus.py","starter/price_guesser.py","starter/make_data.py","starter/test_offline.py"],
    note:{en:"Demo mode runs free, with no key. Real mode needs a trained adapter, a serverless GPU account and API keys, so treat that code as the reference. The data is invented.",zh:"演示模式免费，不需要密钥。真实模式需要训练好的适配器、无服务器 GPU 账号和 API 密钥，所以那部分代码作为参考。数据是虚构的。"}}};
