document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 predict($('p1'),{q:{en:'In way one, which of these did you have to write yourself?',zh:'在路线一里，下面哪一样是你得自己写的？'},opts:[{k:'a',en:'A tool that reads manual files',zh:'读手册文件的工具'},{k:'b',en:'A description of the helper',zh:'帮手的描述'},{k:'c',en:'A to-do list tool',zh:'待办清单工具'}],a:'b',ex:{en:'File reading and the to-do tool are built in. You only describe the helper and choose which tools to switch on.',zh:'读文件和待办工具是内置的。你只需描述帮手，并选择打开哪些工具。'},hint:{en:'Look at what the options list contains.',zh:'看看 options 里放了什么。'}});

 predict($('p2'),{q:{en:'In way two, the helper’s <code>tools</code> list holds only <code>read_manual_section</code>. Why not <code>save_decision</code> too?',zh:'在路线二里，帮手的 <code>tools</code> 只放了 <code>read_manual_section</code>。为什么不放 <code>save_decision</code>？'},opts:[{k:'a',en:'It would not run',zh:'它跑不起来'},{k:'b',en:'The helper only reports one line; the main agent saves, so helpers cannot write decisions on their own',zh:'帮手只回报一行，由主智能体来保存，所以帮手不能自己写决定'},{k:'c',en:'Helpers cannot use more than one tool',zh:'帮手不能用超过一个工具'}],a:'b',ex:{en:'A smaller toolbox for a helper means less that can go wrong. The main agent keeps the one place where decisions are saved.',zh:'给帮手的工具箱越小，能出错的地方越少。保存决定的地方只留在主智能体手里。'},hint:{en:'Who is supposed to save, according to the helper’s prompt?',zh:'按帮手的提示词，谁负责保存？'}});

 game($('g2'),[
  {en:'Running within minutes, with files, plan and helpers already built in',zh:'几分钟就能跑起来，文件、计划和帮手都已内置',a:'1',ex:{en:'That is the SDK’s main strength.',zh:'这是 SDK 的主要优势。'},hint:{en:'Which way comes with the kit?',zh:'哪条路自带工具包？'}},
  {en:'Swapping to a cheaper or local model by changing one line',zh:'改一行就换成更便宜或本地的模型',a:'2',ex:{en:'The framework lets you choose the model.',zh:'框架让你自己选模型。'},hint:{en:'Which way lets you choose?',zh:'哪条路让你选？'}},
  {en:'Writing your own tools, shaped exactly for the claims desk',zh:'自己写工具，完全贴合理赔台',a:'2',ex:{en:'You write the tools yourself in the framework.',zh:'在框架里，工具是你自己写的。'},hint:{en:'Who writes the tools?',zh:'工具谁来写？'}},
  {en:'Fewer lines for you to write and maintain',zh:'要你写、要你维护的代码更少',a:'1',ex:{en:'Built-in tools mean less of your own code.',zh:'内置工具意味着你自己的代码更少。'},hint:{en:'Which way has more built in?',zh:'哪条路内置的更多？'}}],[{k:'1',en:'Way one: SDK',zh:'路线一：SDK'},{k:'2',en:'Way two: framework',zh:'路线二：框架'}],{en:'Point',zh:'要点'});

 predict($('p3'),{q:{en:'The customer asks: “When it breaks, who fixes it?” How should you choose?',zh:'客户问：“坏了谁来修？”你该怎么选？'},opts:[{k:'a',en:'Whichever finished the five claims faster',zh:'谁处理五份理赔更快就选谁'},{k:'b',en:'The one customer’s own team can read, run and pay for',zh:'客户自己的团队看得懂、跑得起、付得起的那个'},{k:'c',en:'Whichever is newest',zh:'选最新的'}],a:'b',ex:{en:'Speed in a demo fades. The team that keeps it alive is there every day.',zh:'演示里的速度很快就过去，而维护它的团队每天都在。'},hint:{en:'Who lives with it after you leave?',zh:'你走了以后谁和它一起生活？'}});
});
