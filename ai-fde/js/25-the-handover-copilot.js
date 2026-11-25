document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 predict($('p2'),{q:{en:'The junior handler asks the copilot to pay S$1,200. What happens?',zh:'初级理赔员让助手付 S$1,200。会怎样？'},opts:[{k:'a',en:'It is refused, because the copilot has only the handler’s own limit of S$800',zh:'被拒绝，因为助手只有这位理赔员自己的 S$800 限额'},{k:'b',en:'It goes through, because the copilot is a trusted system',zh:'通过，因为助手是受信任的系统'},{k:'c',en:'It goes through, but with a warning',zh:'通过，但带一条警告'}],a:'a',ex:{en:'The copilot is not a second, stronger user. It borrows the permissions of the one who asked.',zh:'助手不是另一个更强的用户。它借用的是提问者的权限。'},hint:{en:'Whose token and limit does allowed() use?',zh:'allowed() 用的是谁的令牌和限额？'}});

 game($('g1'),[
  {en:'Look up a claim in the records',zh:'在记录里查一份理赔',a:'r',ex:{en:'It only reads, and it is logged as a step.',zh:'它只读，并且会记成一个步骤。'},hint:{en:'Does it change anything?',zh:'它会改变什么吗？'}},
  {en:'Read the claims manual from the context layer',zh:'从上下文层读理赔手册',a:'r',ex:{en:'Read only, so no question is needed.',zh:'只读，不需要问。'},hint:{en:'Can the agent write to context?',zh:'智能体能写上下文吗？'}},
  {en:'Send a large payout back with a note',zh:'把一笔大额赔付附上说明退回',a:'r',ex:{en:'It moves no money. It asks the agent to decide again, and a person still signs the new result.',zh:'它不动钱。它让智能体重新判定，新的结果仍由人来签。'},hint:{en:'Does money leave the building?',zh:'钱会离开吗？'}},
  {en:'Pay a claim',zh:'给一份理赔付款',a:'q',ex:{en:'Money cannot be taken back, so the handler’s own click comes first.',zh:'钱发出去收不回来，所以先要理赔员自己点一下。'},hint:{en:'Which action cannot be undone?',zh:'哪个动作撤不回？'}}],[{k:'r',en:'Runs straight away',zh:'直接执行'},{k:'q',en:'Asks first',zh:'先问'}],{en:'Action',zh:'动作'});

 predict($('p5'),{q:{en:'Why write the success criteria on the first day of the pilot instead of at the end?',zh:'为什么要在试点第一天就写下成功标准，而不是最后才写？'},opts:[{k:'a',en:'Goals written afterwards tend to fit what the pilot already did, so they prove nothing',zh:'事后写的目标往往正好贴合试点已经做到的，什么也证明不了'},{k:'b',en:'The checker script cannot run on the last day',zh:'检查脚本在最后一天跑不了'},{k:'c',en:'It makes the pilot cheaper',zh:'这样试点更便宜'}],a:'a',ex:{en:'A target you set before you see the result is a real test. One set after is a description.',zh:'看到结果之前定的目标，才是真正的考试。看到之后定的，只是一份描述。'},hint:{en:'Which is harder to bend: a goal set before or after?',zh:'哪个更难被迁就：事前定的目标，还是事后定的？'}});
});
