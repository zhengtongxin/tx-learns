/* Study coach logic: no page, no network, no model. Runs in the browser and in node (scripts/test-coach.mjs). */
(function(root){
 var L={};
 var CJK=/[㐀-鿿]/g;
 L.cjkShare=function(s){var m=s.match(CJK);return m?m.length/Math.max(1,s.replace(/\s/g,'').length):0};
 L.lang=function(s){return L.cjkShare(s)>0.2?'zh':'en'};
 /* pages [{n,text}] -> chunks [{loc,text}] of about 700 characters (400 in 中文), never over 1400 (900) */
 L.chunk=function(pages,word){
  var out=[],cur=null;
  function flush(){if(cur&&cur.text.replace(/\s/g,'').length>=60)out.push({loc:word+' '+(cur.a===cur.b?cur.a:cur.a+'–'+cur.b),text:cur.text.trim()});cur=null}
  pages.forEach(function(p){
   var tx=(p.text||'').replace(/[ \t ]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();if(!tx)return;
   var zh=L.cjkShare(tx)>0.2,goal=zh?400:700,cap=zh?900:1400;
   while(tx.length>cap){var cut=tx.lastIndexOf('\n',cap);if(cut<cap/2)cut=cap;var head=tx.slice(0,cut);tx=tx.slice(cut);
    if(cur){cur.text+='\n'+head;cur.b=p.n;flush()}else{cur={a:p.n,b:p.n,text:head};flush()}}
   if(!cur)cur={a:p.n,b:p.n,text:tx};else{cur.text+='\n'+tx;cur.b=p.n}
   if(cur.text.length>=goal)flush()});
  flush();return out};
 var STOP=/^(the|and|for|with|that|this|from|are|was|were|will|have|has|not|but|you|your|can|its|into|than|then|they|their)$/;
 L.tokens=function(s){var set={},low=s.toLowerCase(),w=low.match(/[a-z][a-z-]{2,}/g)||[],i;
  w.forEach(function(x){if(!STOP.test(x))set[x]=1});
  var z=low.match(/[㐀-鿿]+/g)||[];z.forEach(function(run){for(i=0;i<run.length-1;i++)set[run.substr(i,2)]=1});
  return set};
 /* keyword stems match by prefix ("negotiat" matches "negotiation") */
 L.domainScore=function(tokSet,kw){var n=0,k=kw.toLowerCase().split(/\s+/),toks=Object.keys(tokSet);
  k.forEach(function(w){if(!w)return;if(/[㐀-鿿]/.test(w)){for(var i=0;i<w.length-1;i++)if(tokSet[w.substr(i,2)]){n+=1;break}}
   else for(var j=0;j<toks.length;j++)if(toks[j].indexOf(w)===0){n+=1;break}});return n/Math.sqrt(k.length||1)};
 /* Areas typed by the reader for any exam: one per line, "Name, 30", "Name 30%" or "Name | keyword keyword | 30". Keywords default to the words of the name. */
 L.parseAreas=function(text){var out=[],seen={};String(text||'').split(/\r?\n/).forEach(function(line){line=line.trim();if(!line)return;
  var parts=line.split('|').map(function(x){return x.trim()}),name,w,kw='',m;
  if(parts.length>=2&&/^\d+(\.\d+)?\s*%?$/.test(parts[parts.length-1])){w=parseFloat(parts[parts.length-1]);name=parts[0];kw=parts.slice(1,-1).join(' ')}
  else if((m=line.match(/^(.*?)[\s,;:：，；\t]+(\d+(?:\.\d+)?)\s*%?$/))){name=m[1].trim();w=parseFloat(m[2])}
  else{name=line;w=1}
  name=name.replace(/[\s,;:：，；|]+$/,'');if(!name||!(w>0)||seen[name.toLowerCase()])return;seen[name.toLowerCase()]=1;
  var words=(name+' '+kw).toLowerCase().replace(/[^a-z㐀-鿿\s-]/g,' ').split(/\s+/).filter(function(x){return x&&(/[㐀-鿿]/.test(x)||x.length>2)&&!STOP.test(x)});
  out.push({id:'c'+out.length,name:{en:name,zh:name},weight:w,kw:words.join(' '),tasks:kw})});return out.slice(0,20)};
 L.assignAreas=function(chunks,domains){chunks.forEach(function(c){var t=L.tokens(c.text),best=null,bs=0;
  domains.forEach(function(d){var s=L.domainScore(t,d.kw);if(s>bs){bs=s;best=d.id}});c.area=best;c.score=bs});return chunks};
 /* strength 0..1 from the last results (1 = right), newest weighted most; null when never tested */
 L.strength=function(hist){if(!hist||!hist.length)return null;var num=1,den=2,w=1;
  for(var i=hist.length-1;i>=0;i--){num+=hist[i]*w;den+=w;w*=0.92}return num/den};
 L.dayKey=function(d){d=d||new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)};
 L.daysSince=function(ts,now){return ts?Math.floor((now-ts)/864e5):null};
 /* areas [{id,w,hist,last}] -> allocation of n questions. 'exam' follows the weights exactly; 'drill' tilts toward weak and untested areas. */
 L.plan=function(areas,n,kind,now){
  var p=areas.map(function(a){var s=L.strength(a.hist),need=s==null?0.65:1-s,ds=L.daysSince(a.last,now),due=ds!=null&&ds>=3?0.15:0;
   var f=kind==='exam'?1:(0.25+need+due);return {id:a.id,p:Math.max(0,a.w)*f,s:s,ds:ds,tested:s!=null}});
  var tot=p.reduce(function(x,y){return x+y.p},0)||1,res=p.map(function(x){var e=x.p/tot*n;return {id:x.id,k:Math.floor(e),r:e-Math.floor(e),s:x.s,ds:x.ds,tested:x.tested}});
  var left=n-res.reduce(function(x,y){return x+y.k},0);
  res.slice().sort(function(a,b){return b.r-a.r}).slice(0,left).forEach(function(x){x.k++});
  res.forEach(function(x){x.why=!x.tested?'new':(x.s<0.6?'weak':(x.ds>=3?'due':'keep'))});
  return res.filter(function(x){return x.k>0})};
 /* chunk for an area: half the time one the reader missed before, otherwise the least used */
 L.pick=function(chunks,area,miss,used,rnd){
  var pool=chunks.filter(function(c){return c.area===area});if(!pool.length)pool=chunks.slice().sort(function(a,b){return (b.score||0)-(a.score||0)}).slice(0,Math.max(5,chunks.length>>3));
  if(!pool.length)return null;
  var missed=pool.filter(function(c){return miss[c.id]>0});
  if(missed.length&&rnd()<0.5){var t=0;missed.forEach(function(c){t+=miss[c.id]});var r=rnd()*t;for(var i=0;i<missed.length;i++){r-=miss[missed[i].id];if(r<=0)return missed[i]}return missed[0]}
  var lo=Math.min.apply(null,pool.map(function(c){return used[c.id]||0})),low=pool.filter(function(c){return (used[c.id]||0)===lo});
  return low[Math.floor(rnd()*low.length)]};
 L.stripThink=function(s){return s.replace(/<think>[\s\S]*?<\/think>/g,'').replace(/^[\s\S]*<\/think>/,'')};
 /* model output -> {q,o:[4],a,e} or null */
 L.parseQuestion=function(raw){
  var s=L.stripThink(String(raw||'')).replace(/```(?:json)?/g,''),i=s.indexOf('{'),j=s.lastIndexOf('}');if(i<0||j<i)return null;
  var o;try{o=JSON.parse(s.slice(i,j+1))}catch(e){return null}
  var q=String(o.question||o.q||'').trim(),opts=o.options||o.choices,a=o.answer;
  if(!Array.isArray(opts)||opts.length!==4||!q)return null;
  opts=opts.map(function(x){return String(x==null?'':x).replace(/^\s*(?:[A-Da-d][\).、:：]|\([A-Da-d]\))\s*/,'').trim()});
  if(typeof a==='string'){var m=a.trim().match(/^[A-Da-d]/);a=m?m[0].toUpperCase().charCodeAt(0)-65:parseInt(a,10)}
  if(!(a>=0&&a<4)||opts.some(function(x){return !x}))return null;
  var u={};opts.forEach(function(x){u[x.toLowerCase()]=1});if(Object.keys(u).length<4)return null;
  if(q.length<12||q.length>700)return null;
  return {q:q,o:opts,a:a|0,e:String(o.explanation||o.reason||'').trim()}};
 L.shuffle=function(item,rnd){var idx=[0,1,2,3];for(var i=3;i>0;i--){var j=Math.floor(rnd()*(i+1)),t=idx[i];idx[i]=idx[j];idx[j]=t}
  return {q:item.q,e:item.e,o:idx.map(function(k){return item.o[k]}),a:idx.indexOf(item.a)}};
 L.prompt=function(c){
  var zh=c.lang==='zh',ctx;
  if(c.exam)ctx='Exam: '+c.exam+'. Domain: '+c.domain+(c.tasks?' (topics: '+c.tasks+')':'')+'. Write it like a real exam question: a short workplace scenario, then "what should the person do next/best?". Test judgement, not memorised wording.';
  else ctx='Goal: the reader wants to understand the material. Write a question that checks understanding of an idea (why or how), not a trivial fact.';
  return [{role:'system',content:'You write original multiple-choice study questions. You answer with one JSON object and nothing else.'},
   {role:'user',content:'Material excerpt:\n"""\n'+c.text+'\n"""\n'+ctx+'\nWrite ONE original question in '+(zh?'Chinese (简体中文)':'English')+', based on the excerpt. Exactly 4 options and exactly one correct option; the wrong options must be plausible. Do not copy a published exam question.\nJSON format: {"question":"...","options":["...","...","...","..."],"answer":0,"explanation":"one or two sentences on why the answer is right"} where answer is the index (0 to 3) of the correct option.'}]};
 if(typeof module!=='undefined'&&module.exports)module.exports=L;else root.CoachLogic=L;
})(typeof window!=='undefined'?window:globalThis);
