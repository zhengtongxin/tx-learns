document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 game($('g1'),[
  {en:'The wording of the extra instructions',zh:'额外指令的措辞',a:'p',ex:{en:'It is one of the three fields, and a person approves it first.',zh:'它是三个字段之一，而且要先经人批准。'},hint:{en:'Is it one of instructions, model or effort?',zh:'它是指令、模型、力度三者之一吗？'}},
  {en:'The reasoning effort',zh:'推理力度',a:'p',ex:{en:'It is one of the three fields.',zh:'它是三个字段之一。'},hint:{en:'Is it one of the three?',zh:'它是三者之一吗？'}},
  {en:'Which claims are held out',zh:'哪些理赔被留出',a:'n',ex:{en:'If the improver could pick the exam, it would pick an easy one.',zh:'如果改进者能挑考卷，它会挑一份容易的。'},hint:{en:'Who should choose the exam?',zh:'该由谁来挑考卷？'}},
  {en:'The rule that decides keep or roll back',zh:'决定留下还是回滚的规则',a:'n',ex:{en:'The improver must not be able to move the goalposts.',zh:'改进者不能自己挪球门。'},hint:{en:'Can it mark its own work?',zh:'它能给自己的作业打分吗？'}},
  {en:'The S$800 limit above which a handler must sign',zh:'超过需要理赔员签字的 S$800 限额',a:'n',ex:{en:'It is a safety rule for payouts, not a tuning knob.',zh:'它是赔付的安全规则，不是调节旋钮。'},hint:{en:'Is it about quality, or about safety?',zh:'它关乎质量，还是关乎安全？'}}],[{k:'p',en:'May propose (with approval)',zh:'可以提议（要批准）'},{k:'n',en:'Never the improver’s to change',zh:'绝不归改进者改'}],{en:'Item',zh:'项目'});

 predict($('p4'),{q:{en:'A new version scores higher on the practice claims, but on the held-out claims agreement drops from 80% to 70%. What does the code do?',zh:'一个新版本在练习理赔上分数更高，但在留出理赔上，一致率从 80% 掉到 70%。代码怎么处理？'},opts:[{k:'a',en:'Keeps it, because the practice score went up',zh:'留下，因为练习分数涨了'},{k:'b',en:'Rolls it back, because only the held-out scores decide',zh:'回滚，因为只有留出理赔的分数说了算'},{k:'c',en:'Asks the improver whether to keep it',zh:'问改进者要不要留下'}],a:'b',ex:{en:'Practice scores can be gamed by tuning to what the improver has seen. The held-out claims cannot.',zh:'练习分数可以靠迎合改进者见过的东西来刷高。留出的理赔刷不了。'},hint:{en:'Which claims has the improver never seen?',zh:'改进者从没见过哪些理赔？'}});

 predict($('p6'),{q:{en:'Aisha puts version 1 back in use. What happens to versions 2 to 5?',zh:'Aisha 把版本 1 放回使用。版本 2 到 5 会怎样？'},opts:[{k:'a',en:'They are deleted',zh:'被删除'},{k:'b',en:'They stay on the page with their scores; only the pointer moved, and the move is logged',zh:'带着分数留在页面上；只是指针动了，而且这次移动有记录'},{k:'c',en:'They are re-run on the held-out claims',zh:'在留出理赔上重新跑一遍'}],a:'b',ex:{en:'Nothing is rubbed out, so the history stays complete.',zh:'什么都不擦掉，所以历史保持完整。'},hint:{en:'Does going back erase anything?',zh:'回头会擦掉什么吗？'}});
});
