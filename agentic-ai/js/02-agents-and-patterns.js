document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict,trace=TX2.trace;TX2.init();

 /* 1 · be the agent: five turns, each a log and a choice */
 var TOOLS=[{k:'s',en:'🔎 Search price',zh:'🔎 搜索价格'},{k:'r',en:'💱 Exchange rate',zh:'💱 查汇率'},{k:'c',en:'🧮 Calculate',zh:'🧮 计算'},{k:'e',en:'📧 Send email',zh:'📧 发邮件'},{k:'a',en:'✅ Final answer',zh:'✅ 最终答案'}];
 game($('g1'),[
  {en:'Log: (empty). Calculate, email and final answer would all fail with nothing in the log. Start with the ticket price.',zh:'日志：（空）。日志里什么都没有，计算、发邮件、最终答案都会失败。先去拿机票价格。',a:'s',ex:{en:'Tool returns: USD 300 per ticket. This airline quotes in USD, which you could not know before searching. Only now do you know which rate to look up, so search goes first.',zh:'工具返回：每张 300 美元。这家航空公司用美元报价，搜索之前你无从知道。现在才知道该查哪个汇率，所以先搜索。'},hint:{en:'Which tool needs no input from the log, and tells you what currency you are dealing with?',zh:'哪个工具不需要日志里已有的内容，还能告诉你币种？'}},
  {en:'Log: price is USD 300 per ticket. The total must be in SGD, so you need one more number.',zh:'日志：每张 300 美元。总价要用新元，所以还差一个数字。',a:'r',ex:{en:'Tool returns: 1 USD = 1.35 SGD. Now you hold both inputs.',zh:'工具返回：1 美元 = 1.35 新元。现在两个输入你都有了。'},hint:{en:'To change USD into SGD you need a conversion number.',zh:'美元换成新元需要一个换算数字。'}},
  {en:'Log: USD 300 per ticket; 1 USD = 1.35 SGD. You have both inputs.',zh:'日志：每张 300 美元；1 美元 = 1.35 新元。两个输入都齐了。',a:'c',ex:{en:'Tool returns: 2 × 300 × 1.35 = SGD 810.',zh:'工具返回：2 × 300 × 1.35 = 810 新元。'},hint:{en:'You now have everything needed to work out a number.',zh:'现在已经具备算出一个数字的全部条件。'}},
  {en:'Log: the total is SGD 810. The total has not been emailed yet.',zh:'日志：总价 810 新元。总价还没发邮件。',a:'e',ex:{en:'Tool returns: Email sent: “Total for 2 tickets: SGD 810”.',zh:'工具返回：邮件已发送：“2 张机票总价：810 新元”。'},hint:{en:'The goal says to email him the total.',zh:'目标要求把总价发邮件给他。'}},
  {en:'Log: price, rate, total SGD 810, email sent. Every part of the goal is done.',zh:'日志：价格、汇率、总价 810 新元、邮件已发送。目标的每一部分都完成了。',a:'a',ex:{en:'Goal met in 5 steps. You chose your own route; that is what makes it an agent. It also means steps (and cost) can change from run to run.',zh:'用 5 步完成目标。你自己选了路线，这正是智能体的特点，也意味着步数（和成本）每次可能不同。'},hint:{en:'Nothing is left to do. What does the agent do when the goal is met?',zh:'已经没有要做的事。目标完成后智能体该做什么？'}}],
  TOOLS,{en:'Turn',zh:'轮'});
 predict($('p1'),{q:{en:'After Turn 3 (total calculated, no email sent yet) you pick “Final answer”. What happens?',zh:'第 3 轮之后（总价算出来了，但还没发邮件）你选了“最终答案”。会怎样？'},opts:[{k:'a',en:'The goal is met, well done',zh:'目标完成，做得好'},{k:'b',en:'Answered too early: the email part is still missing',zh:'回答得太早：发邮件这部分还没完成'}],a:'b',ex:{en:'The goal was not finished yet. An agent must check its progress before it stops.',zh:'目标还没完成。智能体停下之前必须检查进度。'},hint:{en:'Compare the log with the four parts of the goal.',zh:'把日志和目标的四个部分逐一对照。'}});
 /* 2 · the loop, stepped */
 trace($('t2'),[
  {k:'you',en:'Goal: find the Singapore → Tokyo price, total for 2 tickets in SGD, email the total, give the answer.',zh:'目标：查出新加坡→东京的价格，算出 2 张票的新元总价，发邮件，给出答案。',why:{en:'You are given a goal.',zh:'你拿到一个目标。'}},
  {k:'llm',en:'Think: what do I know, what is missing, what next?',zh:'思考：我知道什么、缺什么、下一步做什么？',why:{en:'The LLM reads the log and decides. Nothing has run yet.',zh:'大模型读日志并做决定，此时还什么都没运行。'}},
  {k:'tool',en:'Act: call a tool (search, calculator, email…).',zh:'行动：调用一个工具（搜索、计算器、邮件……）。',why:{en:'The chosen tool does its work and returns a result.',zh:'被选中的工具干活并返回结果。'}},
  {k:'llm',en:'Observe: read the result, then think again. Repeat.',zh:'观察：读取结果，再次思考，如此重复。',why:{en:'The result joins the log, so the next choice is better informed.',zh:'结果进入日志，下一次选择就有了更多依据。'}},
  {k:'llm',en:'Done ✓ Stop only when the goal is met (or a step limit hits).',zh:'完成 ✓ 只有目标达成（或触及步数上限）才停止。',why:{en:'Two ways out: goal met, or the guardrail stops it.',zh:'两种出口：目标达成，或被护栏拦下。'}}]);
 /* 3 · workflow or agent */
 game($('g3'),[
  {en:'You know the steps in advance.',zh:'你提前知道所有步骤。',a:'w',ex:{en:'Known steps can be fixed in code, so a workflow fits.',zh:'步骤已知就能用代码固定下来，适合工作流。'},hint:{en:'Who needs to decide anything if the route is known?',zh:'路线已知的话，还需要谁来做决定？'}},
  {en:'The steps depend on what turns up along the way.',zh:'步骤取决于途中发现什么。',a:'a',ex:{en:'An open-ended task cannot be fixed in advance, so the LLM picks the path.',zh:'开放式任务无法提前固定，要由大模型来选路径。'},hint:{en:'Can you write down a route that you only learn on the way?',zh:'一条走到半路才知道的路线，能提前写下来吗？'}},
  {en:'It takes the same path every run, so cost is predictable.',zh:'每次都走同一条路径，成本可预测。',a:'w',ex:{en:'Same path every run means predictable steps and cost: a workflow.',zh:'每次路径相同，步数和成本就可预测：工作流。'},hint:{en:'Which one has steps you can count in advance?',zh:'哪一种的步数可以提前数出来？'}},
  {en:'The path can differ each run, and so can the step count.',zh:'路径每次可能不同，步数也不同。',a:'a',ex:{en:'That is the price of letting the LLM decide: steps and cost vary.',zh:'这就是让大模型来决定的代价：步数和成本会变化。'},hint:{en:'Which one lets the LLM choose the route?',zh:'哪一种让大模型自己选路线？'}}],
  [{k:'w',en:'Workflow',zh:'工作流'},{k:'a',en:'Agent',zh:'智能体'}],{en:'Case',zh:'情景'});

 /* 4 · patterns */
 trace($('t4a'),[
  {k:'you',en:'A customer message arrives: “My app keeps crashing.”',zh:'一条客户消息到来：“我的应用一直崩溃。”'},
  {k:'llm',en:'Router: this is a technical problem.',zh:'路由器：这是一个技术问题。',why:{en:'The router (an LLM) only picks a label from a list you fixed in advance: Billing, Tech or Sales. The routes stay fixed in code, so this is still a workflow, not an agent.',zh:'路由器（一个大模型）只是从你提前定好的清单（账单、技术、销售）里挑一个标签。路线仍由代码固定，所以这依然是工作流，不是智能体。'}},
  {k:'code',en:'Sends the message to Tech support only.',zh:'只把消息交给技术支持。',why:{en:'It sends the message to one specialist. Billing and Sales are not used.',zh:'它把消息交给一位专家，账单和销售这次都不用。'}},
  {k:'llm',en:'Tech support writes the reply.',zh:'技术支持写出回复。',why:{en:'The specialist answers. Each specialist stays focused on its own job.',zh:'专家作答。每位专家只专注于自己的工作。'}}]);
 game($('g4'),[
  {en:'Write an outline, then the article, then translate it. The steps never change.',zh:'先写大纲，再写文章，再翻译。步骤永远不变。',a:'ch',ex:{en:'Fixed sequence where each output feeds the next: prompt chaining.',zh:'固定顺序，上一步输出喂给下一步：提示链。'},hint:{en:'Is the order fixed, with each step feeding the next?',zh:'顺序是否固定，每一步喂给下一步？'}},
  {en:'Customer messages must go to Billing, Tech or Sales depending on what they say.',zh:'客户消息要根据内容分派给账单、技术或销售。',a:'ro',ex:{en:'Classify first, then send to a specialist: routing.',zh:'先分类，再交给专家：路由。'},hint:{en:'Something must decide which specialist gets the message.',zh:'得有东西来决定哪位专家接这条消息。'}},
  {en:'Review one piece of code for security, style and speed at the same time.',zh:'同时从安全、风格、性能三方面审查同一段代码。',a:'pa',ex:{en:'Independent checks that can run together: parallelization.',zh:'彼此独立、可同时运行的检查：并行化。'},hint:{en:'Do the three checks depend on each other?',zh:'这三项检查彼此依赖吗？'}},
  {en:'“Fix this bug.” You can\'t know how many files need changing until the LLM looks.',zh:'“修这个 bug。”在大模型查看之前，你不知道要改几个文件。',a:'or',ex:{en:'Sub-tasks are unknown up front, so a boss LLM plans them at run time: orchestrator-worker.',zh:'子任务事先未知，由“老板”大模型在运行时规划：编排者-工作者。'},hint:{en:'Who works out the sub-tasks if nobody knows them yet?',zh:'子任务还没人知道，该由谁来规划？'}},
  {en:'Draft an email; a second LLM checks tone and facts; rewrite until it passes.',zh:'起草邮件；第二个大模型检查语气和事实；不通过就重写直到通过。',a:'ev',ex:{en:'One produces, another judges, loop until pass: evaluator-optimizer.',zh:'一个产出、一个评判，循环到通过：评估者-优化者。'},hint:{en:'One LLM writes and another judges, and it repeats.',zh:'一个大模型写，另一个评判，并且反复进行。'}}],
  [{k:'ch',en:'Prompt chaining',zh:'提示链'},{k:'ro',en:'Routing',zh:'路由'},{k:'pa',en:'Parallelization',zh:'并行化'},{k:'or',en:'Orchestrator-worker',zh:'编排者-工作者'},{k:'ev',en:'Evaluator-optimizer',zh:'评估者-优化者'}],{en:'Situation',zh:'场景'});

 /* 7 · decide */
 game($('g7'),[
  {en:'You want better customer support, but have no number you could track.',zh:'你想改善客户支持，但没有任何可追踪的数字。',a:'m',ex:{en:'Without a measurable metric you can\'t tell whether any design works. Decide what “better” means, then come back.',zh:'没有可衡量的指标，就无法判断任何方案是否有效。先想清楚“更好”是什么意思，再回来。'},hint:{en:'Which of the three questions comes first?',zh:'三个问题里哪一个排第一？'}},
  {en:'You have a metric, and one plain LLM call already meets it.',zh:'你有指标，单次普通大模型调用已经达标。',a:'s',ex:{en:'It already meets your metric. Anything fancier adds cost and risk for no gain.',zh:'它已经达标。再复杂只会增加成本和风险，没有收益。'},hint:{en:'If the simplest option works, why climb?',zh:'最简单的方案已经够用，为什么还要往上走？'}},
  {en:'You have a metric, one call falls short, and you can write down every step in advance.',zh:'你有指标，单次调用不够，而你能提前写出每一步。',a:'w',ex:{en:'You know the route, so fix it in code. Choose a pattern from Step 3 and check the metric improves.',zh:'路线已知，就用代码固定下来。从第 3 步里选一种模式，并检查指标是否改善。'},hint:{en:'Steps known in advance point to a fixed route.',zh:'步骤提前已知，说明路线可以固定。'}},
  {en:'You have a metric, one call falls short, and the steps depend on what turns up.',zh:'你有指标，单次调用不够，而步骤取决于途中发现什么。',a:'a',ex:{en:'The path can\'t be fixed in advance. Add monitoring and guardrails, and compare against a simpler workflow before committing.',zh:'路径无法提前固定。加上监控和护栏，并在定案前与更简单的工作流对比。'},hint:{en:'Can the route be written in code before the run?',zh:'路线能在运行前用代码写出来吗？'}}],
  [{k:'m',en:'Set a metric first',zh:'先定指标'},{k:'s',en:'Single LLM call',zh:'单次调用'},{k:'w',en:'Workflow',zh:'工作流'},{k:'a',en:'Agent',zh:'智能体'}],{en:'Case',zh:'情景'});
 predict($('p7'),{q:{en:'Run the trip-price task 10 times. A workflow does the same 5 steps every run. What do you expect from an agent?',zh:'把订机票的任务运行 10 次。工作流每次都是同样的 5 步。智能体会怎样？'},opts:[{k:'a',en:'Always exactly 5 steps',zh:'永远正好 5 步'},{k:'b',en:'The step count (and cost) can differ from run to run',zh:'步数（和成本）每次可能不同'}],a:'b',ex:{en:'Each agent step is one LLM call, so extra steps are extra cost. Choose the agent only if the better results are worth this variation, and monitor it.',zh:'智能体每一步就是一次大模型调用，多出来的步骤就是多花的钱。只有当更好的效果值得这种波动时才选智能体，并且要监控。'},hint:{en:'Who picks the path in an agent, and can the choice change?',zh:'智能体里由谁选路径？这个选择会变吗？'}});
});
