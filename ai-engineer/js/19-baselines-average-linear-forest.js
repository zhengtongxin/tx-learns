document.addEventListener('DOMContentLoaded',function(){
 var T=TX2.T,$=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 predict($('p2'),{q:{en:'A fancy model scores a worse average error than <code>constant_pricer</code>. What do you conclude?',zh:'一个花哨的模型平均误差比 <code>constant_pricer</code> 还差。你的结论是？'},opts:[{k:'a',en:'It is not helping yet: something is wrong or it is not worth using',zh:'它还没起作用：要么哪里有问题，要么不值得用'},{k:'b',en:'It is still better because it is more advanced',zh:'它依然更好，因为更先进'}],a:'a',ex:{en:'The average is the bar. Failing it means no value so far.',zh:'平均值就是门槛。过不了，就说明到目前为止没有价值。'},hint:{en:'What does the bar mean?',zh:'门槛是什么意思？'}});
 game($('g4'),[
  {en:'Random price between 1 and 1000',zh:'在 1 到 1000 之间随机报价',a:'1',ex:{en:'The floor: terrible, and a useful reference.',zh:'底线：糟糕，但是有用的参照。'},hint:{en:'It ignores the item completely.',zh:'它完全不看商品。'}},
  {en:'Always the training average',zh:'永远报训练集平均价',a:'2',ex:{en:'The bar: the thing every fancier model must beat.',zh:'门槛：所有更花哨的模型都必须赢过它。'},hint:{en:'It uses no word of the description.',zh:'它不用描述里的任何一个词。'}},
  {en:'Word counts plus linear regression',zh:'词频加线性回归',a:'3',ex:{en:'Words carry price signal, so this is a big jump.',zh:'文字带着价格信号，所以这是一大步。'},hint:{en:'It reads the words, but only with a straight line.',zh:'它读了文字，但只用直线规则。'}},
  {en:'Random forest on word counts',zh:'词频上的随机森林',a:'4',ex:{en:'It adds non-linear patterns, at the cost of speed.',zh:'它多了非线性规律，代价是速度。'},hint:{en:'Many trees voting.',zh:'许多棵树在投票。'}}],[{k:'1',en:'Worst',zh:'最差'},{k:'2',en:'Bar',zh:'门槛'},{k:'3',en:'Better',zh:'更好'},{k:'4',en:'Best here',zh:'这里最好'}],{en:'Rung',zh:'阶梯'});
});
