document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 game($('g1'),[
  {en:'Read the traces of the claims that are not held out, and rewrite the prompt',zh:'读没被留出的那些理赔的追踪，然后重写提示词',a:'f',ex:{en:'You are tuning on claims the scoreboard does not use.',zh:'你是在计分板不用的理赔上调试。'},hint:{en:'Are these claims in the held-out list?',zh:'这些理赔在留出名单里吗？'}},
  {en:'Paste a held-out claim and its answer into the prompt as an example',zh:'把一份留出的理赔和它的答案贴进提示词当示例',a:'c',ex:{en:'The agent would have seen the answer, so the score proves nothing.',zh:'智能体等于看过答案，分数什么也证明不了。'},hint:{en:'Has the agent seen it?',zh:'智能体见过它吗？'}},
  {en:'Score every version on the same 10 held-out claims',zh:'每个版本都在同样的 10 份留出理赔上打分',a:'f',ex:{en:'The same exam for every version makes the scores comparable.',zh:'每个版本考同一张卷，分数才能比。'},hint:{en:'Is the set staying the same?',zh:'这组理赔是不是保持不变？'}},
  {en:'Re-pick the held-out set after each run, keeping the claims the agent did well on',zh:'每跑完一轮就重新挑留出集，留下智能体答得好的',a:'c',ex:{en:'You would be choosing the exam to flatter the agent.',zh:'你是在挑考题来讨好智能体。'},hint:{en:'Who is choosing the questions, and why?',zh:'谁在挑题，为什么挑？'}}],[{k:'f',en:'Fair',zh:'公平'},{k:'c',en:'Cheating',zh:'作弊'}],{en:'Action',zh:'做法'});

 predict($('p1'),{q:{en:'A claim’s events: a model call of 2.0 s, a tool call of 0.1 s, 900 s waiting for sign-off (human_wait), then a model call of 1.5 s. What does working_secs return?',zh:'一份理赔的事件：模型调用 2.0 秒，工具调用 0.1 秒，等待签字 900 秒（human_wait），然后模型调用 1.5 秒。working_secs 返回多少？'},opts:[{k:'a',en:'903.6',zh:'903.6'},{k:'b',en:'3.6',zh:'3.6'},{k:'c',en:'900',zh:'900'}],a:'b',out:{en:'2.0 + 0.1 + 1.5 = 3.6',zh:'2.0 + 0.1 + 1.5 = 3.6'},ex:{en:'The 900 seconds of waiting are the handler’s, so they are skipped. Only the agent’s own calls add up.',zh:'900 秒的等待是理赔员的，所以跳过。只有智能体自己的调用才加起来。'},hint:{en:'Which event kind is left out of the sum?',zh:'求和时哪一种事件被排除了？'}});

 game($('g2'),[
  {en:'agreement',zh:'agreement（一致率）',a:'h',ex:{en:'More claims agreeing with the handlers is better.',zh:'和理赔员一致的理赔越多越好。'},hint:{en:'Would you want it to grow?',zh:'你希望它变大吗？'}},
  {en:'kappa',zh:'kappa',a:'h',ex:{en:'More agreement beyond luck is better.',zh:'扣掉运气后的一致越多越好。'},hint:{en:'Would you want it to grow?',zh:'你希望它变大吗？'}},
  {en:'straight_through',zh:'straight_through（直通率）',a:'h',ex:{en:'More claims decided without a referral saves more handler time.',zh:'不用转交就能决定的理赔越多，越省理赔员的时间。'},hint:{en:'Would you want it to grow?',zh:'你希望它变大吗？'}},
  {en:'mistake_cost_sgd',zh:'mistake_cost_sgd（错误成本）',a:'l',ex:{en:'It is money lost to mistakes.',zh:'它是因错误而损失的钱。'},hint:{en:'Would you want to pay more?',zh:'你想多花钱吗？'}},
  {en:'cost_per_claim_usd',zh:'cost_per_claim_usd（每份花费）',a:'l',ex:{en:'It is what each claim costs to run.',zh:'它是每份理赔的运行成本。'},hint:{en:'Would you want to pay more?',zh:'你想多花钱吗？'}},
  {en:'secs_per_claim',zh:'secs_per_claim（每份用时）',a:'l',ex:{en:'Shorter working time per claim is better.',zh:'每份理赔的工作时间越短越好。'},hint:{en:'Would you want it to take longer?',zh:'你希望它花更久吗？'}}],[{k:'h',en:'Higher is better',zh:'越高越好'},{k:'l',en:'Lower is better',zh:'越低越好'}],{en:'Number',zh:'数字'});
});
