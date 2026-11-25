document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 predict($('p2'),{q:{en:`You raise r from 8 to 32. What happens to the add-on?`,zh:`你把 r 从 8 提到 32。附加件会怎样？`},opts:[{k:'a',en:`The base model is rewritten to be larger`,zh:`基础模型被改写得更大`},{k:'b',en:`It gets thicker: it can learn more but uses more memory`,zh:`它变厚了：能学得更多，但占更多内存`}],a:'b',ex:{en:`r is the thickness of the add-on. The base stays frozen either way.`,zh:`r 是附加件的厚度。无论如何基础模型都保持冻结。`},hint:{en:`r belongs to the sticky note, not the textbook.`,zh:`r 属于便利贴，不属于课本。`}});
 game($('g3'),[
  {en:`How much the add-on can learn, and how much memory it takes.`,zh:`附加件能学多少、占多少内存。`,a:'r',ex:{en:`Bigger r means a thicker add-on.`,zh:`r 越大附加件越厚。`},hint:{en:`Think thickness.`,zh:`想想厚度。`}},
  {en:`Which layers get a sticky note at all.`,zh:`哪些层会贴上便利贴。`,a:'t',ex:{en:`It lists layer names such as the attention projections.`,zh:`它列出层的名字，比如注意力投影层。`},hint:{en:`It is a list of names.`,zh:`它是一串名字。`}},
  {en:`A little of the add-on is switched off at random so it cannot memorise.`,zh:`附加件被随机关掉一小部分，让它没法死记。`,a:'d',ex:{en:`Dropout fights memorising.`,zh:`dropout 用来对抗死记硬背。`},hint:{en:`Which one is about overfitting?`,zh:`哪个是防止过拟合的？`}}],
  [{k:'r',en:`r (thickness)`,zh:`r（厚度）`},{k:'t',en:`target modules`,zh:`target modules（目标层）`},{k:'d',en:`dropout`,zh:`dropout`}],{en:'Item',zh:'项目'});
 game($('g5'),[
  {en:`Only a tiny add-on is trained; the base stays frozen.`,zh:`只训练一个很小的附加件，底座保持冻结。`,a:'l',ex:{en:`Training less is LoRA.`,zh:`少训练是 LoRA。`},hint:{en:`Which one is about what gets trained?`,zh:`哪个说的是训练什么？`}},
  {en:`The frozen weights are stored in 4 bits instead of 16.`,zh:`冻住的权重用 4 位而不是 16 位存放。`,a:'q',ex:{en:`Storing smaller is quantisation.`,zh:`存得更小是量化。`},hint:{en:`Which one is about memory for the frozen part?`,zh:`哪个说的是冻结部分的内存？`}},
  {en:`Cutting long descriptions at a token limit and training on the answer only.`,zh:`按 token 上限截断长描述，只对答案训练。`,a:'b',ex:{en:`That shapes the examples, it does not change the model size.`,zh:`这是整理例子，不改变模型大小。`},hint:{en:`Is it about the model or the examples?`,zh:`它针对模型还是例子？`}}],
  [{k:'l',en:`LoRA`,zh:`LoRA`},{k:'q',en:`Quantisation`,zh:`量化`},{k:'b',en:`Neither: that is data prep`,zh:`都不是：这是数据准备`}],{en:'Item',zh:'项目'});
});
