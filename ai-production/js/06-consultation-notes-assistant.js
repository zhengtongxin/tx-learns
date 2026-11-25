document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 predict($('t0'),{q:{en:'Which date string should the form send to the API?',zh:'表单应该把哪种日期字符串发给 API？'},opts:[{k:'a',en:'<code>23/11/26</code>',zh:'<code>23/11/26</code>'},{k:'b',en:'<code>2026-11-23</code>',zh:'<code>2026-11-23</code>'},{k:'c',en:'<code>Monday, the twenty-third</code>',zh:'<code>Monday, the twenty-third</code>'}],a:'b',ex:{en:'ISO dates are unambiguous. I once sent the wrong format and the API refused it.',zh:'ISO 日期没有歧义。我曾经发错格式，被 API 拒绝了。'},hint:{en:'Year first, then month, then day.',zh:'先年，再月，再日。'}});
 game($('t2'),[
  {en:'"Patient reports a sore throat for 3 days; temperature 38.2."',zh:'“病人诉咽痛 3 天；体温 38.2。”',a:'r',ex:{en:'Factual and short: this belongs in the records.',zh:'客观简短，属于档案。'},hint:{en:'Is it a plain fact for the file?',zh:'它是给档案的客观事实吗？'}},
  {en:'"Book a follow-up call on Friday and check the lab result."',zh:'“周五安排回访电话，并查看化验结果。”',a:'n',ex:{en:'A to-do list for the nurse.',zh:'这是给护士的待办清单。'},hint:{en:'Is it something someone must do?',zh:'它是需要有人去做的事吗？'}},
  {en:'"Hello, your throat should feel better in a few days. Please rest and drink water."',zh:'“您好，几天后喉咙应该会好些。请多休息、多喝水。”',a:'e',ex:{en:'Plain, warm language written for the patient.',zh:'写给病人的通俗、温和的话。'},hint:{en:'Who would read this sentence?',zh:'这句话是写给谁看的？'}},
  {en:'"Continue to monitor, review in 48h if no improvement."',zh:'“继续观察，如无好转 48 小时后复查。”',a:'n',ex:{en:'An instruction for the professional.',zh:'这是对专业人员的指示。'},hint:{en:'Is it an action to take?',zh:'它是要采取的行动吗？'}}],
  [{k:'r',en:'Summary',zh:'摘要'},{k:'n',en:'Next steps',zh:'后续步骤'},{k:'e',en:'Email',zh:'邮件'}],{en:'Sentence',zh:'句子'});
 predict($('t4'),{q:{en:'A signed-in user on the free plan calls the API directly with their token. What should come back?',zh:'免费套餐的已登录用户带着令牌直接调用 API，应该返回什么？'},opts:[{k:'a',en:'The three sections, they are signed in',zh:'三个部分，他已经登录了'},{k:'b',en:'A 402 "Subscription needed", from the server\'s own plan check',zh:'402 “Subscription needed”，由服务器自己的套餐检查返回'},{k:'c',en:'Nothing happens and the page spins',zh:'什么都没发生，页面一直转'}],a:'b',ex:{en:'The server checks the plan itself, whatever the page hides.',zh:'不管页面藏了什么，服务器都会自己检查套餐。'},hint:{en:'Which check does not depend on the browser?',zh:'哪个检查不依赖浏览器？'}});
 game($('t5'),[
  {en:'Encrypt records when stored and when sent',zh:'存储和传输时对记录加密',a:'y',ex:{en:'A basic need for private data.',zh:'私密数据的基本要求。'},hint:{en:'Does it protect the data itself?',zh:'它保护的是数据本身吗？'}},
  {en:'Keep an audit log of who opened which record',zh:'记录谁打开了哪份记录的审计日志',a:'y',ex:{en:'You must be able to answer "who saw this?".',zh:'你必须能回答“谁看过这个”。'},hint:{en:'Could you tell who looked?',zh:'你能说出是谁看过吗？'}},
  {en:'Get the patient\'s consent and follow the privacy law',zh:'取得病人的同意并遵守隐私法规',a:'y',ex:{en:'The legal basis for holding the data at all.',zh:'持有这些数据的法律依据。'},hint:{en:'Is it about permission?',zh:'它关乎许可吗？'}},
  {en:'Put "DEMO" in the page title',zh:'在页面标题里写上 “DEMO”',a:'n',ex:{en:'A label protects no data.',zh:'一个标签保护不了任何数据。'},hint:{en:'Does it change where the data goes?',zh:'它改变了数据的去向吗？'}},
  {en:'Switch to a bigger model',zh:'换一个更大的模型',a:'n',ex:{en:'Model size has nothing to do with privacy.',zh:'模型大小与隐私无关。'},hint:{en:'Does it change who can see the data?',zh:'它改变谁能看到数据了吗？'}}],
  [{k:'y',en:'Needed before real data',zh:'用真实数据前必须有'},{k:'n',en:'Does not help',zh:'没有帮助'}],{en:'Measure',zh:'措施'});
});
