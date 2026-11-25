document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict,trace=TX2.trace;TX2.init();

 game($('g0'),[
  {en:'In a Jupyter cell: result = await Runner.run(agent, "Hi")',zh:'在 Jupyter 单元格里：result = await Runner.run(agent, "Hi")',a:'y',ex:{en:'Notebooks already run an event loop, so top-level await is allowed.',zh:'笔记本已经有事件循环，所以最外层可以直接 await。'},hint:{en:'Remember the twist about notebooks.',zh:'想想笔记本那个特例。'}},
  {en:'At the top of a .py file: result = await Runner.run(agent, "Hi")',zh:'在 .py 文件最外层：result = await Runner.run(agent, "Hi")',a:'n',ex:{en:'SyntaxError: await is outside a function. Wrap it in async def main().',zh:'语法错误：await 在函数之外。请包进 async def main()。'},hint:{en:'Is this inside an async def?',zh:'它在 async def 里面吗？'}},
  {en:'In a .py file: async def main(): result = await Runner.run(agent, "Hi")   then   asyncio.run(main())',zh:'在 .py 文件里：async def main(): result = await Runner.run(agent, "Hi")，然后 asyncio.run(main())',a:'y',ex:{en:'The standard pattern for scripts.',zh:'脚本里的标准写法。'},hint:{en:'await is inside an async def, and something starts it.',zh:'await 在 async def 里，而且有东西启动了它。'}},
  {en:'In a notebook: result = Runner.run(agent, "Hi")   then   print(result.final_output)',zh:'在笔记本里：result = Runner.run(agent, "Hi")，然后 print(result.final_output)',a:'n',ex:{en:'Without await you get a coroutine object, not a result, so final_output fails.',zh:'没有 await，拿到的是协程对象而不是结果，所以 final_output 会报错。'},hint:{en:'Is the word await there?',zh:'有 await 这个词吗？'}}],[{k:'y',en:'Runs',zh:'能运行'},{k:'n',en:'Fails',zh:'会出错'}],{en:'Snippet',zh:'代码'});
 var AP=[
  {n:'name',hi:1,nt:{en:'A label. It shows up in traces, and later when agents hand off to each other.',zh:'一个标签。会出现在 trace 里，之后智能体互相交接时也会用到。'}},
  {n:'instructions',hi:2,nt:{en:'The system prompt. Before: the string you put first in messages.',zh:'系统提示词。对应之前 messages 最前面的那段字符串。'}},
  {n:'model',hi:3,nt:{en:'Which brain answers. Before: the model= argument of the API call.',zh:'由哪个模型回答。对应之前 API 调用里的 model= 参数。'}},
  {n:'tools',hi:4,nt:{en:'Functions the model may ask for. Before: the tools JSON plus your dispatcher.',zh:'模型可以请求的函数。对应之前的工具 JSON 加上你的分发代码。'}}];
 var APL=['agent = Agent(','    name="Notifier",','    instructions="You send the user a push message when asked",','    model="gpt-5.4-mini",','    tools=[push_tool])'];
 var ap=$('ap');ap.innerHTML=AP.map(function(v,i){return '<button class="pill" data-i="'+i+'">'+v.n+'</button>'}).join('');
 function aps(i){ap.querySelectorAll('.pill').forEach(function(b,k){b.classList.toggle('on',k===i)});
  $('acode').innerHTML=APL.map(function(l,k){return k===AP[i].hi?'<span class="chg">'+l+'</span>':'<span class="dim">'+l+'</span>'}).join('\n');
  $('anote').innerHTML=T(AP[i].nt)}
 ap.querySelectorAll('.pill').forEach(function(b){b.onclick=function(){aps(+b.dataset.i)}});aps(1);
 predict($('p1'),{q:{en:'You want Quip to always answer in rhyme. Which field do you change?',zh:'你想让 Quip 总是用押韵的方式回答。要改哪个字段？'},opts:[{k:'a',en:'name',zh:'name'},{k:'b',en:'instructions',zh:'instructions'},{k:'c',en:'model',zh:'model'},{k:'d',en:'tools',zh:'tools'}],a:'b',ex:{en:'instructions is the system prompt, where behaviour and style are set.',zh:'instructions 就是系统提示词，行为和风格都在这里设定。'},hint:{en:'Which field is the system prompt?',zh:'哪个字段是系统提示词？'}});
 predict($('p2'),{q:{en:'After <code>result = await Runner.run(agent, "Tell a joke")</code>, which attribute holds the joke text?',zh:'运行 <code>result = await Runner.run(agent, "Tell a joke")</code> 之后，哪个属性里是笑话文本？'},opts:[{k:'a',en:'result.final_output',zh:'result.final_output'},{k:'b',en:'result.to_input_list()',zh:'result.to_input_list()'}],a:'a',out:{en:'print(result.final_output)\n→ Why did the AI agent cross the road? To reach its next tool call.',zh:'print(result.final_output)\n→ 这里会打印出一则笑话文本。'},ex:{en:'final_output is the answer. to_input_list() is every message of the run, handy for debugging.',zh:'final_output 是最终答案；to_input_list() 是这次运行的所有消息，调试时很有用。'},hint:{en:'Which one is “the answer”?',zh:'哪一个是“最终答案”？'}});
 predict($('p3'),{q:{en:'Where does the SDK get the tool\'s <i>description</i> (when to use it)?',zh:'SDK 从哪里得到工具的<i>描述</i>（什么时候用）？'},opts:[{k:'a',en:'From the function name only',zh:'只来自函数名'},{k:'b',en:'From the Agent\'s instructions',zh:'来自 Agent 的 instructions'},{k:'c',en:'From the docstring. The type hint <code>message: str</code> gives the inputs',zh:'来自文档字符串；类型标注 <code>message: str</code> 提供输入参数'}],a:'c',ex:{en:'So the docstring is your tool description. Same rule as before: say <b>when</b> to use it.',zh:'所以文档字符串就是你的工具描述。规则和之前一样：写清<b>什么时候</b>用。'},hint:{en:'Look at the line inside the function, between triple quotes.',zh:'看看函数里三个引号之间的那一行。'}});
 var sm=$('smem'),sOn=false,sPred=null,sRep=null;
 function sdraw(){
  var h='<div class="bub u">Hey! I am Mei, nice to meet you.</div><div class="bub a">Nice to meet you too, Mei!</div>';
  h+='<span class="lab">'+T({en:'Second run',zh:'第二次运行'})+'</span><div class="bub u">What\'s my name?</div>';
  h+='<div class="sw"><button class="pill'+(sOn?' on':'')+'" id="son">'+(sOn?'☑ ':'☐ ')+T({en:'Pass session=session',zh:'传入 session=session'})+'</button></div>';
  h+='<p style="margin:6px 0"><b>'+T({en:'Predict: will it know the name?',zh:'预测：它会知道名字吗？'})+'</b></p><div class="pills" style="margin:0 0 8px"><button class="pill'+(sPred==='y'?' on':'')+'" data-p="y">'+T({en:'Yes',zh:'知道'})+'</button><button class="pill'+(sPred==='n'?' on':'')+'" data-p="n">'+T({en:'No',zh:'不知道'})+'</button></div>';
  h+='<button class="btn pri" id="ssend"'+(sPred?'':' disabled')+'>'+T({en:'Run ▶',zh:'运行 ▶'})+'</button>';
  if(sRep){var knows=sRep.s,ok=(sRep.p==='y')===knows;
   h+='<div class="bub a" style="margin-top:12px">'+(knows?'Your name is Mei.':T({en:'I don\'t know your name yet.',zh:'我还不知道你的名字。'}))+'</div><div class="note">'+(ok?'✓ ':'✗ ')+(knows?T({en:'The session replayed the first exchange, so the model saw it again.',zh:'session 回放了第一轮对话，所以模型又看到了它。'}):T({en:'A bare Runner.run sends nothing from before. Now tick the box and run again.',zh:'单独的 Runner.run 不会带上之前的内容。现在勾上选项再运行一次。'}))+'</div>'}
  sm.innerHTML=h;
  $('son').onclick=function(){sOn=!sOn;sRep=null;sdraw()};
  sm.querySelectorAll('[data-p]').forEach(function(b){b.onclick=function(){sPred=b.dataset.p;sdraw()}});
  $('ssend').onclick=function(e){sRep={s:sOn,p:sPred};if(sOn===(sPred==='y'))TX.burst(e.clientX,e.clientY);sdraw()}}
 sdraw();
 game($('hgame'),[
  {en:'A manager agent asks a translator agent for one sentence, then writes the final reply itself.',zh:'主管智能体向翻译智能体要一句译文，然后自己写最终回复。',a:'t',ex:{en:'The manager keeps control and uses the translator like a function.',zh:'主管保持控制，把翻译智能体当函数用。'},hint:{en:'Who writes the final reply to the user?',zh:'谁写给用户的最终回复？'}},
  {en:'A triage agent decides it is a billing question and passes the whole chat to a billing agent, who replies to the customer.',zh:'分诊智能体判断这是账单问题，把整个对话交给账单智能体，由后者回复客户。',a:'h',ex:{en:'Control moves to the billing agent. That is a handoff.',zh:'控制权转到账单智能体手上，这就是交接。'},hint:{en:'Who talks to the customer next?',zh:'接下来由谁和客户说话？'}},
  {en:'Three agents each draft a birthday message, and a picker agent chooses the best one.',zh:'三个智能体各写一条生日祝福，由挑选智能体选出最好的一条。',a:'t',ex:{en:'The picker calls the writers as tools and stays in charge.',zh:'挑选者把写手当工具调用，并始终掌控全局。'},hint:{en:'Who stays in charge: the picker or the writers?',zh:'谁一直在掌控：挑选者还是写手？'}},
  {en:'A general support agent cannot help, so a specialist takes over the conversation.',zh:'通用客服智能体解决不了，由专家接手这段对话。',a:'h',ex:{en:'The specialist takes over, so use a handoff.',zh:'由专家接手，所以用交接。'},hint:{en:'Does the first agent keep talking?',zh:'第一个智能体还会继续说话吗？'}}],[{k:'t',en:'Agent as a tool',zh:'智能体当工具'},{k:'h',en:'Handoff',zh:'交接'}],{en:'Case',zh:'情景'});
});
