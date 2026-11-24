document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 game($('g1'),[
  {en:'Sit next to Aisha for an afternoon and watch how a claim really gets handled.',zh:'在 Aisha 旁边坐一个下午，看一份理赔到底是怎么被处理的。',a:'y',ex:{en:'You cannot automate a process you have not seen.',zh:'没见过的流程，没法自动化。'},hint:{en:'Is this learning the job, or already building?',zh:'这是在了解工作，还是已经在动手做？'}},
  {en:'Pick a model and start coding a claims agent straight away.',zh:'马上挑个模型，开始写理赔智能体。',a:'n',ex:{en:'Too early: you do not yet know what goes in, what comes out or who signs it off.',zh:'太早了：你还不知道进什么、出什么、谁签字。'},hint:{en:'Do you know the job yet?',zh:'你已经了解这份工作了吗？'}},
  {en:'Ask Mr Goh what a wrong payout costs the company.',zh:'问 Mr Goh：一笔错误的赔付会让公司损失什么。',a:'y',ex:{en:'The cost of a mistake shapes how careful the system must be.',zh:'出错的代价决定了系统要多谨慎。'},hint:{en:'Does the answer change how you build?',zh:'这个答案会改变你怎么做吗？'}},
  {en:'Tell the owner that AI will fix everything, then leave to build in your own office.',zh:'对老板说 AI 能解决一切，然后回自己办公室去做。',a:'n',ex:{en:'An FDE stays close to the customer. Building far away loses the daily feedback.',zh:'FDE 要贴近客户。离得远就失去了每天的反馈。'},hint:{en:'Where does a forward-deployed engineer sit?',zh:'前线部署工程师坐在哪里？'}}],[{k:'y',en:'Good first move',zh:'好的第一步'},{k:'n',en:'Too early or wrong',zh:'太早或不对'}],{en:'Move',zh:'做法'});

 predict($('p1'),{q:{en:'Mei Ling’s paragraph says what goes in, what comes out and who signs off, but not what a mistake costs. What is the risk?',zh:'Mei Ling 的这段话写了进什么、出什么、谁签字，但没写出错的代价。风险是什么？'},opts:[{k:'a',en:'Nobody knows how careful the system has to be',zh:'没人知道系统要谨慎到什么程度'},{k:'b',en:'The code will not compile',zh:'代码编译不过'},{k:'c',en:'There is no risk, cost is a detail for later',zh:'没有风险，代价是以后的细节'}],a:'a',ex:{en:'A wrong decline and a wrong payout hurt differently. Without the cost you cannot decide where a human must check.',zh:'错误拒赔和错误赔付伤害不同。不知道代价，就没法决定哪里必须有人把关。'},hint:{en:'Which answer is about how careful to be?',zh:'哪个答案讲的是要多谨慎？'}});

 game($('g2'),[
  {en:'Writing the code that reads a claim and returns a decision.',zh:'写读取理赔并给出决定的代码。',a:'e',ex:{en:'Building the thing is engineering.',zh:'把东西做出来就是工程。'},hint:{en:'Is she building or asking?',zh:'她是在做，还是在问？'}},
  {en:'Noticing that “use AI on claims” really means “stop the same twenty kinds of claim drowning the team”.',zh:'发现“理赔用 AI”其实是“别再让那二十种老一套理赔淹没团队”。',a:'c',ex:{en:'Finding the real problem behind the request is consulting.',zh:'找出需求背后真正的问题，就是咨询。'},hint:{en:'Is she finding the problem?',zh:'她是在找问题吗？'}},
  {en:'Letting Aisha override the helper’s answer and keeping the stamp in her hand.',zh:'让 Aisha 可以改掉帮手的答案，印章仍握在她手里。',a:'t',ex:{en:'People use a tool they feel in control of. That is trust.',zh:'人们愿意用自己掌控得住的工具。这就是信任。'},hint:{en:'Who holds control?',zh:'谁握着控制权？'}},
  {en:'Fixing a bug in the script that loads the policies.',zh:'修掉加载保单的脚本里的 bug。',a:'e',ex:{en:'A bug fix is engineering.',zh:'修 bug 是工程。'},hint:{en:'Is this about code or about people?',zh:'这是关于代码还是关于人？'}},
  {en:'Showing Mr Goh every number the helper used, so he can check them twice.',zh:'把帮手用到的每个数字都给 Mr Goh 看，让他能复核两遍。',a:'t',ex:{en:'Showing the working earns trust from someone who checks everything.',zh:'把过程摊开，才能赢得一个事事都要核对的人的信任。'},hint:{en:'Why does Mr Goh need to see the numbers?',zh:'Mr Goh 为什么要看到这些数字？'}}],[{k:'e',en:'Engineering',zh:'工程'},{k:'c',en:'Consulting',zh:'咨询'},{k:'t',en:'Trust',zh:'信任'}],{en:'Moment',zh:'时刻'});

 predict($('p2'),{q:{en:'The helper is 95% accurate, but it declines a few honest customers by mistake. Who is unhappy, and what does that tell Mei Ling?',zh:'帮手准确率 95%，但会误拒几位诚实的客户。谁会不满？这对 Mei Ling 意味着什么？'},opts:[{k:'a',en:'Mr Goh: accuracy is all that matters',zh:'Mr Goh：只有准确率重要'},{k:'b',en:'Aisha: fairness counts too, so “good” needs more than one number',zh:'Aisha：公平也算数，所以“好”不能只看一个数字'},{k:'c',en:'Nobody: 95% is always enough',zh:'没人：95% 永远够了'}],a:'b',ex:{en:'Different owners count different things. Agree on all of them before building.',zh:'不同的人看不同的东西。开工前要把它们全部谈拢。'},hint:{en:'Who counts fairness?',zh:'谁看公平？'}});

 var PP=[
  {n:'pilot',nt:{en:'A first working version the customer can react to.',zh:'第一个能让客户有反应的可运行版本。'}},
  {n:'model',nt:{en:'Pick the model that is good enough for the job and its cost.',zh:'选一个够用又划算的模型。'}},
  {n:'harness',nt:{en:'The code around the model: tools, turns and limits.',zh:'包在模型外面的代码：工具、轮次、限制。'}},
  {n:'measure',nt:{en:'Score the agent so “good” is a number, not a feeling.',zh:'给智能体打分，让“好”是数字而不是感觉。'}},
  {n:'memory',nt:{en:'Let it remember manuals and returning customers.',zh:'让它记住手册和老客户。'}},
  {n:'pause',nt:{en:'Make it safe to wait for a human, or to resume after a crash.',zh:'让它能安全地等人批准，崩溃后也能接着干。'}},
  {n:'improve',nt:{en:'Use the scores to make it better, with a human approving changes.',zh:'用分数让它变好，改动由人批准。'}},
  {n:'secure',nt:{en:'Guard against hidden instructions, leaked keys and bad inputs.',zh:'防范藏起来的指令、泄漏的密钥和恶意输入。'}},
  {n:'hand over',nt:{en:'Leave something the team can run without you.',zh:'留下一个没有你团队也能跑的东西。'}}];
 var pp=$('pp');pp.innerHTML=PP.map(function(v,i){return '<button class="pill" data-i="'+i+'">'+(i+1)+' · '+v.n+'</button>'}).join('');
 function pps(i){pp.querySelectorAll('.pill').forEach(function(b,k){b.classList.toggle('on',k===i)});
  $('pcode').innerHTML=PP.map(function(v,k){return k===i?'<span class="chg">'+(k+1)+'. '+v.n+'</span>':'<span class="dim">'+(k+1)+'. '+v.n+'</span>'}).join('\n');
  $('pnote').innerHTML=T(PP[i].nt)}
 pp.querySelectorAll('.pill').forEach(function(b){b.onclick=function(){pps(+b.dataset.i)}});pps(0);
 predict($('p3'),{q:{en:'Why does “measure” come before “improve”?',zh:'为什么“衡量”排在“改进”前面？'},opts:[{k:'a',en:'You cannot tell whether a change helped without a score',zh:'没有分数，就没法知道改动有没有帮助'},{k:'b',en:'It is just alphabetical',zh:'只是按字母顺序'}],a:'a',ex:{en:'Improving without measuring is guessing.',zh:'没有衡量就改进，只是在猜。'},hint:{en:'How would you know it got better?',zh:'你怎么知道它变好了？'}});
});
