document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 game($('g1'),[
  {en:'A tricky claim the handlers had to discuss before agreeing',zh:'一份刁钻的理赔，理赔员讨论了一阵才定下来',a:'in',ex:{en:'Hard cases are where versions of the agent differ.',zh:'难的案例，才是智能体各个版本有差别的地方。'},hint:{en:'Would every version get it right?',zh:'每个版本都会答对吗？'}},
  {en:'A medium claim that needs two policy clauses',zh:'一份要用到两条保单条款的中等理赔',a:'in',ex:{en:'It tests whether the agent combines rules correctly.',zh:'它测的是智能体能不能正确地组合规则。'},hint:{en:'Is it easy to get wrong?',zh:'它容易出错吗？'}},
  {en:'An easy S$60 delay claim everyone gets right',zh:'一份人人都答对的 S$60 简单延误理赔',a:'out',ex:{en:'Every version passes it, so it shows nothing.',zh:'每个版本都能过，什么也看不出来。'},hint:{en:'Would it separate one version from another?',zh:'它能把两个版本分出高下吗？'}},
  {en:'A claim you pasted into the prompt as an example',zh:'一份你当作示例贴进提示词里的理赔',a:'out',ex:{en:'The agent has already seen its answer, so the score would be too kind.',zh:'智能体已经见过它的答案，分数会偏高。'},hint:{en:'Has the agent seen it before?',zh:'智能体以前见过它吗？'}},
  {en:'A claim no handler has decided yet',zh:'一份理赔员还没做决定的理赔',a:'out',ex:{en:'With no reference answer there is nothing to score against.',zh:'没有参考答案，就没东西可对照打分。'},hint:{en:'What would you compare it with?',zh:'你拿什么去对照？'}}],[{k:'in',en:'In the set',zh:'放进集合'},{k:'out',en:'Leave out',zh:'不放'}],{en:'Claim',zh:'理赔'});

 predict($('p3'),{q:{en:'The baseline scores decision_match 0.88 and payout_match 0.52. What do you do next?',zh:'基线得分是 decision_match 0.88、payout_match 0.52。下一步做什么？'},opts:[{k:'a',en:'Switch to the biggest model straight away',zh:'马上换成最大的模型'},{k:'b',en:'Open the traces of claims that failed payout_match',zh:'打开没通过 payout_match 的理赔的追踪'},{k:'c',en:'Rewrite the prompt and run again',zh:'重写提示词再跑一遍'}],a:'b',out:{en:'decisions mostly right: 0.88\npayouts often wrong: 0.52',zh:'决定大多是对的：0.88\n赔付常常是错的：0.52'},ex:{en:'The gap is in the payouts, not the decisions. Reading those traces shows why, before you spend money on a bigger model or guess at a prompt.',zh:'问题出在赔付，不在决定。读一读这些追踪就知道原因，不用先花钱换大模型，或者对着提示词瞎猜。'},hint:{en:'Trace first, then guess. Where is the gap?',zh:'先追踪，再猜测。差距在哪里？'}});

 game($('g2'),[
  {en:'Add the payout tool, and run on the same harder claims',zh:'加上赔付工具，在同样的难题理赔上跑',a:'f',ex:{en:'One change, same dataset.',zh:'只改一样，数据集不变。'},hint:{en:'Count what changed.',zh:'数一数改了什么。'}},
  {en:'Add the payout tool and switch to a bigger model together',zh:'同时加上赔付工具并换成更大的模型',a:'m',ex:{en:'Two changes: a better score has two possible causes.',zh:'改了两样：分数变好有两种可能的原因。'},hint:{en:'How many things changed?',zh:'变了几样东西？'}},
  {en:'Reword the instructions only, with no tool',zh:'只改写指令，不带工具',a:'f',ex:{en:'One change, so you can credit it.',zh:'只改了一样，功劳可以算清楚。'},hint:{en:'Is there just one change?',zh:'是不是只有一处改动？'}},
  {en:'Add the payout tool, and drop the claims it still gets wrong',zh:'加上赔付工具，再把它仍然答错的理赔拿掉',a:'m',ex:{en:'Changing the dataset to flatter the new version makes the comparison meaningless.',zh:'为了让新版本好看而改数据集，对比就没意义了。'},hint:{en:'Did the dataset stay the same?',zh:'数据集还是原来的吗？'}}],[{k:'f',en:'Fair experiment',zh:'公平的实验'},{k:'m',en:'A muddle',zh:'一团乱'}],{en:'Plan',zh:'方案'});
});
