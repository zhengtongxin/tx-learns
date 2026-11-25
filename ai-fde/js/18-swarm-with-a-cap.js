document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 predict($('p2'),{q:{en:'A dispatch is running. Someone clicks start again. What does the service return?',zh:'一次调度正在运行。又有人点了开始。服务返回什么？'},opts:[{k:'a',en:'A 409 error with “A dispatch is already running”',zh:'409 错误，提示“已经有调度在运行”'},{k:'b',en:'It queues the second one behind the first',zh:'把第二个排在第一个后面'},{k:'c',en:'It starts the second at the same time',zh:'同时启动第二个'}],a:'a',ex:{en:'The second start is refused, not queued, so every run has the queue to itself and its numbers stay clean.',zh:'第二次开始是被拒绝，而不是排队，所以每次运行都独占队列，数字保持干净。'},hint:{en:'What does current hold while a run is working?',zh:'运行期间 current 里放的是什么？'}});

 game($('g1'),[
  {en:'Approve, payout S$300, finished',zh:'批准，赔付 S$300，已完成',a:'a',ex:{en:'Approved and under the S$800 limit, so it counts as approved.',zh:'已批准，且没超过 S$800 的限额，所以算“已批准”。'},hint:{en:'Is it over the limit?',zh:'它超过限额了吗？'}},
  {en:'Approve, payout S$1,200, finished',zh:'批准，赔付 S$1,200，已完成',a:'w',ex:{en:'Over S$800, so it waits for a handler’s signature.',zh:'超过 S$800，所以要等理赔员签字。'},hint:{en:'Compare the payout with the limit.',zh:'把赔付和限额比一比。'}},
  {en:'The agent returned “refer”',zh:'智能体返回了“转交”',a:'r',ex:{en:'The agent itself passed the claim on.',zh:'这是智能体自己把理赔交了出去。'},hint:{en:'Did the agent finish, or fail?',zh:'智能体是完成了，还是失败了？'}},
  {en:'Failed twice and was marked “failed”',zh:'失败两次，被标为“失败”',a:'h',ex:{en:'It never produced a decision, so it is left for a handler.',zh:'它没有产生判定，所以留给理赔员。'},hint:{en:'Is there a decision at all?',zh:'有没有判定？'}},
  {en:'Decline, finished',zh:'拒赔，已完成',a:'d',ex:{en:'A finished decline is counted as declined.',zh:'已完成的拒赔归入“拒赔”。'},hint:{en:'Which column matches the action?',zh:'哪一栏和这个动作对应？'}}],[{k:'a',en:'Approved',zh:'已批准'},{k:'w',en:'Waiting for sign-off',zh:'等人签字'},{k:'d',en:'Declined',zh:'拒赔'},{k:'r',en:'Referred',zh:'转交'},{k:'h',en:'Left for a handler',zh:'留给理赔员'}],{en:'Claim',zh:'理赔'});

 predict($('p5'),{q:{en:'The service is down and a claims handler opens a saved copy of the page. What should she see?',zh:'服务挂了，一位理赔员打开的是一份保存下来的页面副本。她该看到什么？'},opts:[{k:'a',en:'A start button that spins forever',zh:'一个一直转圈的开始按钮'},{k:'b',en:'A greyed-out button and a plain line saying the agent service is not running',zh:'灰掉的按钮，和一行大白话说明智能体服务没在运行'},{k:'c',en:'An empty page',zh:'一个空白页'}],a:'b',ex:{en:'People should know what is wrong and who to ask. The page sees the failed /health call and says so.',zh:'人们应该知道出了什么问题、该找谁。页面发现 /health 调用失败，就把它说出来。'},hint:{en:'What would help her most?',zh:'什么对她帮助最大？'}});
});
