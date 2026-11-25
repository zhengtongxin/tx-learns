document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 game($('t1'),[
  {en:'A teammate can read what the setup is before it changes',zh:'队友能在改动之前读到搭建是什么样',a:'c',ex:{en:'Text can be reviewed like any other file.',zh:'文字可以像别的文件一样被审阅。'},hint:{en:'Can you read a click?',zh:'你能“阅读”一次点击吗？'}},
  {en:'A second copy is just another run',zh:'再来一份，只是再跑一遍',a:'c',ex:{en:'The same files make the same setup again.',zh:'同样的文件会再做出同样的搭建。'},hint:{en:'Do you need to remember anything?',zh:'你需要记住什么吗？'}},
  {en:'The setup lives in someone\'s memory of the clicks',zh:'搭建只存在于某人对点击的记忆里',a:'k',ex:{en:'Memory fades, and it cannot be shared or reviewed.',zh:'记忆会淡忘，也没法共享或审阅。'},hint:{en:'Where is the record?',zh:'记录在哪里？'}},
  {en:'Every change shows up in git history',zh:'每次改动都出现在 git 历史里',a:'c',ex:{en:'Files can be versioned; clicks cannot.',zh:'文件能做版本管理，点击不能。'},hint:{en:'Can git see a click?',zh:'git 能看见一次点击吗？'}},
  {en:'Nobody can tell what changed last Tuesday',zh:'没人知道上周二改了什么',a:'k',ex:{en:'Console changes leave no readable diff.',zh:'控制台里的改动不会留下可读的差异。'},hint:{en:'Is there a diff to read?',zh:'有可读的差异吗？'}}],
  [{k:'c',en:'As code',zh:'写成代码'},{k:'k',en:'By clicking',zh:'靠点击'}],{en:'Property',zh:'特点'});
 game($('t2'),[
  {en:'A bucket that should exist',zh:'一个应该存在的存储桶',a:'r',ex:{en:'A thing to create is a resource.',zh:'要创建的东西就是资源。'},hint:{en:'Is it a thing, a plugin, a knob or a record?',zh:'它是东西、插件、旋钮还是记录？'}},
  {en:'The plugin that talks to one cloud',zh:'和某个云打交道的插件',a:'p',ex:{en:'Providers are the plugins.',zh:'提供者就是插件。'},hint:{en:'Which one gets downloaded by init?',zh:'init 会下载哪一个？'}},
  {en:'The environment name you choose per run',zh:'每次运行时选的环境名',a:'v',ex:{en:'A knob you set is a variable.',zh:'你来设的旋钮就是变量。'},hint:{en:'Which one do you set yourself?',zh:'哪一个是你自己来设的？'}},
  {en:'The record of what really exists',zh:'实际存在内容的记录',a:'s',ex:{en:'State matches the files to real things.',zh:'状态把文件和真实的东西对应起来。'},hint:{en:'Which one holds a record?',zh:'哪一个保存记录？'}},
  {en:'A separate copy of the state for dev',zh:'给 dev 用的一份独立的状态副本',a:'w',ex:{en:'Workspaces keep one state each.',zh:'每个工作区各有一份状态。'},hint:{en:'Which one gives you several copies?',zh:'哪一个让你拥有好几份？'}}],
  [{k:'r',en:'Resource',zh:'资源'},{k:'p',en:'Provider',zh:'提供者'},{k:'v',en:'Variable',zh:'变量'},{k:'s',en:'State',zh:'状态'},{k:'w',en:'Workspace',zh:'工作区'}],{en:'Description',zh:'描述'});
 predict($('t3'),{q:{en:'Why does the state file go in <code>.gitignore</code>?',zh:'为什么状态文件要放进 <code>.gitignore</code>？'},opts:[{k:'a',en:'It can hold secrets in plain text, and it belongs in a shared, protected place instead',zh:'它里面可能有明文的秘密，应该放在受保护的共享位置'},{k:'b',en:'Git cannot store files that end in .tfstate',zh:'git 存不了 .tfstate 结尾的文件'},{k:'c',en:'It is always empty',zh:'它永远是空的'}],a:'a',ex:{en:'Anyone who can read the repo could read those secrets. A later lesson moves state to a protected shared bucket.',zh:'能读仓库的人就能读到那些秘密。后面的课会把状态挪到一个受保护的共享存储桶里。'},hint:{en:'What might a record of real resources contain?',zh:'一份真实资源的记录里可能有什么？'}});
 predict($('t4'),{q:{en:'You run <code>terraform plan</code> on the new bucket config. What happens?',zh:'你对新的存储桶配置运行 <code>terraform plan</code>。会发生什么？'},opts:[{k:'a',en:'It shows that one bucket would be created, and creates nothing yet',zh:'它显示将创建一个存储桶，但还什么都没创建'},{k:'b',en:'It creates the bucket straight away',zh:'它立刻创建存储桶'},{k:'c',en:'It deletes everything else in the account',zh:'它删掉账号里其他所有东西'}],a:'a',ex:{en:'Plan is a preview. Only apply changes anything.',zh:'plan 只是预览。只有 apply 才会真的改东西。'},hint:{en:'Which command actually makes changes?',zh:'哪条命令才真的做改动？'}});
});
