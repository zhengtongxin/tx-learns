document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 game($('t0'),[
  {en:'Store and protect passwords',zh:'保存并保护密码',a:'s',ex:{en:'This is the dangerous part, so the service owns it.',zh:'这是最危险的部分，所以交给服务。'},hint:{en:'Would you rather hold other people\'s passwords?',zh:'你愿意保管别人的密码吗？'}},
  {en:'Show the "Continue with Google" button',zh:'显示“用 Google 继续”按钮',a:'s',ex:{en:'The service ships ready-made sign-in screens.',zh:'服务自带现成的登录界面。'},hint:{en:'Is it part of the login screen?',zh:'它属于登录界面吗？'}},
  {en:'Check, on every API call, which user the request is from',zh:'每次 API 调用都检查请求来自哪个用户',a:'m',ex:{en:'Only your own server can protect your own API.',zh:'只有你自己的服务器能保护你自己的 API。'},hint:{en:'Your API belongs to you, not the service.',zh:'这个 API 是你的，不是服务的。'}},
  {en:'Decide what a signed-in user is allowed to do',zh:'决定登录用户可以做什么',a:'m',ex:{en:'Rules about your product are yours to write.',zh:'关于你产品的规则只能由你来写。'},hint:{en:'Does the service know your product\'s rules?',zh:'服务知道你产品的规则吗？'}}],
  [{k:'s',en:'The service does it',zh:'服务来做'},{k:'m',en:'I do it',zh:'我来做'}],{en:'Job',zh:'工作'});
 predict($('t1'),{q:{en:'Which key may end up in the code that the browser downloads?',zh:'哪把密钥可以出现在浏览器下载的代码里？'},opts:[{k:'a',en:'The secret key, it is only a string',zh:'秘密密钥，反正只是一串字符'},{k:'b',en:'The public key, which only identifies the app',zh:'公开密钥，它只用来标识应用'},{k:'c',en:'Both, if the site is small',zh:'两把都行，只要网站小'}],a:'b',ex:{en:'The public key is designed to be seen. The secret key can act as your server, so it never leaves it. I almost committed mine once.',zh:'公开密钥本来就是给人看的。秘密密钥能代表你的服务器，所以绝不能离开服务器。我自己差点把它提交上去。'},hint:{en:'Which one has "secret" in its name?',zh:'哪一把名字里带“secret”？'}});
 predict($('t3'),{q:{en:'It works for a minute, then the API starts saying "unauthorized" for no obvious reason. Likeliest cause?',zh:'用了一分钟之后，API 莫名其妙开始返回“unauthorized”。最可能的原因？'},opts:[{k:'a',en:'The token was saved and has expired',zh:'令牌被存下来，已经过期'},{k:'b',en:'The internet is slow',zh:'网速慢'},{k:'c',en:'Python forgot how to read',zh:'Python 忘了怎么读'}],a:'a',ex:{en:'Tokens expire quickly on purpose. Fetch a new one for each request.',zh:'令牌故意设计成很快过期。每次请求都取新的。'},hint:{en:'Think about "about a minute".',zh:'想想“大约一分钟”。'}});
 game($('t4'),[
  {en:'The token\'s signature checks out against the public keys and it has not expired',zh:'令牌的签名通过了公钥验证，而且没过期',a:'t',ex:{en:'Valid signature and in date: this user is who the token says.',zh:'签名有效且未过期：用户就是令牌所说的那个人。'},hint:{en:'Is anything wrong with it?',zh:'它有什么问题吗？'}},
  {en:'Someone edited the user id inside the token, so the signature no longer matches',zh:'有人改了令牌里的用户 id，签名对不上了',a:'r',ex:{en:'Any edit breaks the signature. Reject.',zh:'任何改动都会让签名失效，拒绝。'},hint:{en:'Does the stamp still match the contents?',zh:'印章还和内容对得上吗？'}},
  {en:'There is no Authorization header at all',zh:'根本没有 Authorization 头',a:'r',ex:{en:'No pass, no entry.',zh:'没有通行证就不能进。'},hint:{en:'Who is the request from?',zh:'这个请求是谁发的？'}},
  {en:'The page says "I am signed in" in a JSON field',zh:'页面在 JSON 字段里写着“我已登录”',a:'r',ex:{en:'The visitor controls everything the browser sends. Only the signed token counts.',zh:'浏览器发出的东西访问者都能控制，只有签过名的令牌才算数。'},hint:{en:'Could anyone type that field?',zh:'谁都能填这个字段吗？'}}],
  [{k:'t',en:'Trust it',zh:'信任'},{k:'r',en:'Reject (401)',zh:'拒绝（401）'}],{en:'Request',zh:'请求'});
});
