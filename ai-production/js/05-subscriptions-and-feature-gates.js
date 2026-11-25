document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 game($('t0'),[
  {en:'Plan name: "Pro"',zh:'套餐名称：“Pro”',a:'p',ex:{en:'A label people read on the pricing table.',zh:'定价表上给人看的标签。'},hint:{en:'Is it for people or for the code?',zh:'它是给人看的还是给代码用的？'}},
  {en:'The plan slug the dashboard shows',zh:'后台显示的套餐 slug',a:'c',ex:{en:'The code compares against this exact slug.',zh:'代码拿的就是这个确切的 slug 来比较。'},hint:{en:'Which one must match character by character?',zh:'哪一个必须一个字符不差地匹配？'}},
  {en:'The monthly price',zh:'月价',a:'p',ex:{en:'Shown to people on the pricing table.',zh:'显示给人看的定价信息。'},hint:{en:'Does the gate check it?',zh:'门会检查它吗？'}},
  {en:'The short feature list',zh:'功能列表',a:'p',ex:{en:'Marketing for the reader, not a rule your code reads.',zh:'是给读者看的介绍，不是代码读取的规则。'},hint:{en:'Does your code read it?',zh:'你的代码会读它吗？'}}],
  [{k:'p',en:'For people',zh:'给人看'},{k:'c',en:'For the code',zh:'给代码用'}],{en:'Item',zh:'内容'});
 predict($('t2'),{q:{en:'A user subscribed, but still sees only the pricing table. What is the likeliest cause?',zh:'用户已经订阅，却还是只看到定价表。最可能的原因？'},opts:[{k:'a',en:'The plan slug in the gate is not the slug of the plan they bought',zh:'门里写的套餐 slug 和他买的套餐 slug 不一致'},{k:'b',en:'Their phone is too old',zh:'他的手机太旧'},{k:'c',en:'Pricing tables always show',zh:'定价表总是会显示'}],a:'a',ex:{en:'This was my own bug. If the slug in <code>plan="..."</code> has a typo, nobody ever matches, so everyone sees the fallback.',zh:'这是我自己踩过的坑。<code>plan="..."</code> 里的 slug 一旦写错，谁都匹配不上，所有人都只看到后备内容。'},hint:{en:'What does the gate compare against?',zh:'门拿什么来比较？'}});
 game($('t4'),[
  {en:'The product page is wrapped in <code>Protect</code>',zh:'产品页被 <code>Protect</code> 包住',a:'h',ex:{en:'It only changes what the browser shows.',zh:'它只改变浏览器显示的内容。'},hint:{en:'Does it run on the server?',zh:'它在服务器上运行吗？'}},
  {en:'The API reads the plan from the verified token and returns 402',zh:'API 从已验证的令牌里读出套餐，并返回 402',a:'r',ex:{en:'This stops the call itself.',zh:'这会直接拦住调用本身。'},hint:{en:'Can a visitor skip it by calling the API directly?',zh:'访问者能绕过它直接调用 API 吗？'}},
  {en:'The Subscribe button is greyed out for free users',zh:'免费用户的“订阅”按钮是灰色的',a:'h',ex:{en:'Cosmetic. Anyone can still send the request.',zh:'只是装饰，谁都还是能发请求。'},hint:{en:'Who controls what the browser sends?',zh:'浏览器发什么由谁控制？'}},
  {en:'A plan check runs in Python before the model is called',zh:'在调用模型之前，Python 里先做套餐检查',a:'r',ex:{en:'Free users never reach the costly model call.',zh:'免费用户根本到不了昂贵的模型调用。'},hint:{en:'Does the check happen before the money is spent?',zh:'检查发生在花钱之前吗？'}}],
  [{k:'h',en:'Only hidden',zh:'只是藏起来'},{k:'r',en:'Really protected',zh:'真正受保护'}],{en:'Check',zh:'检查'});
});
