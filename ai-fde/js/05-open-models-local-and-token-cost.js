document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 game($('g1'),[
  {en:'The baggage section of the wording',zh:'条款里的行李那一节',a:'k',ex:{en:'It is the rule this claim is judged by.',zh:'这份理赔就是按它来判的。'},hint:{en:'Is this the rule the claim needs?',zh:'这是这份理赔需要的规则吗？'}},
  {en:'The limits section (payout caps)',zh:'限额那一节（赔付上限）',a:'k',ex:{en:'Every claim needs the caps to set a payout.',zh:'每份理赔都要靠上限来定赔付。'},hint:{en:'Can you set a payout without a cap?',zh:'没有上限能定赔付吗？'}},
  {en:'The medical section of the wording',zh:'条款里的医疗那一节',a:'c',ex:{en:'A baggage claim never uses it. You pay for it every call.',zh:'行李理赔用不上它，却每次都要为它付费。'},hint:{en:'Does a lost bag involve a doctor?',zh:'丢行李和医生有关吗？'}},
  {en:'The delays section of the wording',zh:'条款里的延误那一节',a:'c',ex:{en:'Wrong claim type, so it is wasted tokens.',zh:'理赔类型不对，只是浪费 token。'},hint:{en:'Is this a delay claim?',zh:'这是延误理赔吗？'}},
  {en:'Spaces and line breaks in the JSON',zh:'JSON 里的空格和换行',a:'c',ex:{en:'The model reads compact JSON just as well.',zh:'模型读紧凑的 JSON 一样没问题。'},hint:{en:'Does the model need pretty printing?',zh:'模型需要排版好看吗？'}}],[{k:'k',en:'Keep',zh:'保留'},{k:'c',en:'Cut',zh:'剪掉'}],{en:'Part',zh:'部分'});

 game($('g2'),[
  {en:'Billed per token',zh:'按 token 计费',a:'h',ex:{en:'You pay the service for every token.',zh:'每个 token 都要付给服务。'},hint:{en:'Who pays for the computer?',zh:'电脑是谁出钱？'}},
  {en:'Claims never leave your building',zh:'理赔数据不出你的楼',a:'l',ex:{en:'The model runs on your own machine.',zh:'模型跑在你自己的机器上。'},hint:{en:'Where does the claim travel?',zh:'理赔要经过哪里？'}},
  {en:'Can run a very large model quickly',zh:'能很快地跑非常大的模型',a:'h',ex:{en:'The service has big machines you do not.',zh:'服务商有你没有的大机器。'},hint:{en:'Who owns the big machines?',zh:'大机器是谁的？'}},
  {en:'Needs disk space and memory on your computer',zh:'要占用你电脑的磁盘和内存',a:'l',ex:{en:'The model files live on your machine.',zh:'模型文件就放在你的机器上。'},hint:{en:'Where is the model stored?',zh:'模型存在哪里？'}},
  {en:'Free per token, but slower',zh:'每个 token 免费，但更慢',a:'l',ex:{en:'You already own the computer, so there is no meter.',zh:'电脑本来就是你的，没有计费表。'},hint:{en:'Is there a per-token bill?',zh:'有按 token 的账单吗？'}}],[{k:'h',en:'Hosted service',zh:'托管服务'},{k:'l',en:'Local (Ollama)',zh:'本地（Ollama）'}],{en:'Description',zh:'描述'});

 predict($('p3'),{q:{en:'Model A: 92% right, US$4.00 per 1,000, 3 s. Model B: 88%, US$0.40, 2 s. Model D: 84%, US$1.20, 6 s. Which one can you drop?',zh:'模型 A：对 92%，每 1,000 份 4.00 美元，3 秒。模型 B：88%，0.40 美元，2 秒。模型 D：84%，1.20 美元，6 秒。哪个可以淘汰？'},opts:[{k:'a',en:'A',zh:'A'},{k:'b',en:'B',zh:'B'},{k:'d',en:'D',zh:'D'}],a:'d',ex:{en:'B is more accurate, cheaper and faster than D, so D never wins. A stays because it is the most accurate.',zh:'B 比 D 更准、更便宜、更快，所以 D 永远赢不了。A 要留着，因为它最准。'},hint:{en:'Find a model that beats D on all three.',zh:'找一个三项都比 D 强的模型。'}});

});
