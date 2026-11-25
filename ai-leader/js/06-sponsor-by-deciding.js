document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();


 game($('g0'),[
  {en:'The team asks whether supplier invoices may be fed to the system.',zh:'团队问供应商发票能不能交给系统。',a:'s',ex:{en:'What data may be used is a limit, so it is the sponsor\'s call.',zh:'哪些数据可用是一条界限，由发起人决定。'},hint:{en:'Is this a limit or a how-to?',zh:'这是界限，还是做法？'}},
  {en:'The team asks which model to use for the price helper.',zh:'团队问价格助手用哪个模型。',a:'t',ex:{en:'The model is a how-to. Ask for a recommendation and the reason.',zh:'模型属于做法。要一个建议和理由。'},hint:{en:'Could you judge it without learning to code?',zh:'你不学代码能判断吗？'}},
  {en:'Can the system change a price label by itself, without a person?',zh:'系统能不能不经人手，自己改价签？',a:'s',ex:{en:'What it may never do alone is one of the five.',zh:'它绝不能自己做什么，是五个决定之一。'},hint:{en:'It is about what the system is allowed to do.',zh:'问的是系统被允许做什么。'}},
  {en:'What should the system write to its logs?',zh:'系统该把什么写进日志？',a:'t',ex:{en:'Logging is a technical detail. The team decides it.',zh:'日志是技术细节，由团队决定。'},hint:{en:'Does it change the why or the limits?',zh:'它改变“为什么”或界限了吗？'}},
  {en:'Who answers if the system gives a customer a wrong price?',zh:'系统给顾客报错价，谁来负责？',a:'s',ex:{en:'One named person must be accountable, and only the sponsor can name them.',zh:'要有一位点名的负责人，只有发起人能指定。'},hint:{en:'Who can give someone the job?',zh:'谁能把这份责任交给某个人？'}}],[{k:'s',en:'Sponsor decides',zh:'发起人决定'},{k:'t',en:'Team decides',zh:'团队决定'}],{en:'Item',zh:'事项'});


 predict($('p3'),{q:{en:'Which yes is best for a first AI project?',zh:'第一个 AI 项目，哪种“同意”最好？'},opts:[{k:'a',en:'"Yes, go ahead and roll it out."',zh:'“好，放手去做，全面推行。”'},{k:'b',en:'"Yes for four weeks on one store; we review against this number."',zh:'“先做四周，只在一家分店，到时对着这个数字复盘。”'},{k:'c',en:'"Come back when it is perfect."',zh:'“做到完美再来找我。”'}],a:'b',ex:{en:'It is small, it ends on a date, and it is measured. Easy to stop.',zh:'它小，有结束日期，也能衡量，随时能停。'},hint:{en:'Look for a time limit, a size limit and a number.',zh:'找找有没有时间限制、范围限制和数字。'}});
});
