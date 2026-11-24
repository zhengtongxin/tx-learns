document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict,trace=TX2.trace;TX2.init();

 var TO=[{k:'u',en:'record_user_details',zh:'record_user_details'},{k:'q',en:'record_unknown_question',zh:'record_unknown_question'},{k:'n',en:'No tool',zh:'不用工具'}];
 game($('g1'),[
  {en:'Maya: “I\'m a recruiter. Can Alex call me? maya@corp.com”',zh:'Maya：“我是猎头，Alex 能给我回电话吗？maya@corp.com”',a:'u',ex:{en:'Someone wants to get in touch and gave an email.',zh:'有人想联系，并留下了邮箱。'},hint:{en:'Which tool is about being in touch?',zh:'哪个工具和“联系”有关？'}},
  {en:'Raj: “What was Alex\'s thesis topic?” (not in any file)',zh:'Raj：“Alex 的论文题目是什么？”（任何文件里都没有）',a:'q',ex:{en:'The twin cannot answer, so log it. Now Alex knows what is missing.',zh:'分身答不上来，所以记录下来，Alex 就知道缺什么资料了。'},hint:{en:'Is the answer available to the twin?',zh:'分身手上有答案吗？'}},
  {en:'Lee: “Thanks, that was helpful!”',zh:'Lee：“谢谢，很有帮助！”',a:'n',ex:{en:'Nothing to record. Not every message needs a tool.',zh:'没什么要记录的，不是每条消息都需要工具。'},hint:{en:'Is there an email or an unanswered question?',zh:'这里有邮箱或没答上的问题吗？'}},
  {en:'Sam: “What\'s Alex\'s favourite pizza topping?” (not in any file)',zh:'Sam：“Alex 最喜欢什么披萨配料？”（任何文件里都没有）',a:'q',ex:{en:'Unknown to the twin, so log the question.',zh:'分身不知道，所以记录问题。'},hint:{en:'Does the twin know the answer?',zh:'分身知道答案吗？'}}],TO,{en:'Visitor',zh:'访客'});
 predict($('p2'),{q:{en:'Only <code>email</code> is in <code>required</code>. What does that mean for the model?',zh:'<code>required</code> 里只有 <code>email</code>。这对模型意味着什么？'},opts:[{k:'a',en:'Name and notes are ignored',zh:'姓名和备注会被忽略'},{k:'b',en:'It must always ask for a name too',zh:'它还必须总是追问姓名'},{k:'c',en:'It can call the tool once it has an email; the rest it adds if known',zh:'拿到邮箱就能调用，其余的如果知道再补上'}],a:'c',ex:{en:'Required fields are what must be collected before acting. Optional ones are a bonus.',zh:'必填字段是行动前必须收集的，可选字段只是加分项。'},hint:{en:'Think: what is the minimum needed to call it?',zh:'想一想：调用它最少需要什么？'}});
 var LN=[
  {k:'c',en:'Contact trigger',zh:'联系触发',t:'If the user wants to get in touch, ask for their email and use your tool to record it.'},
  {k:'u',en:'Unknown rule',zh:'未知规则',t:'If you don\'t know the answer, use your tool to record the question. Never make up an answer.'},
  {k:'b',en:'Boundary',zh:'边界',t:'Only answer career questions. Otherwise steer back.'},
  {k:'h',en:'Honesty',zh:'诚实',t:'If asked, say you are an AI digital twin.'}],on={},ln=$('lines');
 var VS=[
  {n:'Maya',en:'“Call me: maya@corp.com”',zh:'“请回电：maya@corp.com”',need:'c',good:{en:'Records the email and your phone buzzes.',zh:'记录邮箱，你的手机震动。'},bad:{en:'Chats politely, nothing recorded.',zh:'礼貌地聊天，什么都没记录。'}},
  {n:'Raj',en:'“What was Alex\'s thesis topic?”',zh:'“Alex 的论文题目是什么？”',need:'u',good:{en:'Says it does not know and logs the question.',zh:'说不知道，并记录问题。'},bad:{en:'Invents a thesis topic.',zh:'编造了一个论文题目。'}},
  {n:'Sam',en:'“Write me a poem about the sea.”',zh:'“给我写一首关于大海的诗。”',need:'b',good:{en:'Politely steers back to career topics.',zh:'礼貌地把话题拉回职业。'},bad:{en:'Writes the poem: off topic.',zh:'写了诗：跑题了。'}},
  {n:'Lee',en:'“Are you a real person?”',zh:'“你是真人吗？”',need:'h',good:{en:'Says it is an AI digital twin.',zh:'说明自己是 AI 数字分身。'},bad:{en:'Dodges or pretends to be Alex.',zh:'回避，或假装是 Alex。'}}];
 function ld(){
  ln.innerHTML=LN.map(function(x){return '<button class="pill'+(on[x.k]?' on':'')+'" data-k="'+x.k+'">'+(on[x.k]?'☑ ':'☐ ')+T(x)+'</button>'}).join('');
  $('pr').innerHTML=LN.filter(function(x){return on[x.k]}).map(function(x){return '<span class="chg">'+x.t+'</span>'}).join('\n')||'<span class="dim">(empty prompt)</span>';
  var ok=0;$('vis').innerHTML=VS.map(function(v){var g=on[v.need];if(g)ok++;return '<div class="q2"><b>'+v.n+': '+T(v)+'</b><div class="rp '+(g?'good':'bad')+'">'+(g?'✓ ':'✗ ')+T(g?v.good:v.bad)+'</div></div>'}).join('');
  $('vm').innerHTML=ok===4?'<div class="note">'+T({en:'All four handled right, with zero code changes. Each line described a situation and an action.',zh:'四位访客都处理对了，没有改任何代码。每一句话都写明了情境和动作。'})+'</div>':'';
  if(ok===4&&!ld.d){ld.d=1;TX.burst(innerWidth/2,innerHeight/2)}
  ln.querySelectorAll('.pill').forEach(function(b){b.onclick=function(){on[b.dataset.k]=!on[b.dataset.k];ld()}})}
 ld();
 predict($('p4'),{q:{en:'You add a third tool, <code>send_slack</code>. Which approach needs fewer changes to the dispatcher?',zh:'你新增了第三个工具 <code>send_slack</code>。哪种方式对分发代码改动更少？'},opts:[{k:'a',en:'The globals() lookup: just define the function',zh:'globals() 查找：只要定义函数'},{k:'b',en:'The if / elif chain: no change',zh:'if / elif：不用改'},{k:'c',en:'Both need the same change',zh:'两者改动一样'}],a:'a',ex:{en:'The lookup finds any function by name. The if chain needs a new branch for every tool.',zh:'查找方式按名字就能找到任何函数；if 链每加一个工具就要新加一个分支。'},hint:{en:'Which approach lists each tool by hand?',zh:'哪种方式要手工逐个列出工具？'}});

});
