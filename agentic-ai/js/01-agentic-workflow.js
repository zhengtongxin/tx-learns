document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict,trace=TX2.trace;TX2.init();

 game($('g1'),[
  {en:'The OpenAI Chat Model reasons and writes the reply.',zh:'OpenAI Chat Model 负责推理并撰写回复。',a:'br',ex:{en:'The model is the LLM that thinks and writes: the brain.',zh:'模型就是负责思考和写作的大模型：大脑。'},hint:{en:'Which part does the thinking?',zh:'哪一部分负责思考？'}},
  {en:'Marketstack fetches end-of-day (EoD) prices, one closing price per day.',zh:'Marketstack 获取日终（EoD）价格，每天一个收盘价。',a:'ha',ex:{en:'It reaches outside the model to get real data: a tool, the hands.',zh:'它伸到模型之外去取真实数据：工具，也就是双手。'},hint:{en:'Does it think, or does it fetch and do?',zh:'它是在思考，还是在取数据、做事？'}},
  {en:'Simple Memory keeps recent messages.',zh:'Simple Memory 保存最近的消息。',a:'no',ex:{en:'It holds the recent conversation so follow-ups make sense: the notebook.',zh:'它保存最近的对话，让追问有上下文：笔记本。'},hint:{en:'Which part remembers earlier messages?',zh:'哪一部分记住之前的消息？'}},
  {en:'Google Sheets appends a row.',zh:'Google Sheets 追加一行。',a:'ha',ex:{en:'Writing a row is an action in the outside world: a tool.',zh:'写入一行是对外部世界的操作：工具。'},hint:{en:'It writes something outside the model.',zh:'它是在模型之外写入内容。'}}],
  [{k:'br',en:'Brain',zh:'大脑'},{k:'ha',en:'Hands',zh:'双手'},{k:'no',en:'Notebook',zh:'笔记本'}],{en:'Part',zh:'部件'});

 trace($('t1'),[
  {k:'you',en:'Check yesterday’s closing price of the bond ETF and write it down.',zh:'查一下债券 ETF 昨天的收盘价，并记下来。'},
  {k:'code',lbl:{en:'n8n workflow',zh:'n8n 工作流'},en:'Chat trigger passes the message to the AI Agent node (0.0s)',zh:'聊天触发器把消息交给 AI Agent 节点（0.0 秒）',why:{en:'The trigger only starts the workflow. The loop begins in the agent.',zh:'触发器只负责启动工作流，循环从智能体开始。'}},
  {k:'code',lbl:{en:'n8n workflow',zh:'n8n 工作流'},en:'Load memory (0.0s)',zh:'读取记忆（0.0 秒）',why:{en:'The agent fetches recent messages so the model sees the conversation.',zh:'智能体取出最近的消息，让模型看到对话。'}},
  {k:'llm',en:'Model: I need market data (1.5s · 520 tokens)',zh:'模型：需要行情数据（1.5 秒 · 520 token）',why:{en:'The model only asks for a tool. Nothing has been fetched yet.',zh:'模型只是请求用工具，还没有取到任何数据。'}},
  {k:'tool',en:'n8n runs the tool: Marketstack, Get many EoD data (1.7s)',zh:'n8n 运行工具：Marketstack，获取日终行情（1.7 秒）',why:{en:'The model asked; n8n made the call and returned the real number from outside the model.',zh:'模型提出请求，n8n 发出调用，并把模型之外的真实数字交回。'}},
  {k:'llm',en:'Model: write the answer (1.8s · 780 tokens)',zh:'模型：撰写回答（1.8 秒 · 780 token）',why:{en:'With the data in hand, the model writes the reply and asks to log it. Example answer: “Yesterday’s close was 98.40.” The model can be wrong, so check it against the source. Not investment advice.',zh:'有了数据，模型写出回答，并请求把它记录下来。示例回答：“昨天收盘价是 98.40。”模型可能出错，请对照来源核实。不构成投资建议。'}},
  {k:'tool',en:'Tool: Google Sheets, Append row in sheet (1.6s)',zh:'工具：Google Sheets，追加一行（1.6 秒）',why:{en:'This is the “write it down” part of the request.',zh:'这就是 请求里“记下来”的部分。'}},
  {k:'code',lbl:{en:'n8n workflow',zh:'n8n 工作流'},en:'Save memory, then send the reply (0.0s). Total 6.6s · about 1.3k tokens',zh:'保存记忆，然后发送回复（0.0 秒）。总计 6.6 秒 · 约 1.3k token',why:{en:'Final answer: “Yesterday’s close was 98.40, and I added a row to the sheet.” (Example number; not advice, and the model can be wrong.)',zh:'最终回答：“昨天收盘价是 98.40，并已在表格里追加一行。”（示例数字；不构成建议，模型也可能出错。）'}}]);

 predict($('p1'),{q:{en:'In the run above, which step brought in the real closing price?',zh:'在上面的运行中，哪一步带来了真实的收盘价？'},opts:[{k:'a',en:'The first model step',zh:'第一次模型步骤'},{k:'b',en:'The Marketstack tool step',zh:'Marketstack 工具步骤'},{k:'c',en:'Load memory',zh:'读取记忆'}],a:'b',ex:{en:'Models do not know live data. They call a tool to fetch it.',zh:'模型本身不知道实时数据，需要调用工具获取。'},hint:{en:'Which step reaches outside the model to get data?',zh:'哪一步伸到模型之外去取数据？'}});


 predict($('p4'),{q:{en:'The agent needs yesterday’s closing price. What does it use?',zh:'智能体需要昨天的收盘价，它会用什么？'},opts:[{k:'a',en:'Simple Memory',zh:'Simple Memory'},{k:'b',en:'A tool (Marketstack: Get many EoD data)',zh:'工具（Marketstack：Get many EoD data）'},{k:'c',en:'The trigger',zh:'触发器'}],a:'b',ex:{en:'Models do not know live data; they call a tool to fetch it.',zh:'模型本身不知道实时数据，需要调用工具获取。'},hint:{en:'Memory only holds past messages. Where does new data come from?',zh:'记忆只保存过去的消息。新数据从哪里来？'}});
});
