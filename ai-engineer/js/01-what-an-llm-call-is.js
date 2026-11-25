document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 predict($('p1'),{q:{en:'You send the request. What do you get back?',zh:'你发出请求，会收到什么？'},opts:[{k:'a',en:'A JSON reply with the answer inside',zh:'一个里面有答案的 JSON 回复'},{k:'b',en:'A downloaded copy of the model',zh:'一份下载下来的模型'},{k:'c',en:'Nothing until you install a package',zh:'不装包就什么也收不到'}],a:'a',out:{en:'print(...)\n→ A durian can smell so strong that some hotels ban it.',zh:'print(...)\n→ 这里会打印出一句关于榴莲的趣闻。'},ex:{en:'The model stays on the provider\'s machine. Only the JSON answer travels back. No special package is needed: requests is enough.',zh:'模型留在提供商的机器上，只有 JSON 答案传回来。不需要专门的包，requests 就够了。'},hint:{en:'Does the request carry a model, or just words?',zh:'请求带的是模型，还是只有文字？'}});
 game($('g1'),[
  {en:'You are a friendly neighbourhood helper. Keep answers short.',zh:'你是一位友好的邻里小帮手。回答要简短。',a:'s',ex:{en:'It sets who the model is and the tone.',zh:'它设定了模型是谁以及语气。'},hint:{en:'Is it a request, or instructions about how to behave?',zh:'这是请求，还是关于如何表现的指示？'}},
  {en:'Give me one fun fact about durian.',zh:'给我一个关于榴莲的趣闻。',a:'u',ex:{en:'It is the actual request.',zh:'这是真正的请求。'},hint:{en:'Who is asking for something?',zh:'是谁在提要求？'}},
  {en:'Durians are called the king of fruits in Southeast Asia.',zh:'在东南亚，榴莲被称为水果之王。',a:'a',ex:{en:'It is what the model said. We replay it later so a chat has history.',zh:'这是模型说过的话。之后回放它，聊天才有历史。'},hint:{en:'Who wrote this line: you, or the model?',zh:'这句是你写的，还是模型写的？'}},
  {en:'Always answer in plain English, no emoji.',zh:'始终用朴素的英文回答，不要表情符号。',a:'s',ex:{en:'Standing rules for the whole chat belong in system.',zh:'整场对话都适用的规则放在 system。'},hint:{en:'Does it apply to every reply, not just one?',zh:'它是对每次回复都适用，还是只对一次？'}}],[{k:'s',en:'system',zh:'system'},{k:'u',en:'user',zh:'user'},{k:'a',en:'assistant',zh:'assistant'}],{en:'Line',zh:'内容'});
 var PV=[
  {n:{en:'OpenAI',zh:'OpenAI'},c:['client = OpenAI()','model = "gpt-5-mini"'],nt:{en:'The default. The key comes from OPENAI_API_KEY.',zh:'默认选项。密钥来自 OPENAI_API_KEY。'}},
  {n:{en:'Another provider',zh:'另一家提供商'},c:['client = OpenAI(base_url="https://their-endpoint.example/v1", api_key=their_key)','model = "their-model-name"'],nt:{en:'Three things change: base URL, key, model name. Check their docs for the exact URL.',zh:'有三样东西变了：基础网址、密钥、模型名。准确网址请查对方文档。'}},
  {n:{en:'Local (Ollama)',zh:'本地（Ollama）'},c:['client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")','model = "llama3.2"'],nt:{en:'No bill and your data stays on your machine, but the model is much weaker. The key can be any text.',zh:'没有账单，数据留在本机，但模型弱得多。密钥随便写什么都行。'}}];
 var pp=$('pp');
 function ps(i){pp.innerHTML=PV.map(function(v,k){return '<button class="pill'+(k===i?' on':'')+'" data-i="'+k+'">'+T(v.n)+'</button>'}).join('');
  pp.querySelectorAll('.pill').forEach(function(b){b.onclick=function(){ps(+b.dataset.i)}});
  $('pcode').innerHTML=PV[i].c.map(function(l){return '<span class="chg">'+l+'</span>'}).join('\n')+'\n<span class="dim">reply = client.chat.completions.create(model=model, messages=messages)</span>';
  $('pnote').innerHTML=T(PV[i].nt)}
 ps(0);
 predict($('p4'),{q:{en:'You move from a cloud model to Ollama on your laptop. What does your <code>messages</code> list need?',zh:'你从云端模型换到笔记本上的 Ollama，<code>messages</code> 列表要改什么？'},opts:[{k:'a',en:'Nothing. The shape is the same',zh:'什么都不用改，格式一样'},{k:'b',en:'A completely new format',zh:'一种全新的格式'}],a:'a',ex:{en:'Only base_url, key and model name change. The messages keep their shape.',zh:'只有 base_url、密钥和模型名变了，messages 的格式不变。'},hint:{en:'Look at what the buttons above changed.',zh:'看看上面的按钮改了哪些东西。'}});
});
