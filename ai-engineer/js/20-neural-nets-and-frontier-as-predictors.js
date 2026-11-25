document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 predict($('p3'),{q:{en:'A reply says "About $120 maybe". What does the regex return?',zh:'回复是“About $120 maybe”。正则会返回什么？'},opts:[{k:'a',en:'<code>120.0</code>',zh:'<code>120.0</code>'},{k:'b',en:'The whole sentence',zh:'整句话'}],a:'a',ex:{en:'The regex pulls out the first number and ignores the extra words.',zh:'正则抠出第一个数字，忽略多余的词。'},hint:{en:'What does <code>match.group()</code> hold?',zh:'<code>match.group()</code> 里是什么？'}});
 game($('g4'),[
  {en:'Score every predictor on the same test set with the same evaluate.',zh:'所有预测器在同一个测试集上、用同一个 evaluate 打分。',a:'fair',ex:{en:'Only a shared test makes the numbers comparable.',zh:'只有共用测试，数字才能比较。'},hint:{en:'Is the exam the same for all?',zh:'大家的考卷一样吗？'}},
  {en:'Test the neural net on easy items and the frontier model on hard ones.',zh:'神经网络考简单的，大模型考难的。',a:'unfair',ex:{en:'Different questions give different scores, so nothing compares.',zh:'题目不同，分数就不同，没法比较。'},hint:{en:'Are they facing the same questions?',zh:'它们面对的是同样的题吗？'}},
  {en:'Report only error and hide the cost per call.',zh:'只报误差，隐藏每次调用的成本。',a:'unfair',ex:{en:'A tiny gain at ten times the cost is a different story. Pick by error and cost.',zh:'提升一点点却贵十倍，结论就不同了。要按误差和成本一起选。'},hint:{en:'Does a big model cost anything per call?',zh:'大模型每次调用要花钱吗？'}}],[{k:'fair',en:'Fair comparison',zh:'公平比较'},{k:'unfair',en:'Unfair',zh:'不公平'}],{en:'Verdict',zh:'判断'});
});
