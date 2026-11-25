document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 game($('g1'),[
  {en:'A Python dictionary in the session’s memory',zh:'会话内存里的一个 Python 字典',a:'l',ex:{en:'Memory goes with the session.',zh:'内存随会话一起消失。'},hint:{en:'Where does the dictionary live?',zh:'这个字典放在哪里？'}},
  {en:'A text file written to the session’s own disk',zh:'写在会话自己磁盘上的文本文件',a:'l',ex:{en:'The disk belongs to that one session copy.',zh:'这块磁盘只属于那一份会话副本。'},hint:{en:'Is the disk shared between sessions?',zh:'磁盘在会话之间共享吗？'}},
  {en:'A row in a hosted database',zh:'托管数据库里的一行',a:'k',ex:{en:'It lives outside every session.',zh:'它活在所有会话之外。'},hint:{en:'Does the session own the database?',zh:'会话拥有这个数据库吗？'}},
  {en:'A background thread that is still running',zh:'一个还在跑的后台线程',a:'l',ex:{en:'The runtime ends an idle session even if a thread is busy, unless the ping says busy.',zh:'线程再忙，空闲的会话也会被结束，除非 ping 说“忙”。'},hint:{en:'Can the runtime see inside your threads?',zh:'运行时看得到你的线程里面吗？'}}],[{k:'k',en:'Survives',zh:'活下来'},{k:'l',en:'Lost',zh:'丢失'}],{en:'Item',zh:'东西'});

 predict($('p5'),{q:{en:'Why does reporting “busy” in /ping fix a job that kept ending mid-run?',zh:'为什么在 /ping 里报告“忙”，能修好总在半路停掉的任务？'},opts:[{k:'a',en:'The runtime can now see the session is working, so it is not counted as idle',zh:'运行时现在能看出会话在工作，不再把它算作空闲'},{k:'b',en:'It makes the job run faster',zh:'它让任务跑得更快'},{k:'c',en:'It stops the runtime from ever ending a session',zh:'它让运行时再也不会结束会话'}],a:'a',ex:{en:'The job was always working. The runtime just could not tell. A busy ping, honestly set, tells it.',zh:'任务一直在工作，只是运行时看不出来。一个如实设置的忙碌 ping 就能告诉它。'},hint:{en:'What did the runtime think the session was doing?',zh:'运行时以为会话在干什么？'}});

 predict($('p6'),{q:{en:'A claim waits for sign-off. The session that parked it ends. An hour later Aisha signs off, and a new session gets the answer. Why can it still pay?',zh:'一份理赔在等签字。把它存起来的会话结束了。一小时后 Aisha 签了字，一个新会话收到答复。为什么它还能付款？'},opts:[{k:'a',en:'The waiting claim was saved in a database under its claim id, not in the old session',zh:'等待中的理赔按理赔编号存在数据库里，不在旧会话里'},{k:'b',en:'The runtime keeps old sessions open for hours',zh:'运行时会把旧会话开着好几个小时'},{k:'c',en:'The new session guesses the claim from the amount',zh:'新会话根据金额猜出是哪份理赔'}],a:'a',ex:{en:'Anything that must outlive a session lives outside it.',zh:'凡是要活得比会话久的东西，都放在会话外面。'},hint:{en:'Look at where park() writes.',zh:'看 park() 往哪里写。'}});
});
