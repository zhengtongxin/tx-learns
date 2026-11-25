document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 game($('g2'),[
  {en:`The GPU type and the timeout.`,zh:`GPU 类型和超时时间。`,a:'c',ex:{en:`These are settings, not secrets.`,zh:`这些是设置，不是机密。`},hint:{en:`Would it hurt if others saw it?`,zh:`被别人看到会有害吗？`}},
  {en:`Your hub access token.`,zh:`你的 hub 访问令牌。`,a:'s',ex:{en:`Anyone who sees a token can use your account.`,zh:`谁看到令牌，谁就能用你的账号。`},hint:{en:`Could someone misuse it?`,zh:`有人会拿去滥用吗？`}},
  {en:`The names of the Python packages to install.`,zh:`要安装的 Python 包的名字。`,a:'c',ex:{en:`Public names, safe to share.`,zh:`公开的名字，可以放心分享。`},hint:{en:`Is it private?`,zh:`它是私密的吗？`}}],
  [{k:'c',en:`In the code`,zh:`写在代码里`},{k:'s',en:`In the secret store`,zh:`放进保管库`}],{en:'Item',zh:'项目'});
 predict($('p4'),{q:{en:`The first call takes four minutes and the second takes three seconds. Is something broken?`,zh:`第一次调用用了四分钟，第二次只要三秒。是不是出问题了？`},opts:[{k:'a',en:`Yes, the second call must be returning a cached answer`,zh:`有问题，第二次肯定返回了缓存的答案`},{k:'b',en:`No, that is a normal cold start followed by a warm container`,zh:`没有，这是正常的冷启动，之后是温热的容器`}],a:'b',ex:{en:`The container and weights are already loaded on the second call, so only the guess itself runs.`,zh:`第二次调用时容器和权重已经加载好，只需跑估价本身。`},hint:{en:`What did the first call have to do that the second did not?`,zh:`第一次调用要做的什么事，第二次不用做？`}});
 game($('g5'),[
  {en:`Used phone, 128 GB, cracked corner, battery 82 percent.`,zh:`Used phone, 128 GB, cracked corner, battery 82 percent.`,a:'y',ex:{en:`It matches the format of the price tags.`,zh:`它和价签的格式一致。`},hint:{en:`Is it plain and short?`,zh:`它简单又简短吗？`}},
  {en:`SELLING!!! iphone 128gb crack corner LOL`,zh:`SELLING!!! iphone 128gb crack corner LOL`,a:'n',ex:{en:`Shouting and slang are not in the training data.`,zh:`大喊大叫和俚语不在训练数据里。`},hint:{en:`Would the price tags look like this?`,zh:`价签会长这样吗？`}},
  {en:`A long story about why the seller is moving house, then the phone details.`,zh:`一段很长的搬家缘由，之后才是手机细节。`,a:'n',ex:{en:`The model learnt short descriptions, so shorten it first.`,zh:`模型学的是简短的描述，要先缩短。`},hint:{en:`Is it the short format it learnt?`,zh:`它是模型学过的简短格式吗？`}}],
  [{k:'y',en:`Fine as it is`,zh:`原样可以`},{k:'n',en:`Tidy it first`,zh:`先整理`}],{en:'Item',zh:'项目'});
});
