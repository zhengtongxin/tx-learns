(function(){
var T=TX.t,$=function(i){return document.getElementById(i)};
function game(el,items,opts,unit){
 var i=0,sc=0;
 function draw(){
  if(i>=items.length){el.innerHTML='<div class="cnt">'+T({en:'Done',zh:'完成'})+'</div><p class="job">'+T({en:'You got '+sc+' of '+items.length+' on the first try.',zh:'你一次答对了 '+sc+' / '+items.length+' 题。'})+'</p><button class="btn" id="re_'+el.id+'">'+T({en:'Play again',zh:'再玩一次'})+'</button>';
   $('re_'+el.id).onclick=function(){i=0;sc=0;draw()};return}
  var j=items[i],tries=0;
  el.innerHTML='<div class="cnt">'+T({en:unit.en+' '+(i+1)+' of '+items.length,zh:unit.zh+' '+(i+1)+' / '+items.length})+'</div><p class="job">'+T(j)+'</p><div class="pills">'+opts.map(function(o){return '<button class="pill" data-k="'+o.k+'">'+T(o)+'</button>'}).join('')+'</div><div class="fb" role="status" aria-live="polite"></div>';
  var done=false;
  if(i>0){var jp=el.querySelector('.job');if(jp){jp.tabIndex=-1;jp.focus({preventScroll:true})}}
  el.querySelectorAll('.pill').forEach(function(b){b.onclick=function(e){if(done||b.getAttribute('aria-disabled')==='true')return;tries++;
   var ok=b.dataset.k===j.a,fb=el.querySelector('.fb');
   if(ok){done=true;if(tries===1){sc++;TX.burst(e.clientX,e.clientY)}b.classList.add('ok');fb.className='fb show good';
    fb.innerHTML='<b>'+T({en:'Right. ',zh:'答对了。'})+'</b>'+T(j.ex)+'<br><button class="btn pri" id="n_'+el.id+'" style="margin-top:10px">'+T({en:'Next →',zh:'下一题 →'})+'</button>';
    $('n_'+el.id).onclick=function(){i++;draw()}}
   else{b.classList.add('no');b.setAttribute('aria-disabled','true');fb.className='fb show no';fb.innerHTML='<b>'+T({en:'Not quite, try again. ',zh:'不太对，再试一次。'})+'</b>'+T(j.hint||{en:'Look at the explanation above again.',zh:'再看看上面的讲解。'})}}});
 }
 draw()}
function predict(el,o){
 var done=false;
 el.innerHTML='<b class="lbl">'+T({en:'Your turn',zh:'轮到你'})+'</b><p style="margin:0 0 8px;font-weight:600">'+T(o.q)+'</p><div class="pills">'+o.opts.map(function(x){return '<button class="pill" data-k="'+x.k+'">'+T(x)+'</button>'}).join('')+'</div><div class="fb" role="status" aria-live="polite"></div>';
 el.querySelectorAll('.pill').forEach(function(b){b.onclick=function(e){if(done||b.getAttribute('aria-disabled')==='true')return;
  var ok=b.dataset.k===o.a,fb=el.querySelector('.fb');
  if(ok){done=true;b.classList.add('ok');TX.burst(e.clientX,e.clientY);fb.className='fb show good';fb.innerHTML=(o.out?'<div class="io">'+T(o.out)+'</div>':'')+'<b>'+T({en:'Right. ',zh:'答对了。'})+'</b>'+T(o.ex)}
  else{b.classList.add('no');b.setAttribute('aria-disabled','true');fb.className='fb show no';fb.innerHTML='<b>'+T({en:'Not quite. ',zh:'不太对。'})+'</b>'+T(o.hint||{en:'Re-read the explanation above and try again.',zh:'再读一遍上面的讲解，然后再试。'})}}});
}
function trace(el,steps){
 var n=0;
 function draw(){
  var h='<div class="log">'+steps.slice(0,n).map(function(s){return '<div class="'+s.k+'"><i>'+T(s.lbl||{en:{you:'You',llm:'Model',code:'Your code',tool:'Tool'}[s.k],zh:{you:'访客',llm:'模型',code:'你的代码',tool:'工具'}[s.k]})+'</i>'+T(s)+'</div>'}).join('')+(n===0?'<div style="opacity:.5">'+T({en:'Press the button to start.',zh:'点按钮开始。'})+'</div>':'')+'</div>';
  h+='<button class="btn pri" id="tb_'+el.id+'">'+(n>=steps.length?T({en:'Restart',zh:'重来'}):n===0?T({en:'Start →',zh:'开始 →'}):T({en:'Next step →',zh:'下一步 →'}))+'</button>';
  if(n>0&&steps[n-1].why)h+='<div class="note" style="margin-top:10px">'+T(steps[n-1].why)+'</div>';
  el.innerHTML=h;
  $('tb_'+el.id).onclick=function(){n=n>=steps.length?0:n+1;draw()}}
 draw()}
function init(){
 document.querySelectorAll('.runbtn').forEach(function(b){b.onclick=function(){var o=b.nextElementSibling;o.classList.toggle('show')}});
}
window.TX2={T:T,$:$,game:game,predict:predict,trace:trace,init:init};
})();
