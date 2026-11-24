document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 game($('g1'),[
  {en:'claims.json: the 25 invented claims',zh:'claims.json：25 份编出来的理赔',a:'d',ex:{en:'The agent needs the claims to work on.',zh:'智能体要有理赔才能工作。'},hint:{en:'Does the agent need to read it?',zh:'智能体需要读它吗？'}},
  {en:'handler_decisions.json: what the handlers decided',zh:'handler_decisions.json：理赔员的决定',a:'k',ex:{en:'It is the answer key. If the agent sees it, the score is meaningless.',zh:'这是答案。智能体一旦看到，分数就没意义了。'},hint:{en:'Is it the right answer or the question?',zh:'它是答案还是题目？'}},
  {en:'policy_wording.txt: the plain wording of the cover',zh:'policy_wording.txt：保障内容的条款原文',a:'d',ex:{en:'The agent must read the wording to judge cover.',zh:'智能体要读条款才能判断是否在保障范围。'},hint:{en:'Can it decide without the rules?',zh:'没有规则它能判断吗？'}}],[{k:'d',en:'data/ (agent reads)',zh:'data/（智能体可读）'},{k:'k',en:'answer_key/ (hidden)',zh:'answer_key/（隐藏）'}],{en:'File',zh:'文件'});

 predict($('p1'),{q:{en:'After <code>add_claim(claim)</code> and nothing else, what state is the claim in?',zh:'只调用了 <code>add_claim(claim)</code>，理赔处于什么状态？'},opts:[{k:'a',en:'waiting',zh:'waiting（等待中）'},{k:'b',en:'in_progress',zh:'in_progress（处理中）'},{k:'c',en:'decided',zh:'decided（已决定）'}],a:'a',ex:{en:'add_claim sets the state to waiting. Only start() moves it to in_progress.',zh:'add_claim 把状态设为 waiting，只有 start() 才会改成 in_progress。'},hint:{en:'Look at the dict add_claim builds.',zh:'看看 add_claim 构造的那个字典。'}});

 game($('g2'),[
  {en:'The agent’s two or three sentences of reasons',zh:'智能体给出的两三句理由',a:'y',ex:{en:'Handlers must see why before they trust it.',zh:'理赔员要先看到理由，才会信任。'},hint:{en:'Would Aisha want to know why?',zh:'Aisha 想知道为什么吗？'}},
  {en:'Each claim in full: story, amount, policy',zh:'每份理赔的全部内容：经过、金额、保单',a:'y',ex:{en:'You cannot judge a decision without the claim.',zh:'不看理赔本身，就没法判断决定。'},hint:{en:'Can you check a decision blind?',zh:'能闭着眼检查一个决定吗？'}},
  {en:'The model’s API key',zh:'模型的 API 密钥',a:'n',ex:{en:'Keys never go on a screen people can see.',zh:'密钥永远不该出现在别人看得到的屏幕上。'},hint:{en:'Should anyone else see a secret?',zh:'秘密该让别人看到吗？'}},
  {en:'The answer key with the handlers’ own decisions',zh:'带着理赔员决定的答案',a:'n',ex:{en:'Keep it for scoring only, not for the live queue view.',zh:'它只用来打分，不放进日常的队列视图。'},hint:{en:'Is it part of the live queue or the test?',zh:'它属于日常队列还是测试？'}}],[{k:'y',en:'On the dashboard',zh:'放在看板上'},{k:'n',en:'Keep off it',zh:'不要放'}],{en:'Item',zh:'内容'});

 predict($('p2'),{q:{en:'The agent returns approve with a payout of S$1,200. What state does <code>record_decision</code> put the claim in?',zh:'智能体返回批准，赔付 S$1,200。<code>record_decision</code> 会把理赔放进什么状态？'},opts:[{k:'a',en:'decided',zh:'decided（已决定）'},{k:'b',en:'waiting_signoff',zh:'waiting_signoff（等待签字）'},{k:'c',en:'waiting',zh:'waiting（等待中）'}],a:'b',out:{en:'1200 > 800 → too_big is True → state: waiting_signoff',zh:'1200 > 800 → too_big 为 True → 状态：waiting_signoff'},ex:{en:'It is over S$800, so a handler must sign off. The prompt could not stop this; the code does.',zh:'超过 S$800，必须由理赔员签字。提示词拦不住，代码可以。'},hint:{en:'Compare 1,200 with the limit.',zh:'把 1,200 和上限比一比。'}});

 predict($('p3'),{q:{en:'Why does <code>decide</code> only return an answer instead of changing the queue itself?',zh:'为什么 <code>decide</code> 只返回答案，而不是自己去改队列？'},opts:[{k:'a',en:'So the backend rules, like the sign-off limit, always apply',zh:'这样后端的规则（比如签字上限）永远生效'},{k:'b',en:'Because the model cannot write Python',zh:'因为模型不会写 Python'},{k:'c',en:'To make the program slower',zh:'为了让程序变慢'}],a:'a',ex:{en:'Every decision passes through record_decision, so no path skips the rule.',zh:'每个决定都要经过 record_decision，没有绕过规则的路。'},hint:{en:'Which function enforces the S$800 rule?',zh:'哪个函数在执行 S$800 的规则？'}});

 game($('g3'),[
  {en:'A flight cancelled for weather, receipts attached, clearly covered in the wording.',zh:'航班因天气取消，附有收据，条款里明确保障。',a:'e',ex:{en:'The wording alone answers it.',zh:'光靠条款就能回答。'},hint:{en:'Is everything needed in the wording?',zh:'要用的东西条款里都有吗？'}},
  {en:'A small lost-bag claim under the limit with the airline’s report.',zh:'一份有航空公司报告、金额在上限内的小额行李遗失。',a:'e',ex:{en:'A clear rule and clear evidence.',zh:'规则清楚，证据也清楚。'},hint:{en:'Is the rule clear?',zh:'规则清楚吗？'}},
  {en:'A claim where the wording says “reasonable costs” and only the claims manual explains what reasonable means.',zh:'条款写“合理费用”，而“合理”的意思只有理赔手册里才有说明。',a:'h',ex:{en:'The pilot does not have the manual yet. That gap shapes later lessons.',zh:'试点还没有手册。这个差距就是后面几节的重点。'},hint:{en:'Where is the answer written?',zh:'答案写在哪里？'}},
  {en:'A customer who made three similar claims this year.',zh:'今年已经提过三次类似理赔的客户。',a:'h',ex:{en:'The pilot cannot see the customer’s history.',zh:'试点看不到客户的历史。'},hint:{en:'What does the agent not know about this customer?',zh:'智能体不知道这位客户的什么？'}}],[{k:'e',en:'Likely right',zh:'多半能答对'},{k:'h',en:'Likely to struggle',zh:'多半会吃力'}],{en:'Claim',zh:'理赔'});
});
