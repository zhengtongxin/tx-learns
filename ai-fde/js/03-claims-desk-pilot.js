document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 game($('g1'),[
  {en:'claims.json: the 25 invented claims',zh:'claims.json：25 份编出来的理赔',a:'d',ex:{en:'The agent needs the claims to work on.',zh:'智能体要有理赔才能工作。'},hint:{en:'Does the agent need to read it?',zh:'智能体需要读它吗？'}},
  {en:'handler_decisions.json: what the handlers decided',zh:'handler_decisions.json：理赔员的决定',a:'k',ex:{en:'It is the answer key. If the agent sees it, the score is meaningless.',zh:'这是答案。智能体一旦看到，分数就没意义了。'},hint:{en:'Is it the right answer or the question?',zh:'它是答案还是题目？'}},
  {en:'policy_wording.txt: the plain wording of the cover',zh:'policy_wording.txt：保障内容的条款原文',a:'d',ex:{en:'The agent must read the wording to judge cover.',zh:'智能体要读条款才能判断是否在保障范围。'},hint:{en:'Can it decide without the rules?',zh:'没有规则它能判断吗？'}}],[{k:'d',en:'data/ (agent reads)',zh:'data/（智能体可读）'},{k:'k',en:'answer_key/ (hidden)',zh:'answer_key/（隐藏）'}],{en:'File',zh:'文件'});

 predict($('p2'),{q:{en:'The agent returns approve with a payout of S$1,200. What state does <code>record_decision</code> put the claim in?',zh:'智能体返回批准，赔付 S$1,200。<code>record_decision</code> 会把理赔放进什么状态？'},opts:[{k:'a',en:'decided',zh:'decided（已决定）'},{k:'b',en:'waiting_signoff',zh:'waiting_signoff（等待签字）'},{k:'c',en:'waiting',zh:'waiting（等待中）'}],a:'b',out:{en:'1200 > 800 → too_big is True → state: waiting_signoff',zh:'1200 > 800 → too_big 为 True → 状态：waiting_signoff'},ex:{en:'It is over S$800, so a handler must sign off. The prompt could not stop this; the code does.',zh:'超过 S$800，必须由理赔员签字。提示词拦不住，代码可以。'},hint:{en:'Compare 1,200 with the limit.',zh:'把 1,200 和上限比一比。'}});

 predict($('p3'),{q:{en:'Why does <code>decide</code> only return an answer instead of changing the queue itself?',zh:'为什么 <code>decide</code> 只返回答案，而不是自己去改队列？'},opts:[{k:'a',en:'So the backend rules, like the sign-off limit, always apply',zh:'这样后端的规则（比如签字上限）永远生效'},{k:'b',en:'Because the model cannot write Python',zh:'因为模型不会写 Python'},{k:'c',en:'To make the program slower',zh:'为了让程序变慢'}],a:'a',ex:{en:'Every decision passes through record_decision, so no path skips the rule.',zh:'每个决定都要经过 record_decision，没有绕过规则的路。'},hint:{en:'Which function enforces the S$800 rule?',zh:'哪个函数在执行 S$800 的规则？'}});
});
