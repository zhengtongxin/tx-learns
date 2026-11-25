document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict,trace=TX2.trace;TX2.init();

 game($('g1'),[
  {en:'Label 10,000 support emails by topic.',zh:'给 10,000 封客服邮件按主题打标签。',a:'s',ex:{en:'A simple task at high volume. A small model is fast, cheap and good enough.',zh:'任务简单但量大，小模型又快又便宜，也足够好。'},hint:{en:'Simple task, huge volume: what matters most, speed and cost or depth?',zh:'任务简单、量很大：最重要的是速度和成本，还是深度？'}},
  {en:'Summarise the risks in a 40-page contract for a lawyer.',zh:'为律师总结一份 40 页合同中的风险。',a:'l',ex:{en:'Subtle reading where mistakes are costly. Pay for the largest model.',zh:'需要细致阅读，出错代价高。选最大的模型。'},hint:{en:'Mistakes are costly here. Which tier thinks hardest?',zh:'这里出错代价高。哪一档思考得最深入？'}},
  {en:'A general customer chat assistant that must be decent and affordable.',zh:'通用客服聊天助手，要求质量不错且成本可控。',a:'m',ex:{en:'The middle tier balances quality and cost for everyday work.',zh:'中型号在质量与成本间取得平衡，适合日常工作。'},hint:{en:'It must be decent and affordable: not the cheapest, not the biggest.',zh:'要求质量不错又不贵：既不是最便宜的，也不是最大的。'}},
  {en:'Company data may never leave the laptop.',zh:'公司数据绝不能离开这台笔记本。',a:'o',ex:{en:'Only a local model keeps data on your machine.',zh:'只有本地模型才能让数据留在你的电脑上。'},hint:{en:'Which option runs on your own machine?',zh:'哪个选项在你自己的电脑上运行？'}},
  {en:'A live demo where an open-source model is fine but replies must feel instant.',zh:'现场演示：开源模型就行，但回复必须几乎即时。',a:'g',ex:{en:'Groq runs open-source models on very fast hardware.',zh:'Groq 在极快的硬件上运行开源模型。'},hint:{en:'Which option is about open-source models on very fast hardware?',zh:'哪个选项讲的是在极快硬件上运行开源模型？'}}],
  [{k:'s',en:'Small tier',zh:'小型号'},{k:'m',en:'Mid tier',zh:'中型号'},{k:'l',en:'Large tier',zh:'大型号'},{k:'g',en:'Groq',zh:'Groq'},{k:'o',en:'Ollama (local)',zh:'Ollama（本地）'}],{en:'Job',zh:'任务'});

 game($('g2'),[
  {en:'<code>from openai import OpenAI</code>',zh:'<code>from openai import OpenAI</code>',a:'k',ex:{en:'Keep. Groq speaks OpenAI’s language, so the same library works.',zh:'保持。Groq 说的是 OpenAI 那套“语言”，所以同一个库就能用。'},hint:{en:'Is a different library needed, or the same one pointed elsewhere?',zh:'需要另一个库，还是同一个库指向别处？'}},
  {en:'<code>client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))</code>',zh:'<code>client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))</code>',a:'e',ex:{en:'Edit. Two of the three values live here: the key becomes GROQ_API_KEY, and you add base_url="https://api.groq.com/openai/v1".',zh:'修改。三个值里有两个在这一行：密钥换成 GROQ_API_KEY，并加上 base_url="https://api.groq.com/openai/v1"。'},hint:{en:'Whose account pays, and where is the request sent? Both are set on this line.',zh:'用谁的账户付费、请求发往哪里？这两样都在这一行设置。'}},
  {en:'<code>response = client.chat.completions.create(</code>',zh:'<code>response = client.chat.completions.create(</code>',a:'k',ex:{en:'Keep. The call itself is identical on every provider.',zh:'保持。调用本身在每个厂商上都一样。'},hint:{en:'Is this one of the three values (key, address, model name)?',zh:'这是三个值（密钥、地址、模型名）之一吗？'}},
  {en:'<code>    model="gpt-5.4-nano",</code>',zh:'<code>    model="gpt-5.4-nano",</code>',a:'e',ex:{en:'Edit. This is the third value: use a Groq model name such as "openai/gpt-oss-120b".',zh:'修改。这是第三个值：换成 Groq 的模型名，例如 "openai/gpt-oss-120b"。'},hint:{en:'Which brain answers? A Groq-hosted model has its own name.',zh:'由哪个模型回答？Groq 上的模型有自己的名字。'}},
  {en:'<code>    messages=messages)</code>',zh:'<code>    messages=messages)</code>',a:'k',ex:{en:'Keep. Your messages are unchanged.',zh:'保持。你的 messages 不变。'},hint:{en:'Do your messages depend on the provider?',zh:'你的 messages 和厂商有关吗？'}},
  {en:'<code>answer = response.choices[0].message.content</code>',zh:'<code>answer = response.choices[0].message.content</code>',a:'k',ex:{en:'Keep. The reply comes back in the same shape.',zh:'保持。回复的格式也一样。'},hint:{en:'Does the reply come back in a different shape?',zh:'回复的格式会不一样吗？'}}],
  [{k:'k',en:'Keep',zh:'保持'},{k:'e',en:'Edit',zh:'修改'}],{en:'Line',zh:'第'});

 trace($('t4'),[
  {k:'code',en:'Asks one model to write a hard question',zh:'让一个模型写出一道难题',why:{en:'Everything after this needs a question to send. Its output feeds the next step: prompt chaining.',zh:'后面所有步骤都需要一个问题可发。它的输出喂给下一步：提示链。'}},
  {k:'llm',en:'Returns the question',zh:'返回这个问题'},
  {k:'code',en:'Sends that same question to every competitor',zh:'把同一个问题发给每个参赛模型',why:{en:'The question written by the first call is the input here (prompt chaining). Each competitor answers on its own, independent of the others (parallelization).',zh:'第 1 步的问题是这里的输入（提示链）。每个参赛模型各自作答，互不依赖（并行化）。'}},
  {k:'code',en:'Saves each model name and answer in two lists',zh:'把每个模型名和回答存进两个列表',why:{en:'Two lists, same order, so answer number N belongs to model number N.',zh:'两个列表顺序一致，所以第 N 个回答属于第 N 个模型。'}},
  {k:'code',en:'Glues the answers into “Response from competitor N”',zh:'把回答拼成“Response from competitor N”',why:{en:'The judge needs one block of text with every answer numbered.',zh:'裁判需要一整段文字，里面每个回答都有编号。'}},
  {k:'llm',en:'The judge ranks them and replies as JSON',zh:'裁判排名，并以 JSON 回复',why:{en:'JSON, so the next step can read it with code.',zh:'用 JSON，下一步才能用代码读取。'}},
  {k:'code',en:'Parses the JSON and maps numbers back to model names',zh:'解析 JSON，把编号映射回模型名',why:{en:'Now the winner has a name.',zh:'现在赢家有了名字。'}}]);
 predict($('p5'),{q:{en:'On clarity and strength of argument, which answer is best?',zh:'按表达清晰度和论证力度，哪个回答最好？'},opts:[{k:'1',en:'#1',zh:'#1'},{k:'2',en:'#2',zh:'#2'},{k:'3',en:'#3',zh:'#3'}],a:'2',ex:{en:'#2 gives a reason and a mechanism. #3 states a claim with a thin reason. #1 sidesteps the question.',zh:'#2 给出了理由和机制，#3 只有观点和很薄的理由，#1 回避了问题。'},hint:{en:'Which answer actually picks a side and explains how it works?',zh:'哪个回答真正选了一边，并解释了原因？'}});

});
