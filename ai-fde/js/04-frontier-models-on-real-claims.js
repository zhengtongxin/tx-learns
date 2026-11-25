document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 game($('g1'),[
  {en:'The 25 claims',zh:'那 25 份理赔',a:'s',ex:{en:'If the claims change, you are no longer comparing models.',zh:'理赔一变，比的就不是模型了。'},hint:{en:'Would a fair test change the questions?',zh:'公平的测试会换题目吗？'}},
  {en:'The wording of the prompt',zh:'提示词的措辞',a:'s',ex:{en:'A better prompt for one model is an unfair head start.',zh:'给某个模型一份更好的提示词，就是不公平的抢跑。'},hint:{en:'Is the prompt part of the model?',zh:'提示词是模型的一部分吗？'}},
  {en:'How a decision is marked right or wrong',zh:'决定怎么判对错',a:'s',ex:{en:'One marking rule, applied the same way to all.',zh:'同一条评分规则，对所有模型一视同仁。'},hint:{en:'Should some models get an easier marker?',zh:'能让某些模型遇到更宽松的评分吗？'}},
  {en:'Which model answers',zh:'由哪个模型作答',a:'d',ex:{en:'This is the one thing we are testing.',zh:'这正是我们要测的唯一变量。'},hint:{en:'What are we comparing?',zh:'我们在比较什么？'}},
  {en:'What each answer costs',zh:'每个答案的花费',a:'d',ex:{en:'Prices differ by model, and that is a result, not a setting.',zh:'每个模型价格不同，这是结果，不是设置。'},hint:{en:'Can you set a model’s price?',zh:'你能设定模型的价格吗？'}}],[{k:'s',en:'Stays the same',zh:'保持不变'},{k:'d',en:'Allowed to differ',zh:'允许不同'}],{en:'Item',zh:'内容'});

 predict($('p1'),{q:{en:'You want to test a fourth model. What do you change in the code?',zh:'你想再测第四个模型。代码里要改什么？'},opts:[{k:'a',en:'Add its name to MODELS',zh:'把它的名字加进 MODELS'},{k:'b',en:'Rewrite decide() for that lab’s library',zh:'为那家实验室的库重写 decide()'},{k:'c',en:'Write a new prompt for it',zh:'为它写一份新的提示词'}],a:'a',ex:{en:'The gateway gives every model the same call, so only the name changes. The prompt must stay the same too.',zh:'网关让每个模型用同一种调用方式，所以只改名字。提示词也必须保持不变。'},hint:{en:'What is the point of the gateway?',zh:'网关的意义是什么？'}});

 predict($('p3'),{q:{en:'One claim uses 1,500 input tokens and 100 output tokens. The prices are US$2 per million in and US$10 per million out. What do 1,000 such claims cost?',zh:'一份理赔用 1,500 个输入 token 和 100 个输出 token。价格是输入每百万 2 美元、输出每百万 10 美元。1,000 份这样的理赔要多少钱？'},opts:[{k:'a',en:'US$0.40',zh:'0.40 美元'},{k:'b',en:'US$4',zh:'4 美元'},{k:'c',en:'US$40',zh:'40 美元'}],a:'b',out:{en:'Input: 1,500 × US$2 ÷ 1,000,000 = US$0.003. Output: 100 × US$10 ÷ 1,000,000 = US$0.001. Together US$0.004 a claim, so US$4 per 1,000',zh:'输入：1,500 × 2 美元 ÷ 1,000,000 = 0.003 美元；输出：100 × 10 美元 ÷ 1,000,000 = 0.001 美元。合计每份 0.004 美元，即每 1,000 份 4 美元'},ex:{en:'One claim costs US$0.004. A thousand cost US$4.',zh:'一份 0.004 美元，一千份 4 美元。'},hint:{en:'Work out one claim first, then multiply by 1,000.',zh:'先算一份，再乘以 1,000。'}});

 game($('g2'),[
  {en:'Model A scored 21 then 22 of 25. Model B scored 22 then 21.',zh:'模型 A 得 21 分和 22 分（满分 25），模型 B 得 22 分和 21 分。',a:'n',ex:{en:'They swap places between runs. That is noise.',zh:'两遍之间互换了位置，这是噪声。'},hint:{en:'Does the order stay the same?',zh:'顺序有没有保持不变？'}},
  {en:'Model A scored 15 and 16. Model B scored 22 and 23.',zh:'模型 A 得 15 分和 16 分，模型 B 得 22 分和 23 分。',a:'r',ex:{en:'The gap (about 7) is far bigger than the wobble (1).',zh:'差距（约 7）远大于波动（1）。'},hint:{en:'Compare the gap with how much each moved.',zh:'把差距和各自的波动比一比。'}},
  {en:'One run each: A got 22, B got 23.',zh:'各只跑了一遍：A 得 22，B 得 23。',a:'n',ex:{en:'One claim apart on one run tells you nothing.',zh:'一遍里差一份理赔，说明不了什么。'},hint:{en:'How much does a model move against itself?',zh:'模型自己和自己会差多少？'}},
  {en:'Model A scored 20 and 21. Model B scored 24 and 24.',zh:'模型 A 得 20 分和 21 分，模型 B 得 24 分和 24 分。',a:'r',ex:{en:'B beats A in both runs by 3 or more, and each model moved by 1 at most.',zh:'两遍里 B 都比 A 多至少 3 分，而各自的波动最多 1。'},hint:{en:'Is the gap bigger than 1?',zh:'差距比 1 大吗？'}}],[{k:'r',en:'A real gap',zh:'真实的差距'},{k:'n',en:'Probably noise',zh:'多半是噪声'}],{en:'Result',zh:'结果'});
});
