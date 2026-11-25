document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 game($('g2'),[
  {en:'Reading a claim and writing two or three sentences of reasons',zh:'读一份理赔并写两三句理由',a:'m',ex:{en:'Reading and reasoning is what the model is for.',zh:'阅读和推理正是模型的本职。'},hint:{en:'Is it thinking, or plumbing?',zh:'这是思考，还是管道？'}},
  {en:'The rule that big payouts wait for a handler',zh:'大额赔付要等理赔员的规则',a:'h',ex:{en:'A rule that must always hold belongs in the harness.',zh:'必须始终成立的规则属于 harness。'},hint:{en:'Must it hold even when the model is wrong?',zh:'模型出错时它也要成立吗？'}},
  {en:'The list of tools the agent is allowed to call',zh:'智能体可以调用的工具清单',a:'h',ex:{en:'You choose the tools; the model only picks among them.',zh:'工具由你选，模型只是在其中挑。'},hint:{en:'Who hands out the tools?',zh:'谁来发放工具？'}},
  {en:'Understanding that a delayed flight is not the same as a cancelled one',zh:'明白航班延误和航班取消不是一回事',a:'m',ex:{en:'General language understanding lives in the model.',zh:'一般的语言理解在模型里。'},hint:{en:'Is it about meaning?',zh:'这和词义有关吗？'}},
  {en:'Retrying a claim that failed',zh:'重试失败的理赔',a:'h',ex:{en:'Error handling is middleware, which is code in the harness.',zh:'错误处理是中间件，也就是 harness 里的代码。'},hint:{en:'Is it a decision about meaning or about errors?',zh:'这是关于词义的决定，还是关于错误的？'}}],[{k:'m',en:'The model',zh:'模型'},{k:'h',en:'The harness',zh:'harness'}],{en:'Piece',zh:'部分'});

 predict($('p2'),{q:{en:'A claim is about a cancelled flight. The wording is forty pages. What should the agent be given?',zh:'一份理赔是关于航班取消。条款有四十页。该给智能体什么？'},opts:[{k:'a',en:'All forty pages, every time',zh:'每次都给全部四十页'},{k:'b',en:'The section titles, plus a tool to read one section',zh:'章节标题，加一个读取某一节的工具'},{k:'c',en:'Nothing; it should know insurance already',zh:'什么都不给，它本来就该懂保险'}],a:'b',ex:{en:'Titles are cheap, and the tool fetches only what the claim needs. Pasting everything costs more and buries the useful part.',zh:'标题很便宜，工具只取这份理赔需要的。全贴进去更费钱，还会把有用的部分埋掉。'},hint:{en:'Think of opening one drawer, not the whole cabinet.',zh:'想想只拉开一个抽屉，而不是整个柜子。'}});

 predict($('p3'),{q:{en:'A claim fails for the second time (<code>MAX_TRIES</code> is 2). What does <code>run_one</code> do with it?',zh:'一份理赔第二次失败（<code>MAX_TRIES</code> 是 2）。<code>run_one</code> 会怎么处理？'},opts:[{k:'a',en:'Puts it back to to_do again',zh:'再放回 to_do'},{k:'b',en:'Leaves it for a handler (for_handler)',zh:'留给理赔员（for_handler）'},{k:'c',en:'Marks it decided with an approve',zh:'标成已决定并批准'}],a:'b',out:{en:'tries = 2 → 2 < 2 is False → state: for_handler',zh:'tries = 2 → 2 < 2 为 False → 状态：for_handler'},ex:{en:'It has used both tries, so the harness hands it to a person instead of looping.',zh:'两次机会都用完了，harness 把它交给人，而不是继续循环。'},hint:{en:'Compare the tries with MAX_TRIES.',zh:'把 tries 和 MAX_TRIES 比一比。'}});
});
