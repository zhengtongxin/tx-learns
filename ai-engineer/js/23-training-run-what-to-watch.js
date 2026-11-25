document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 predict($('p2'),{q:{en:`Looking at the table, which checkpoint is the best one to keep?`,zh:`看这张表，保留哪个检查点最好？`},opts:[{k:'a',en:`Step 600, where validation loss was lowest`,zh:`第 600 步，验证损失最低`},{k:'b',en:`Step 800, where training loss was lowest`,zh:`第 800 步，训练损失最低`}],a:'a',ex:{en:`Validation loss is the honest one, and it was lowest at step 600.`,zh:`验证损失才诚实，它在第 600 步最低。`},hint:{en:`Which curve measures examples it never trained on?`,zh:`哪条曲线测的是从没训练过的例子？`}});
 game($('g3'),[
  {en:`The loss shoots up and then shows "not a number" errors.`,zh:`损失猛地飙高，然后出现“不是数字”的报错。`,a:'lr',ex:{en:`A learning rate that is too high makes the steps overshoot.`,zh:`学习率太高，每一步都冲过头。`},hint:{en:`Is the step too big or too small?`,zh:`步子是太大还是太小？`}},
  {en:`The run crashes with out of memory at step 3.`,zh:`训练在第 3 步因内存不足而崩溃。`,a:'mem',ex:{en:`Fewer examples at once, or shorter ones, fit in memory.`,zh:`一次放更少、更短的例子就装得下。`},hint:{en:`What takes the space?`,zh:`什么占了空间？`}},
  {en:`Validation loss has stopped improving and started to rise while training loss falls.`,zh:`验证损失不再改善、开始上升，训练损失却在下降。`,a:'stop',ex:{en:`That is memorising. Keep the best checkpoint and stop.`,zh:`这是在死记。保留最好的检查点并停止。`},hint:{en:`Which curve is the honest one?`,zh:`哪条曲线才诚实？`}}],
  [{k:'lr',en:`Lower the learning rate`,zh:`降低学习率`},{k:'mem',en:`Smaller batch or shorter cutoff`,zh:`减小批量或缩短截断`},{k:'stop',en:`Stop early`,zh:`提前停止`}],{en:'Item',zh:'项目'});
});
