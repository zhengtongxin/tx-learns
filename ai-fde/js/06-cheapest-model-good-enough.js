document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 game($('g1'),[
  {en:'Matches the handlers on at least 90% of easy claims',zh:'简单理赔上至少 90% 和理赔员一致',a:'b',ex:{en:'A clear accuracy line, on the claims that should be simple.',zh:'一条清楚的准确率线，针对本该简单的理赔。'},hint:{en:'Is it a number the customer can check?',zh:'这是客户能核对的数字吗？'}},
  {en:'Never approves a big payout the handlers did not approve',zh:'绝不批准理赔员没批准的大额赔付',a:'b',ex:{en:'Some mistakes cost far more than others, so they get their own line.',zh:'有些错误的代价高得多，所以单独一条。'},hint:{en:'Would one such mistake hurt?',zh:'这样的错误出一次会疼吗？'}},
  {en:'Answers within 5 seconds',zh:'5 秒内给出答案',a:'b',ex:{en:'Speed is a real need on a busy queue, so write it down.',zh:'队列忙的时候速度是真需求，要写下来。'},hint:{en:'Would a slow model hold up the desk?',zh:'慢的模型会拖住理赔台吗？'}},
  {en:'The model has the most impressive name',zh:'模型的名字最响亮',a:'o',ex:{en:'A name is not a requirement.',zh:'名字不是需求。'},hint:{en:'Can you measure it?',zh:'能量出来吗？'}},
  {en:'It is the newest release',zh:'它是最新发布的',a:'o',ex:{en:'New is not the same as good enough for this job.',zh:'新不等于够用。'},hint:{en:'Does newest mean it passes our claims?',zh:'最新就意味着能过我们的理赔吗？'}}],[{k:'b',en:'In the bar',zh:'写进标准线'},{k:'o',en:'Leave out',zh:'不用写'}],{en:'Item',zh:'内容'});

 predict($('p2'),{q:{en:'A model’s two runs cost US$0.05 in total for 25 claims each (50 claims). What is the cost per 1,000 claims?',zh:'一个模型两遍加起来共花 0.05 美元，每遍 25 份理赔（共 50 份）。每 1,000 份理赔的成本是多少？'},opts:[{k:'a',en:'US$1',zh:'1 美元'},{k:'b',en:'US$2.50',zh:'2.50 美元'},{k:'c',en:'US$50',zh:'50 美元'}],a:'a',out:{en:'0.05 ÷ 50 × 1,000 = US$1',zh:'0.05 ÷ 50 × 1,000 = 1 美元'},ex:{en:'The 0.05 covers 50 claims, so one claim is US$0.001 and 1,000 are US$1. That is why the code divides by n, the number of attempts across both runs.',zh:'0.05 对应 50 份，所以一份 0.001 美元，1,000 份就是 1 美元。这就是代码要除以 n（两遍的总次数）的原因。'},hint:{en:'Divide by 50, not 25.',zh:'要除以 50，不是 25。'}});

 game($('g2'),[
  {en:'Model A: 96% on easy, no big mistakes, 9 seconds, US$6 per 1,000',zh:'模型 A：简单理赔 96%，没有大错，9 秒，每 1,000 份 6 美元',a:'f',ex:{en:'Very accurate, but 9 seconds is over the 5-second limit.',zh:'很准，但 9 秒超过了 5 秒的上限。'},hint:{en:'Check the seconds line.',zh:'看看秒数那一条。'}},
  {en:'Model B: 92% on easy, no big mistakes, 3 seconds, US$1.80 per 1,000',zh:'模型 B：简单理赔 92%，没有大错，3 秒，每 1,000 份 1.80 美元',a:'c',ex:{en:'It passes all three lines.',zh:'三条都过了。'},hint:{en:'Check each of the three lines.',zh:'三条逐一核对。'}},
  {en:'Model C: 88% on easy, no big mistakes, 2 seconds, US$0.40 per 1,000',zh:'模型 C：简单理赔 88%，没有大错，2 秒，每 1,000 份 0.40 美元',a:'f',ex:{en:'Cheap and fast, but 88% is under the 90% line.',zh:'便宜又快，但 88% 低于 90% 的线。'},hint:{en:'Check the accuracy line.',zh:'看看准确率那一条。'}},
  {en:'Model D: 94% on easy, 1 wrongly approved big payout, 4 seconds, US$0.90 per 1,000',zh:'模型 D：简单理赔 94%，错批 1 笔大额赔付，4 秒，每 1,000 份 0.90 美元',a:'f',ex:{en:'One wrongly approved big payout breaks a line that allows none.',zh:'错批一笔大额赔付，就违反了一笔都不许的那条线。'},hint:{en:'Check the “never” line.',zh:'看看“绝不”那一条。'}},
  {en:'Model E: 91% on easy, no big mistakes, 4 seconds, US$3.50 per 1,000',zh:'模型 E：简单理赔 91%，没有大错，4 秒，每 1,000 份 3.50 美元',a:'c',ex:{en:'It passes all three lines, just at a higher price.',zh:'三条都过了，只是价格更高。'},hint:{en:'Price is not part of the bar.',zh:'价格不在标准线里。'}}],[{k:'c',en:'Clears the bar',zh:'过线'},{k:'f',en:'Does not clear',zh:'没过线'}],{en:'Model',zh:'模型'});

 predict($('p3'),{q:{en:'The cheap model costs US$2 per 1,000 claims and the strong one US$12. Of 1,000 claims, the cheap model refers 100 to the strong one. What does the router cost for all 1,000?',zh:'便宜模型每 1,000 份理赔 2 美元，强模型 12 美元。1,000 份理赔里，便宜模型把 100 份转给了强模型。路由器处理这 1,000 份一共多少钱？'},opts:[{k:'a',en:'US$3.20',zh:'3.20 美元'},{k:'b',en:'US$12',zh:'12 美元'},{k:'c',en:'US$14',zh:'14 美元'}],a:'a',out:{en:'cheap: 1,000 claims = US$2. strong: 100 claims = 100 ÷ 1,000 × 12 = US$1.20. total US$3.20',zh:'便宜的：1,000 份 = 2 美元。强的：100 份 = 100 ÷ 1,000 × 12 = 1.20 美元。合计 3.20 美元'},ex:{en:'Every claim goes to the cheap model, but only a tenth also go to the strong one. That is far below US$12 for the strong model on everything.',zh:'每份都先交给便宜模型，只有十分之一再交给强模型。远低于全部交给强模型的 12 美元。'},hint:{en:'The cheap model sees all 1,000. The strong one sees only 100.',zh:'便宜模型看全部 1,000 份，强模型只看 100 份。'}});

});
