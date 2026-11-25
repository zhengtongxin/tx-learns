document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 game($('g2'),[
  {en:`Fitting the weights on validation items the agents did not train on.`,zh:`在智能体没训练过的验证条目上拟合权重。`,a:'h',ex:{en:`Weights learnt on fresh items generalise.`,zh:`在新条目上学出来的权重更能推广。`},hint:{en:`Is it unseen data?`,zh:`它是没见过的数据吗？`}},
  {en:`Three guessers that all make the same mistakes.`,zh:`三个犯同样错误的估价者。`,a:'x',ex:{en:`Identical mistakes do not cancel out when averaged.`,zh:`相同的错误取平均也抵消不了。`},hint:{en:`Do the errors differ?`,zh:`它们的错误不一样吗？`}},
  {en:`Fitting the weights on the test set, then reporting the test score.`,zh:`在测试集上拟合权重，再汇报测试成绩。`,a:'x',ex:{en:`That leaks the test into the model.`,zh:`这会把测试泄漏进模型。`},hint:{en:`Is the test set meant to be used for fitting?`,zh:`测试集是用来拟合的吗？`}}],
  [{k:'h',en:`Helps`,zh:`有帮助`},{k:'x',en:`Hurts`,zh:`有害`}],{en:'Item',zh:'项目'});
 predict($('p4'),{q:{en:`The same deal shows up in the feed on every run. What stops your phone buzzing each time?`,zh:`同一个优惠每次都出现在信息源里。是什么让你的手机不会每次都响？`},opts:[{k:'a',en:`The seen-deals file: it remembers what was already sent`,zh:`已见优惠文件：它记得哪些已经发过`},{k:'b',en:`The ensemble, which only guesses once`,zh:`组合智能体，它只估价一次`}],a:'a',ex:{en:`Memory in a file survives between runs, so repeats are skipped.`,zh:`文件里的记忆在两次运行之间保留，所以重复的被跳过。`},hint:{en:`What remembers things between runs?`,zh:`什么在两次运行之间保存记忆？`}});
 game($('g5'),[
  {en:`The order is always scan, estimate, notify, and you want it cheap and predictable.`,zh:`顺序永远是扫描、估价、通知，你想要便宜又可预测。`,a:'f',ex:{en:`When the steps never change, write them down yourself.`,zh:`步骤从不变时，自己写死就好。`},hint:{en:`Does it need to choose?`,zh:`它需要自己选吗？`}},
  {en:`The right next step depends on what the last tool returned, and it varies a lot.`,zh:`下一步该做什么取决于上一个工具返回了什么，变化很大。`,a:'a',ex:{en:`Choosing among tools on the fly is what autonomy is for.`,zh:`临场在工具之间做选择，正是自主的用处。`},hint:{en:`Is the path fixed?`,zh:`路径是固定的吗？`}},
  {en:`You need the same steps every run, for an audit.`,zh:`你需要每次运行都走同样的步骤，用来审计。`,a:'f',ex:{en:`A fixed order is easy to explain and repeat.`,zh:`固定顺序容易解释，也容易重现。`},hint:{en:`Which is easier to repeat?`,zh:`哪个更容易重现？`}}],
  [{k:'f',en:`Fixed workflow`,zh:`固定流程`},{k:'a',en:`Autonomous planner`,zh:`自主规划者`}],{en:'Item',zh:'项目'});
});
