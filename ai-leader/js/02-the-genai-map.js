document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();

 predict($('p1'),{q:{en:'A manager asks: "We have 30 months of supplier invoices. How do we let the model answer questions from them?" Which layer is that question about?',zh:'经理问：“我们有 30 个月的供应商发票，怎样让模型根据它们回答问题？”这个问题属于哪一层？'},opts:[{k:'a',en:'Layer 1, chips and cloud',zh:'第 1 层，芯片与云'},{k:'b',en:'Layer 2, models',zh:'第 2 层，模型'},{k:'c',en:'Layer 3, tools and platforms',zh:'第 3 层，工具与平台'},{k:'d',en:'Layer 4, applications',zh:'第 4 层，应用'}],a:'c',ex:{en:'Connecting a model to your own files is the job of layer 3, usually with retrieval (RAG).',zh:'把模型接到自己的文件上，是第 3 层的活，通常靠检索（RAG）。'},hint:{en:'The question is about connecting to your files, not about picking the brain.',zh:'这个问题问的是怎么接上自己的文件，不是选哪个“大脑”。'}});

 game($('g1'),[
  {en:'A rented room of AI chips, billed by the hour',zh:'按小时收费、租来的一屋子 AI 芯片',a:'1',ex:{en:'Machines that train and run models are layer 1.',zh:'训练和运行模型的机器属于第 1 层。'},hint:{en:'Is it hardware you rent?',zh:'它是租来的硬件吗？'}},
  {en:'A model you can download and run on your own servers',zh:'可以下载并在自己服务器上运行的模型',a:'2',ex:{en:'An open model is still a model: layer 2. "Open" says who may run it, not what it costs.',zh:'开放模型依然是模型，属于第 2 层。“开放”说的是谁能运行，不是价格。'},hint:{en:'It is the brain itself.',zh:'它就是“大脑”本身。'}},
  {en:'A search tool that looks up facts in your documents before the model answers',zh:'在模型回答前先去你的文档里查资料的搜索工具',a:'3',ex:{en:'Retrieval stitches a model to your data: layer 3.',zh:'检索把模型和你的数据缝在一起：第 3 层。'},hint:{en:'It connects a model to your files.',zh:'它把模型和文件连起来。'}},
  {en:'A workflow builder that lets a model call tools in a loop (an agent)',zh:'让模型循环调用工具的流程搭建器（智能体）',a:'3',ex:{en:'Agents and workflow builders are one more thing at layer 3, not a new layer.',zh:'智能体和流程搭建器只是第 3 层里的又一样东西，不是新的一层。'},hint:{en:'It stitches models to tools.',zh:'它把模型和工具缝起来。'}},
  {en:'A ready-made customer-service chat you pay for per month',zh:'按月付费、拿来就用的客服聊天产品',a:'4',ex:{en:'A finished product people use is layer 4.',zh:'人们直接使用的成品属于第 4 层。'},hint:{en:'Could a shopper use it with no setup?',zh:'顾客不用任何设置就能用吗？'}},
  {en:'A model sold only through a paid API (closed)',zh:'只通过付费 API 出售的模型（闭源）',a:'2',ex:{en:'Closed or open, a model is layer 2.',zh:'无论闭源还是开放，模型都在第 2 层。'},hint:{en:'Closed or open, what is it?',zh:'不管闭源还是开放，它是什么？'}}],
  [{k:'1',en:'1 Chips and cloud',zh:'1 芯片与云'},{k:'2',en:'2 Models',zh:'2 模型'},{k:'3',en:'3 Tools and platforms',zh:'3 工具与平台'},{k:'4',en:'4 Applications',zh:'4 应用'}],{en:'Product',zh:'产品'});


});
