document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 game($('g1'),[
  {en:'The baggage section of the wording',zh:'条款里的行李那一节',a:'k',ex:{en:'It is the rule this claim is judged by.',zh:'这份理赔就是按它来判的。'},hint:{en:'Is this the rule the claim needs?',zh:'这是这份理赔需要的规则吗？'}},
  {en:'The limits section (payout caps)',zh:'限额那一节（赔付上限）',a:'k',ex:{en:'Every claim needs the caps to set a payout.',zh:'每份理赔都要靠上限来定赔付。'},hint:{en:'Can you set a payout without a cap?',zh:'没有上限能定赔付吗？'}},
  {en:'The medical section of the wording',zh:'条款里的医疗那一节',a:'c',ex:{en:'A baggage claim never uses it. You pay for it every call.',zh:'行李理赔用不上它，却每次都要为它付费。'},hint:{en:'Does a lost bag involve a doctor?',zh:'丢行李和医生有关吗？'}},
  {en:'The delays section of the wording',zh:'条款里的延误那一节',a:'c',ex:{en:'Wrong claim type, so it is wasted tokens.',zh:'理赔类型不对，只是浪费 token。'},hint:{en:'Is this a delay claim?',zh:'这是延误理赔吗？'}},
  {en:'Spaces and line breaks in the JSON',zh:'JSON 里的空格和换行',a:'c',ex:{en:'The model reads compact JSON just as well.',zh:'模型读紧凑的 JSON 一样没问题。'},hint:{en:'Does the model need pretty printing?',zh:'模型需要排版好看吗？'}}],[{k:'k',en:'Keep',zh:'保留'},{k:'c',en:'Cut',zh:'剪掉'}],{en:'Part',zh:'部分'});

 predict($('p1'),{q:{en:'The full prompt averages 1,800 tokens and the small one 600. How many fewer input tokens do 1,000 claims use?',zh:'完整提示词平均 1,800 个 token，小的平均 600 个。1,000 份理赔少用多少输入 token？'},opts:[{k:'a',en:'1,200',zh:'1,200'},{k:'b',en:'120,000',zh:'120,000'},{k:'c',en:'1,200,000',zh:'1,200,000'}],a:'c',out:{en:'(1,800 − 600) × 1,000 = 1,200,000 tokens',zh:'(1,800 − 600) × 1,000 = 1,200,000 个 token'},ex:{en:'Each claim saves 1,200 tokens, and there are 1,000 of them.',zh:'每份省 1,200 个 token，一共 1,000 份。'},hint:{en:'Saving per claim first, then times 1,000.',zh:'先算每份省多少，再乘以 1,000。'}});

 predict($('p2'),{q:{en:'Two providers host the same open model. One is cheaper and faster. What do you check before using it?',zh:'两家服务商托管同一个开放模型，其中一家更便宜更快。用它之前要查什么？'},opts:[{k:'a',en:'Nothing: same model, so same answers',zh:'不用查：同一个模型，答案肯定一样'},{k:'b',en:'Its accuracy on your claims, once',zh:'它在你那些理赔上的准确率，查一次'},{k:'c',en:'Only the price',zh:'只看价格'}],a:'b',ex:{en:'Providers can run the model differently, for example as a smaller, squeezed version of the same model that is cheaper but can answer a little differently. Measure it once instead of assuming.',zh:'服务商运行模型的方式可能不同，比如用压缩过的副本：便宜些，但回答可能略有不同。量一次，不要想当然。'},hint:{en:'Is a cheaper price proof of the same quality?',zh:'价格便宜能证明质量一样吗？'}});

 game($('g2'),[
  {en:'Billed per token',zh:'按 token 计费',a:'h',ex:{en:'You pay the service for every token.',zh:'每个 token 都要付给服务。'},hint:{en:'Who pays for the computer?',zh:'电脑是谁出钱？'}},
  {en:'Claims never leave your building',zh:'理赔数据不出你的楼',a:'l',ex:{en:'The model runs on your own machine.',zh:'模型跑在你自己的机器上。'},hint:{en:'Where does the claim travel?',zh:'理赔要经过哪里？'}},
  {en:'Can run a very large model quickly',zh:'能很快地跑非常大的模型',a:'h',ex:{en:'The service has big machines you do not.',zh:'服务商有你没有的大机器。'},hint:{en:'Who owns the big machines?',zh:'大机器是谁的？'}},
  {en:'Needs disk space and memory on your computer',zh:'要占用你电脑的磁盘和内存',a:'l',ex:{en:'The model files live on your machine.',zh:'模型文件就放在你的机器上。'},hint:{en:'Where is the model stored?',zh:'模型存在哪里？'}},
  {en:'Free per token, but slower',zh:'每个 token 免费，但更慢',a:'l',ex:{en:'You already own the computer, so there is no meter.',zh:'电脑本来就是你的，没有计费表。'},hint:{en:'Is there a per-token bill?',zh:'有按 token 的账单吗？'}}],[{k:'h',en:'Hosted service',zh:'托管服务'},{k:'l',en:'Local (Ollama)',zh:'本地（Ollama）'}],{en:'Description',zh:'描述'});

 predict($('p3'),{q:{en:'Model A: 92% right, US$4.00 per 1,000, 3 s. Model B: 88%, US$0.40, 2 s. Model D: 84%, US$1.20, 6 s. Which one can you drop?',zh:'模型 A：对 92%，每 1,000 份 4.00 美元，3 秒。模型 B：88%，0.40 美元，2 秒。模型 D：84%，1.20 美元，6 秒。哪个可以淘汰？'},opts:[{k:'a',en:'A',zh:'A'},{k:'b',en:'B',zh:'B'},{k:'d',en:'D',zh:'D'}],a:'d',ex:{en:'B is more accurate, cheaper and faster than D, so D never wins. A stays because it is the most accurate.',zh:'B 比 D 更准、更便宜、更快，所以 D 永远赢不了。A 要留着，因为它最准。'},hint:{en:'Find a model that beats D on all three.',zh:'找一个三项都比 D 强的模型。'}});

 predict($('p4'),{q:{en:'Of 25 claims, 15 are approvals. Approving everything gets 15 right. Your model gets 17 right. How many claims does it really add?',zh:'25 份理赔里 15 份是批准。全部批准能对 15 份。你的模型对了 17 份。它实际多对了几份？'},opts:[{k:'a',en:'17',zh:'17'},{k:'b',en:'2',zh:'2'},{k:'c',en:'8',zh:'8'}],a:'b',out:{en:'17 − 15 = 2 claims above the lazy answer',zh:'17 − 15 = 比偷懒答案多对 2 份'},ex:{en:'68% sounds fine, but the lazy answer already gives 60%. Only the 2 extra claims are the model’s own work.',zh:'68% 听起来不错，但偷懒答案已经有 60%。只有多出的 2 份才是模型自己的功劳。'},hint:{en:'Subtract the baseline from the model’s score.',zh:'用模型得分减去基线。'}});
});
