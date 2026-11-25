document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 predict($('p3'),{q:{en:`Each run uses a model for scanning and planning. Which timer setting is wiser overnight?`,zh:`每次运行都要用模型来扫描和规划。夜里哪种定时设置更明智？`},opts:[{k:'a',en:`Every five minutes, with cheap models`,zh:`每五分钟一次，用便宜的模型`},{k:'b',en:`Every ten seconds, for the fastest alerts`,zh:`每十秒一次，让提醒最快`}],a:'a',ex:{en:`Used listings do not vanish in ten seconds, and ten-second runs would burn through money.`,zh:`二手商品不会十秒内就消失，而十秒一次会把钱烧光。`},hint:{en:`How fast does a listing really disappear?`,zh:`一个商品多快会真的消失？`}});
 game($('g4'),[
  {en:`An agent thread puts its log line into the queue.`,zh:`智能体线程把它的日志行放进队列。`,a:'q',ex:{en:`The queue hands lines over safely, one at a time.`,zh:`队列把日志行一个一个安全地交过去。`},hint:{en:`Is it the safe hand-over?`,zh:`这是安全的交接吗？`}},
  {en:`Every agent thread writes straight into the screen's text box.`,zh:`每个智能体线程直接往界面的文本框里写。`,a:'b',ex:{en:`Lines from different threads interleave and get garbled.`,zh:`不同线程的行会交错混乱。`},hint:{en:`What happens when two threads write at once?`,zh:`两个线程同时写会怎样？`}},
  {en:`The screen reads the queue on its own timer.`,zh:`界面在自己的定时器上读取队列。`,a:'q',ex:{en:`The screen decides when to read, so nothing collides.`,zh:`由界面决定何时读取，所以不会冲突。`},hint:{en:`Who controls the pace?`,zh:`谁掌握节奏？`}}],
  [{k:'q',en:`Good: via the queue`,zh:`好：走队列`},{k:'b',en:`Bad idea`,zh:`坏主意`}],{en:'Item',zh:'项目'});
});
