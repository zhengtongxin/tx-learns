document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 predict($('p1'),{q:{en:'Which costs more tokens, usually?',zh:'通常哪个用的 token 更多？'},opts:[{k:'a',en:'“chicken rice” spelled correctly',zh:'拼对的 “chicken rice”'},{k:'b',en:'The same words with typos, like “chiken ricce”',zh:'拼错的同样的词，如 “chiken ricce”'}],a:'b',ex:{en:'Common words are often one token each. Misspellings are rare, so they split into more pieces.',zh:'常见词往往一个词一个 token，拼错的词很少见，会被拆成更多块。'},hint:{en:'Which spelling has the tokenizer seen a lot?',zh:'分词器见得多的是哪种拼法？'}});
 var m=$('mem'),mOn=false,mPred=null,mRep=null;
 function mdraw(){
  var h='<div class="bub u">Hi, I\'m Mei and my screen is cracked.</div><div class="bub a">Sorry to hear that, Mei! Let\'s look at it.</div>';
  h+='<span class="lab">'+T({en:'Second call',zh:'第二次调用'})+'</span><div class="bub u">'+T({en:'What did I say was wrong?',zh:'我刚才说哪里坏了？'})+'</div>';
  h+='<div class="sw"><button class="pill'+(mOn?' on':'')+'" id="mon">'+(mOn?'☑ ':'☐ ')+T({en:'Include the earlier turns in messages',zh:'在 messages 里带上之前的对话'})+'</button></div>';
  h+='<p style="margin:6px 0"><b>'+T({en:'Predict: will it know?',zh:'预测：它会知道吗？'})+'</b></p><div class="pills" style="margin:0 0 8px"><button class="pill'+(mPred==='y'?' on':'')+'" data-p="y">'+T({en:'Yes',zh:'知道'})+'</button><button class="pill'+(mPred==='n'?' on':'')+'" data-p="n">'+T({en:'No',zh:'不知道'})+'</button></div>';
  h+='<button class="btn pri" id="msend"'+(mPred?'':' disabled')+'>'+T({en:'Send ▶',zh:'发送 ▶'})+'</button>';
  if(mRep){var knows=mRep.s,ok=(mRep.p==='y')===knows;
   h+='<div class="bub a" style="margin-top:12px">'+(knows?T({en:'You said your screen is cracked.',zh:'你说你的屏幕裂了。'}):T({en:'I\'m sorry, I don\'t have that information.',zh:'抱歉，我没有这方面的信息。'}))+'</div><div class="note">'+(ok?'✓ ':'✗ ')+(knows?T({en:'The earlier turns were in the messages, so the model could read them.',zh:'之前的对话在 messages 里，所以模型读得到。'}):T({en:'This call contained only the new question. Tick the box and send again.',zh:'这次调用里只有新问题。勾上选项再发一次。'}))+'</div>'}
  m.innerHTML=h;
  $('mon').onclick=function(){mOn=!mOn;mRep=null;mdraw()};
  m.querySelectorAll('[data-p]').forEach(function(b){b.onclick=function(){mPred=b.dataset.p;mdraw()}});
  $('msend').onclick=function(e){mRep={s:mOn,p:mPred};if(mOn===(mPred==='y'))TX.burst(e.clientX,e.clientY);mdraw()}}
 mdraw();
 predict($('p4'),{q:{en:'You forget the line that appends the assistant reply to <code>history</code>. What happens on the next turn?',zh:'你漏掉了把助手回复加入 <code>history</code> 的那一行，下一轮会怎样？'},opts:[{k:'a',en:'Nothing changes',zh:'没有变化'},{k:'b',en:'The model sees your questions but not its own earlier answers',zh:'模型看得到你的问题，却看不到它自己之前的回答'},{k:'c',en:'The model forgets everything, including the system message',zh:'模型把一切都忘了，连 system 消息也没了'}],a:'b',ex:{en:'The list is the only memory. What you do not append, the model never sees again.',zh:'这个列表是唯一的记忆。没加进去的，模型就再也看不到。'},hint:{en:'The history list only holds what you appended.',zh:'history 列表里只有你加进去的东西。'}});
 game($('g5'),[
  {en:'The chat is on its 10th turn, and you send the whole history each time.',zh:'聊到第 10 轮，每次都发送整段历史。',a:'m',ex:{en:'The input grows every turn, so each call costs more than the one before.',zh:'输入每轮都在变长，所以每次调用都比上一次贵。'},hint:{en:'How many messages are in the list now compared with turn 2?',zh:'现在列表里的消息比第 2 轮多多少？'}},
  {en:'A brand new chat with one short question.',zh:'一个全新的对话，只有一个简短的问题。',a:'l',ex:{en:'Little text goes in, so it is cheap.',zh:'输入的文字很少，所以便宜。'},hint:{en:'How much text is sent?',zh:'发送了多少文字？'}},
  {en:'You summarise the first 20 turns into three lines and send those instead.',zh:'你把前 20 轮总结成三行，改发这三行。',a:'l',ex:{en:'Fewer tokens go in. This is one way to stay under the cap.',zh:'输入的 token 变少了，这是不超过上限的办法之一。'},hint:{en:'Shorter input means lower cost.',zh:'输入越短，成本越低。'}},
  {en:'You keep every turn of a very long chat and never trim.',zh:'你保留一个很长对话的每一轮，从不裁剪。',a:'m',ex:{en:'Cost climbs every turn, and you will eventually hit the context window.',zh:'成本每轮上升，最终还会撞上上下文窗口。'},hint:{en:'Nothing is dropped, so what keeps growing?',zh:'什么都没丢，那什么在持续增长？'}}],[{k:'m',en:'Costs more and more',zh:'越来越贵'},{k:'l',en:'Stays small',zh:'保持很小'}],{en:'Case',zh:'情景'});
});
