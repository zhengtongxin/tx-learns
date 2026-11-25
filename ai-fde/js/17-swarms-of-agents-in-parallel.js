document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 predict($('p2'),{q:{en:'Each stand-in sleeps about 1 second. With the Step 1 dispatcher, roughly how long do 25 claims take?',zh:'每个替身大约睡 1 秒。用第 1 步的调度器，25 份理赔大约要多久？'},opts:[{k:'a',en:'About 25 seconds',zh:'约 25 秒'},{k:'b',en:'About 1 to 1.5 seconds',zh:'约 1 到 1.5 秒'},{k:'c',en:'About 5 seconds',zh:'约 5 秒'}],a:'b',out:{en:'all 25 sleep at the same time, so the total is the slowest one',zh:'25 个同时睡，所以总时间就是最慢的那一个'},ex:{en:'With no cap, everything starts together and the total is the slowest claim.',zh:'没有上限时，所有任务一起开始，总时间就是最慢的那份。'},hint:{en:'Do the sleeps add up, or overlap?',zh:'这些睡眠是累加还是重叠？'}});

 predict($('p4'),{q:{en:'25 claims, each takes 30 seconds, a cap of 5. About how long does the whole batch take?',zh:'25 份理赔，每份 30 秒，上限为 5。整批大约要多久？'},opts:[{k:'a',en:'30 seconds',zh:'30 秒'},{k:'b',en:'150 seconds',zh:'150 秒'},{k:'c',en:'750 seconds',zh:'750 秒'}],a:'b',out:{en:'25 ÷ 5 = 5 rounds × 30 seconds = 150 seconds',zh:'25 ÷ 5 = 5 轮 × 30 秒 = 150 秒'},ex:{en:'Five agents work at a time, so there are five rounds. One at a time would be 750 seconds, all at once 30.',zh:'同时有五个在干，所以是五轮。一个一个做是 750 秒，全部同时是 30 秒。'},hint:{en:'How many rounds of five fit into 25?',zh:'25 里能装几轮“五个”？'}});

 game($('g1'),[
  {en:'The provider says “too many requests, slow down”',zh:'供应商说“请求太多，慢一点”',a:'w',ex:{en:'A rate limit is a wait. The same attempt carries on later.',zh:'速率限制就是等待。同一次尝试稍后继续。'},hint:{en:'Is the claim itself wrong?',zh:'理赔本身有问题吗？'}},
  {en:'The model takes too long and the request times out',zh:'模型花太久，请求超时',a:'w',ex:{en:'A timeout is also “not now”: wait and ask again.',zh:'超时同样是“现在不行”：等一等再问。'},hint:{en:'Is it the claim’s fault, or the wait’s?',zh:'是理赔的问题，还是等待的问题？'}},
  {en:'The agent returns an answer the code cannot read, the first time',zh:'智能体第一次返回了代码读不懂的答案',a:'b',ex:{en:'A real failure goes back once.',zh:'真正的失败退回一次。'},hint:{en:'Is it a wait, or a real error?',zh:'是等待，还是真正的错误？'}},
  {en:'The same claim gives an unreadable answer a second time',zh:'同一份理赔第二次又返回了读不懂的答案',a:'h',ex:{en:'Two real failures: stop trying and leave it for a handler.',zh:'两次真正的失败：不再尝试，留给理赔员。'},hint:{en:'How many real failures is the limit?',zh:'真正的失败最多允许几次？'}}],[{k:'w',en:'Wait, same attempt',zh:'等待，同一次尝试'},{k:'b',en:'Go back once',zh:'退回一次'},{k:'h',en:'Leave for a handler',zh:'留给理赔员'}],{en:'What happened',zh:'发生了什么'});
});
