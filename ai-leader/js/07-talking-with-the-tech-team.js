document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 predict($('p2'),{q:{en:'The team brings only one plan. What should the sponsor ask for?',zh:'团队只带来一个方案。发起人该要求什么？'},opts:[{k:'a',en:'Two or three options in the same shape, with a recommendation',zh:'两三个格式统一的选项，并附推荐'},{k:'b',en:'A longer slide deck',zh:'更长的幻灯片'},{k:'c',en:'A yes or no, right now',zh:'马上回答好或不好'}],a:'a',ex:{en:'One plan only allows yes or no. Options in one shape can be compared.',zh:'只有一个方案时只能说好或不好；格式统一的选项才能比较。'},hint:{en:'You want to compare, not just agree.',zh:'你要的是比较，不只是同意。'}});
 game($('t3'),[
  {en:'How long the answer takes to appear',zh:'答案出现要等多久',a:'l',ex:{en:'That is latency.',zh:'这就是延迟。'},hint:{en:'It is about time.',zh:'它说的是时间。'}},
  {en:'A confident answer that is made up',zh:'自信但编造的答案',a:'h',ex:{en:'That is a hallucination.',zh:'这就是幻觉。'},hint:{en:'The answer sounds sure but is false.',zh:'答案听着很肯定，却是假的。'}},
  {en:'A test set of questions with known answers',zh:'一套有标准答案的测试题',a:'e',ex:{en:'That is an evaluation: you can score the results.',zh:'这就是评测：结果可以打分。'},hint:{en:'You can mark it like an exam.',zh:'可以像考试一样打分。'}},
  {en:'A rule that blocks bad output before anyone sees it',zh:'在别人看到前拦住坏输出的规则',a:'g',ex:{en:'That is a guardrail.',zh:'这就是护栏。'},hint:{en:'Think of the barrier at the roadside.',zh:'想想路边的护栏。'}}],
  [{k:'l',en:'Latency',zh:'延迟'},{k:'h',en:'Hallucination',zh:'幻觉'},{k:'e',en:'Evaluation',zh:'评测'},{k:'g',en:'Guardrail',zh:'护栏'}],{en:'Meaning',zh:'含义'});
 predict($('p3'),{q:{en:'Before buying, the finance head wants proof. What is the best small test?',zh:'购买之前，财务主管想要证据。哪种小测试最好？'},opts:[{k:'a',en:'A vendor demo on clean sample data',zh:'供应商用干净样例数据做的演示'},{k:'b',en:'20 real supplier invoices, with results a senior buyer reads herself',zh:'20 张真实供应商发票，结果由资深采购亲自来读'},{k:'c',en:'The team says it feels fast',zh:'团队说感觉挺快'}],a:'b',ex:{en:'Real examples from your own business, checked by someone who knows the work.',zh:'用自家业务的真实样例，由懂行的人来检查。'},hint:{en:'Which one uses your data and your own eyes?',zh:'哪一个用的是你的数据和你自己的眼睛？'}});
});
