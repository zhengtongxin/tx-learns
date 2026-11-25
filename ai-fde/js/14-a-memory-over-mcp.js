document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 predict($('p1'),{q:{en:'A customer the desk has never seen arrives. What does get_notes("K-9999") return?',zh:'一位柜台从没见过的客户来了。get_notes("K-9999") 会返回什么？'},opts:[{k:'a',en:'An error, and the run stops',zh:'报错，运行中止'},{k:'b',en:'An empty list',zh:'一个空列表'},{k:'c',en:'The notes of the last customer',zh:'上一位客户的笔记'}],a:'b',out:{en:'[]',zh:'[]'},ex:{en:'The code uses <code>.get(customer_id, [])</code>, so a new customer simply has no notes.',zh:'代码用的是 <code>.get(customer_id, [])</code>，所以新客户就是没有笔记。'},hint:{en:'Look at the second argument of .get.',zh:'看看 .get 的第二个参数。'}});

 predict($('p2'),{q:{en:'Each claim starts a new agent and a new server process. Where does the memory live between claims?',zh:'每份理赔都会启动新的智能体和新的服务端进程。两份理赔之间，记忆在哪里？'},opts:[{k:'a',en:'In the agent’s chat history',zh:'在智能体的聊天记录里'},{k:'b',en:'In memory.json, on the server’s side',zh:'在服务端那边的 memory.json 里'},{k:'c',en:'In the model itself, which learns it',zh:'在模型自己身上，它学会了'}],a:'b',ex:{en:'The chat starts empty each time, and the model does not learn from one run. The file is what lasts.',zh:'聊天每次都从空白开始，模型也不会从一次运行里学到东西。留下来的是那个文件。'},hint:{en:'What survives when the program stops?',zh:'程序停了，什么还在？'}});

 game($('g1'),[
  {en:'Two lost-bag claims, receipts complete (claim C041)',zh:'两次丢行李理赔，收据齐全（理赔 C041）',a:'s',ex:{en:'A fact with a source that helps next time.',zh:'一个有出处、对下次有帮助的事实。'},hint:{en:'Is it a fact, and useful later?',zh:'它是事实，而且以后有用吗？'}},
  {en:'Prefers to be contacted by email',zh:'希望用电子邮件联系',a:'s',ex:{en:'A harmless preference that helps the desk.',zh:'无害的偏好，对柜台有帮助。'},hint:{en:'Is it a harmless fact?',zh:'它是无害的事实吗？'}},
  {en:'Passport number',zh:'护照号码',a:'l',ex:{en:'Private data does not belong in the agent’s notes.',zh:'私密资料不该放进智能体的笔记。'},hint:{en:'Would you want it sitting in a notes file?',zh:'你愿意它躺在笔记文件里吗？'}},
  {en:'“Seemed nervous, maybe hiding something”',zh:'“看起来很紧张，也许有所隐瞒”',a:'l',ex:{en:'A guess. Later claims would trust it, and it may be unfair.',zh:'这是猜测。以后的理赔会相信它，而且可能不公平。'},hint:{en:'Is it a fact or a feeling?',zh:'是事实还是感觉？'}},
  {en:'Claim C041 paid S$420 on 2 June',zh:'理赔 C041 于 6 月 2 日赔了 S$420',a:'s',ex:{en:'A concrete fact with a source and a date.',zh:'具体的事实，有出处，有日期。'},hint:{en:'Is it concrete and checkable?',zh:'它具体、能核实吗？'}}],[{k:'s',en:'Save',zh:'要存'},{k:'l',en:'Leave out',zh:'不要存'}],{en:'Note',zh:'笔记'});

 predict($('p4'),{q:{en:'A note says “receipts always complete” and was saved 14 months ago. Today’s claim has no receipts. What should the agent do?',zh:'一条笔记写着“收据一向齐全”，是 14 个月前存的。今天的理赔没有收据。智能体该怎么做？'},opts:[{k:'a',en:'Trust the note and approve',zh:'相信笔记，批准'},{k:'b',en:'Treat the note as a lead, see that today’s claim has no receipts, and refer or ask',zh:'把笔记当线索，发现今天没有收据，于是转交或询问'},{k:'c',en:'Delete all notes for this customer',zh:'删掉这位客户的所有笔记'}],a:'b',ex:{en:'The date shows the note is old, and today’s paperwork disagrees with it. Checking beats trusting.',zh:'日期说明这条笔记很旧，而今天的材料和它不符。核实胜过轻信。'},hint:{en:'Which is stronger: an old note, or today’s paperwork?',zh:'旧笔记和今天的材料，哪个更有分量？'}});
});
