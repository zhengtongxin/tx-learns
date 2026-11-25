document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 game($('g1'),[
  {en:'What “excess” means in our wording',zh:'我们的措辞里“免赔额”是什么意思',a:'c',ex:{en:'A definition from governance’s glossary: context.',zh:'治理部门术语表里的定义：属于上下文。'},hint:{en:'Is it a definition, a note or a record of what happened?',zh:'它是定义、笔记，还是已发生事情的记录？'}},
  {en:'Mr Tan likes to be told by email, not phone',zh:'Tan 先生喜欢被通知邮件，不喜欢电话',a:'m',ex:{en:'The agent learnt it about a customer: its own notes.',zh:'这是智能体了解到的客户情况：它自己的笔记。'},hint:{en:'Who learnt this, and who may change it?',zh:'谁了解到的，谁可以改？'}},
  {en:'Claim C007 was paid S$1,000 on the ninth',zh:'理赔 C007 在九号赔付了 S$1,000',a:'d',ex:{en:'What happened to a claim is the system of record.',zh:'一份理赔发生过什么，由权威记录保存。'},hint:{en:'Is it a fact about one claim?',zh:'它是关于某一份理赔的事实吗？'}},
  {en:'The baggage limit of the Trip Care plan',zh:'Trip Care 保险计划的行李限额',a:'c',ex:{en:'Plans come from the policy system through governance: context.',zh:'保险计划由保单系统经治理部门提供：属于上下文。'},hint:{en:'Who defines what a plan covers?',zh:'谁来定义一个计划保什么？'}}],[{k:'c',en:'Context layer',zh:'上下文层'},{k:'m',en:'Memory',zh:'记忆'},{k:'d',en:'Database',zh:'数据库'}],{en:'Fact',zh:'事实'});

 predict($('p3'),{q:{en:'A caller with the right key sends a POST to /context/glossary. What comes back?',zh:'带着正确密钥的调用方，向 /context/glossary 发了一个 POST。会返回什么？'},opts:[{k:'a',en:'200, and the glossary changes',zh:'200，术语表被改了'},{k:'b',en:'405, because the service has no write route',zh:'405，因为服务没有写入路由'},{k:'c',en:'401, because the key was wrong',zh:'401，因为密钥错了'}],a:'b',ex:{en:'Only GET routes exist, so a write has nowhere to go. “Read only” is built into the service, not just promised.',zh:'只有 GET 路由，所以写入无处可去。“只读”是做在服务里的，不只是口头承诺。'},hint:{en:'The key was right. Which routes exist?',zh:'密钥是对的。有哪些路由？'}});

 predict($('p6'),{q:{en:'On Monday governance changes the excess from 100 to 150. What does Friday’s old record show?',zh:'星期一，治理部门把免赔额从 100 改成 150。上周五的旧记录显示什么？'},opts:[{k:'a',en:'Still the sum with 100, as it was that day',zh:'仍然是用 100 算的算式，保持当天的样子'},{k:'b',en:'The new sum with 150, updated for it',zh:'用 150 重新算的新算式，自动更新'},{k:'c',en:'Nothing, the record is deleted',zh:'什么都没有，记录被删了'}],a:'a',ex:{en:'The record stores the numbers it used, so an old payout can still be explained after the rule changes.',zh:'记录存下了当时用的数字，所以规则变了以后，旧的赔付依然讲得清楚。'},hint:{en:'Does the record hold numbers or a pointer to a file?',zh:'记录里存的是数字，还是指向文件的指针？'}});
});
