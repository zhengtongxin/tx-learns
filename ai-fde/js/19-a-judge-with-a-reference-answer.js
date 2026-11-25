document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 game($('g1'),[
  {en:'The agent’s explanation',zh:'智能体的解释',a:'i',ex:{en:'It is the thing being graded.',zh:'它就是被评分的对象。'},hint:{en:'What is the judge grading?',zh:'评委在给什么打分？'}},
  {en:'The handler’s reason',zh:'理赔员的理由',a:'i',ex:{en:'It is the reference answer.',zh:'它是参考答案。'},hint:{en:'What does it compare against?',zh:'它拿什么来对照？'}},
  {en:'The grading rubric: what A, B, C and F mean',zh:'评分标准：A、B、C、F 各是什么意思',a:'i',ex:{en:'Without it, each run would invent its own scale.',zh:'没有它，每一轮都会自己发明一套标准。'},hint:{en:'Who decides what a B means?',zh:'B 是什么意思，谁来定？'}},
  {en:'Which model wrote the explanation',zh:'解释是哪个模型写的',a:'o',ex:{en:'It has nothing to do with whether the grounds match, and it could sway the grade.',zh:'它和理由是否一致无关，还可能左右评分。'},hint:{en:'Does it help compare grounds?',zh:'它有助于比较理由吗？'}},
  {en:'The grade you hope the explanation gets',zh:'你希望解释得到的等级',a:'o',ex:{en:'A judge told the answer it should reach is not judging.',zh:'被告知该给什么结果的评委，就不是在评判。'},hint:{en:'Would you tell a marker the mark in advance?',zh:'你会事先告诉评分员该打几分吗？'}}],[{k:'i',en:'In the prompt',zh:'放进提示词'},{k:'o',en:'Leave out',zh:'不要放'}],{en:'Item',zh:'项目'});

 predict($('p3'),{q:{en:'Your grades for the longer half average 1.6. The judge’s average 2.4 for the same claims. What now?',zh:'较长的那一半，你打的平均是 1.6，评委打的平均是 2.4。接下来怎么办？'},opts:[{k:'a',en:'Trust the judge; it read more carefully than you',zh:'信评委；它读得比你仔细'},{k:'b',en:'Add a rule that length earns nothing, then measure again against your grades',zh:'加一条“长度不加分”的规则，再拿你的分数重新比一次'},{k:'c',en:'Delete the long explanations from the test',zh:'把长的解释从测试里删掉'}],a:'b',ex:{en:'The gap says the judge leans toward long text. Fix the prompt, then check again.',zh:'这个差距说明评委偏向长文。改提示词，再检查一次。'},hint:{en:'Which option fixes the judge instead of hiding the problem?',zh:'哪个选项是修好评委，而不是把问题藏起来？'}});

 predict($('p4'),{q:{en:'After a prompt change, the mean judge score goes from 1.9 to 2.1. The noise is 0.3. What can you say?',zh:'改了提示词之后，评委的平均分从 1.9 变成 2.1。噪声是 0.3。你能说什么？'},opts:[{k:'a',en:'It improved by 0.2, so the change worked',zh:'提高了 0.2，所以改动有效'},{k:'b',en:'0.2 is smaller than the noise, so we cannot tell yet',zh:'0.2 比噪声小，所以现在还说不准'},{k:'c',en:'It got worse, because 2.1 is above 1.9',zh:'变差了，因为 2.1 大于 1.9'}],a:'b',ex:{en:'The same setup could swing by 0.3 on its own. Only a bigger move counts.',zh:'同样的设置，自己就可能晃动 0.3。只有更大的变化才算数。'},hint:{en:'Compare the change with the noise, not with zero.',zh:'拿变化和噪声比，而不是和零比。'}});
});
