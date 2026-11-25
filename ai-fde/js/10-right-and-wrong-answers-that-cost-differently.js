document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 game($('g1'),[
  {en:'The agent approves a lost-bag claim that the handler would have declined',zh:'智能体批准了一份丢行李的理赔，理赔员本会拒绝',a:'p',ex:{en:'Money went out that should not have.',zh:'不该出的钱出去了。'},hint:{en:'Did money leave the company?',zh:'公司的钱有没有流出去？'}},
  {en:'The agent declines a flight-delay claim that the handler would have approved',zh:'智能体拒绝了一份航班延误理赔，理赔员本会批准',a:'d',ex:{en:'A customer who is owed money is told no.',zh:'一位该拿到钱的客户被说了不。'},hint:{en:'Who got a no they did not deserve?',zh:'谁收到了不该收到的“不”？'}},
  {en:'The agent refers a plain S$60 claim that the handler would have approved in a minute',zh:'智能体把一份普通的 S$60 理赔转了过来，理赔员一分钟就会批准',a:'r',ex:{en:'Nothing went wrong except handler time.',zh:'除了理赔员的时间，没有别的损失。'},hint:{en:'Was anyone paid or refused wrongly?',zh:'有人被错赔或错拒吗？'}},
  {en:'The agent approves a tricky claim that the handler would have referred',zh:'智能体批准了一份刁钻的理赔，理赔员本会转交',a:'p',ex:{en:'The money moved before a human looked, so it counts as a wrongful payment.',zh:'钱在人看过之前就动了，所以算错付。'},hint:{en:'It paid when it should have waited.',zh:'该等的时候它赔了。'}},
  {en:'The agent declines a claim that the handler would have referred',zh:'智能体拒绝了一份理赔，理赔员本会转交',a:'d',ex:{en:'The customer was told no before anyone looked.',zh:'没人看过，客户就被说了不。'},hint:{en:'The agent said no. Who did it affect?',zh:'智能体说了不，影响的是谁？'}}],[{k:'p',en:'Wrongful payment',zh:'错付'},{k:'d',en:'Wrongful decline',zh:'错拒'},{k:'r',en:'Needless referral',zh:'白转交'}],{en:'Mistake',zh:'错误'});

 predict($('p5'),{q:{en:'Agent A makes 4 wrongful payments and 2 needless referrals. With the prices in PRICE, what is A’s total mistake cost?',zh:'智能体 A 有 4 笔错付、2 次白转交。按 PRICE 里的价格，A 的错误总成本是多少？'},opts:[{k:'a',en:'S$1,630',zh:'S$1,630'},{k:'b',en:'S$1,600',zh:'S$1,600'},{k:'c',en:'S$495',zh:'S$495'}],a:'a',out:{en:'4 × 400 + 0 × 150 + 2 × 15 = 1,630\nAgent B: 0 × 400 + 3 × 150 + 3 × 15 = 495',zh:'4 × 400 + 0 × 150 + 2 × 15 = 1,630\n智能体 B：0 × 400 + 3 × 150 + 3 × 15 = 495'},ex:{en:'Both agents agree 76% of the time, yet A’s mistakes cost more than three times B’s. S$495 is B’s total, not A’s. And do not forget the two referrals.',zh:'两个智能体都是 76% 一致，但 A 的错误成本是 B 的三倍多。S$495 是 B 的总数，不是 A 的。别忘了那两次转交。'},hint:{en:'Add the three kinds: 4 × 400, then 0 × 150, then 2 × 15.',zh:'把三种加起来：4 × 400，再 0 × 150，再 2 × 15。'}});

 game($('g2'),[
  {en:'Both agents agree 76% of the time',zh:'两个智能体都有 76% 的一致',a:'n',ex:{en:'It is the same for both, so it cannot choose between them.',zh:'两个一样，没法在它们之间做选择。'},hint:{en:'Does it differ between A and B?',zh:'A 和 B 有差别吗？'}},
  {en:'A makes 4 wrongful payments, B makes none',zh:'A 有 4 笔错付，B 一笔都没有',a:'y',ex:{en:'The costliest kind of mistake differs a lot.',zh:'代价最高的那一种错误差得很远。'},hint:{en:'Which mistake is the expensive one?',zh:'哪种错误最贵？'}},
  {en:'The total cost: A S$1,630, B S$495',zh:'总成本：A S$1,630，B S$495',a:'y',ex:{en:'It puts all the mistakes into one number the owners understand.',zh:'它把所有错误变成了老板们看得懂的一个数。'},hint:{en:'Does it show the money at risk?',zh:'它能看出风险的金额吗？'}},
  {en:'A’s straight-through rate is 76% and B’s is 72%',zh:'A 的直通率 76%，B 的 72%',a:'y',ex:{en:'It shows what A gains for the extra risk, so it is worth reporting beside the cost.',zh:'它显示了 A 为多担的风险换来了什么，所以值得和成本放在一起报。'},hint:{en:'Does it say how much work the agent saves?',zh:'它说明智能体省了多少活吗？'}}],[{k:'y',en:'Matters for the choice',zh:'对选择有用'},{k:'n',en:'Cannot tell them apart',zh:'分不出高下'}],{en:'Number',zh:'数字'});
});
