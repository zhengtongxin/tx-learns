document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict,trace=TX2.trace;TX2.init();

 predict($('p3b'),{q:{en:'Without <code>tool_choice="required"</code>, Mailroom replies “Done! The email is on its way.” Lina\'s inbox is empty. Why?',zh:'没有 <code>tool_choice="required"</code> 时，Mailroom 回复“好了！邮件已经发出。”可 Lina 的收件箱是空的。为什么？'},opts:[{k:'a',en:'SMTP is slow, so wait a minute',zh:'SMTP 很慢，再等一分钟'},{k:'b',en:'The model answered in text and never called send_email',zh:'模型只是用文字回答，根本没调用 send_email'},{k:'c',en:'The docstring was too long',zh:'文档字符串太长了'}],a:'b',ex:{en:'Words are not actions. Only a tool call sends. The trace would show no send_email call at all.',zh:'说了不等于做了，只有工具调用才会发送。trace 里会看到压根没有 send_email 调用。'},hint:{en:'Open the trace in your head: is there a tool call in it?',zh:'在脑子里打开 trace：里面有工具调用吗？'}});

 trace($('t4'),[
  {k:'you',en:'Send the coding club invitation to parents.',zh:'把编程俱乐部的邀请发给家长们。'},
  {k:'llm',en:'Coordinator: step 1. Call formal_writer, playful_writer and brief_writer.',zh:'Coordinator：第 1 步，调用 formal_writer、playful_writer 和 brief_writer。',why:{en:'To the Coordinator, each writer is just a tool in its list.',zh:'在 Coordinator 看来，每个写手只是工具列表里的一个工具。'}},
  {k:'tool',en:'Each writer is a whole agent inside the tool: it writes its draft and hands it back.',zh:'每个写手都是藏在工具里的一个完整智能体：写好草稿，再交回来。',why:{en:'The drafts go back to the Coordinator, not to Lina. That is A → B → A.',zh:'草稿交回给 Coordinator，而不是 Lina。这就是 A → B → A。'}},
  {k:'llm',en:'Coordinator: the brief one is best for busy parents. Call send_email(subject, body).',zh:'Coordinator：简短那份最适合忙碌的家长。调用 send_email(subject, body)。',why:{en:'The choosing now happens inside the model, not in your Python.',zh:'现在“挑选”发生在模型里，而不是你的 Python 里。'}},
  {k:'tool',en:'send_email → "Sent"',zh:'send_email → "Sent"'},
  {k:'llm',en:'Coordinator: “Done. I sent the short version to the parents.”',zh:'Coordinator：“完成。我把简短版发给了家长们。”',why:{en:'The Coordinator stayed in charge the whole time and wrote the final answer.',zh:'Coordinator 全程掌控，并写下了最终回答。'}}]);

 predict($('p4'),{q:{en:'Compared with Step 2, what disappeared from your Python?',zh:'和第 2 步相比，你的 Python 里少了什么？'},opts:[{k:'a',en:'The order of the steps and the picking',zh:'步骤顺序和挑选这件事'},{k:'b',en:'The writer agents',zh:'写手智能体'},{k:'c',en:'Nothing, it is the same code',zh:'什么都没少，代码一样'}],a:'a',ex:{en:'No gather, no join, no picker call. The plan now lives in the Coordinator\'s instructions, and the model follows it (most of the time).',zh:'没有 gather、没有拼接、也不用调用挑选者。计划现在写在 Coordinator 的指令里，由模型来执行（大多数时候）。'},hint:{en:'Who decides when to call each writer now?',zh:'现在由谁决定什么时候调用每个写手？'}});

 game($('g6'),[
  {en:'Every Monday: write three drafts, pick one, send it. Always the same steps.',zh:'每周一：写三份草稿，挑一份，发出去。步骤永远一样。',a:'c',ex:{en:'Fixed steps. Your code can run them the same way every time.',zh:'步骤固定，你的代码每次都能用同样的方式跑完。'},hint:{en:'Does the path ever change?',zh:'路径会变吗？'}},
  {en:'A parent replies. It might be a question, a sign-up or a complaint, and each needs a different next step.',zh:'有家长回信了。可能是提问、报名，也可能是投诉，每种都需要不同的下一步。',a:'l',ex:{en:'The path depends on what the message says. Let a manager agent decide.',zh:'路径取决于消息内容，交给主管智能体来决定。'},hint:{en:'Can you know the next step before reading the reply?',zh:'不读回信，你能知道下一步吗？'}},
  {en:'Send the same reminder to all parents the night before each club meeting.',zh:'每次俱乐部活动前一晚，给所有家长发同一条提醒。',a:'c',ex:{en:'Same steps every time, and you want it to never surprise you.',zh:'每次步骤都一样，而且你希望它绝不出意外。'},hint:{en:'Is there any decision to make here?',zh:'这里有什么需要临场判断的吗？'}},
  {en:'Lina says: “Find out what parents worry about and draft whatever would help most.”',zh:'Lina 说：“弄清楚家长们在担心什么，然后起草最有帮助的东西。”',a:'l',ex:{en:'Open-ended. Which helpers to call and in what order depends on what turns up.',zh:'这是开放式任务，调用哪些帮手、按什么顺序，取决于发现了什么。'},hint:{en:'Could you write the steps down in advance?',zh:'你能提前把步骤写下来吗？'}}],[{k:'c',en:'By code',zh:'由代码编排'},{k:'l',en:'By the LLM',zh:'由大模型编排'}],{en:'Job',zh:'任务'});
});
