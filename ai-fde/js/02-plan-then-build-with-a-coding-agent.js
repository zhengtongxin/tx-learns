document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 game($('g1'),[
  {en:'What does the customer need the pilot to do for claims handlers?',zh:'客户需要试点为理赔员做什么？',a:'s',ex:{en:'What the business needs lives in the spec.',zh:'业务需求写在 spec 里。'},hint:{en:'Which file holds the customer’s words?',zh:'哪个文件放着客户的原话？'}},
  {en:'Should the backend be Python or something else?',zh:'后端用 Python 还是别的？',a:'t',ex:{en:'Technology choices belong in the tech file.',zh:'技术选择放在 tech 文件里。'},hint:{en:'Is this about what to build with?',zh:'这是关于用什么来做吗？'}},
  {en:'Do function names use snake_case or camelCase?',zh:'函数名用 snake_case 还是 camelCase？',a:'c',ex:{en:'Naming rules are code standards.',zh:'命名规则属于代码规范。'},hint:{en:'This is about how code is written.',zh:'这是关于代码怎么写。'}},
  {en:'Which phases are already finished?',zh:'哪些阶段已经完成？',a:'u',ex:{en:'Progress belongs in the status file.',zh:'进度放在状态文件里。'},hint:{en:'Which file says where things stand?',zh:'哪个文件说明现在做到哪？'}}],[{k:'s',en:'spec.md',zh:'spec.md'},{k:'t',en:'tech.md',zh:'tech.md'},{k:'c',en:'standards.md',zh:'standards.md'},{k:'u',en:'status.md',zh:'status.md'}],{en:'Question',zh:'问题'});

 predict($('p2'),{q:{en:'You ask for a plan and notice Phase 3 has the agent paying out claims on its own. What is the cheapest moment to fix that?',zh:'你要了计划，发现第 3 阶段让智能体自己赔付。什么时候改最便宜？'},opts:[{k:'a',en:'Now, while it is only a line in the plan',zh:'现在，它还只是计划里的一行字'},{k:'b',en:'After a dashboard is built on top of it',zh:'等看板建在它上面之后'},{k:'c',en:'After a handler finds a wrong payout',zh:'等理赔员发现一笔错误赔付之后'}],a:'a',ex:{en:'Fixing a sentence costs seconds. Fixing built code costs an hour or more.',zh:'改一句话只要几秒，改已经建好的代码要一小时甚至更久。'},hint:{en:'When has the least been built?',zh:'什么时候建好的东西最少？'}});

 game($('g2'),[
  {en:'“Phase 3 lets the agent pay big claims; the spec says a handler signs those off. Change it.”',zh:'“第 3 阶段让智能体赔付大额理赔，但需求写明由理赔员签字。请改掉。”',a:'y',ex:{en:'A specific push-back tied to the spec.',zh:'这是针对需求的具体意见。'},hint:{en:'Does it point to the spec?',zh:'它有对照需求吗？'}},
  {en:'“Looks fine, implement it.” (without reading it)',zh:'“看起来不错，开始吧。”（没读过）',a:'n',ex:{en:'An unread plan is no review at all.',zh:'没读过的计划等于没审。'},hint:{en:'Did anyone read it?',zh:'有人读过吗？'}},
  {en:'Ask the agent to build phase 1, check it against the spec, then say go for phase 2.',zh:'让智能体先建第 1 阶段，对照需求检查，再说开始第 2 阶段。',a:'y',ex:{en:'Checking after each phase keeps mistakes small.',zh:'每个阶段后检查，错误就不会堆大。'},hint:{en:'Is there a check between phases?',zh:'阶段之间有检查吗？'}},
  {en:'Let it build all phases and a few extra ideas it likes, then look at the end.',zh:'让它一口气建完所有阶段，再加几个它喜欢的点子，最后才看。',a:'n',ex:{en:'It builds ahead of the brief, and errors pile up unseen.',zh:'它超出了需求去建，错误也在暗处越堆越多。'},hint:{en:'Is anything being checked on the way?',zh:'中途有检查吗？'}}],[{k:'y',en:'Good review habit',zh:'好的审查习惯'},{k:'n',en:'Risky habit',zh:'有风险的习惯'}],{en:'Reply',zh:'回应'});
});
