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
  /* the id comes from the name, not the line number, so reordering or replacing areas never hands one area's history to another */
  out.push({id:'n-'+name.toLowerCase().replace(/\s+/g,' '),name:{en:name,zh:name},weight:w,kw:words.join(' '),tasks:kw})});return out.slice(0,20)};
 /* What may leave the device with a track submission: the outline (a short heading per passage), the most frequent terms and,
    the key ideas the model wrote in its own words (up to 30 passages). Never the files, their names or their text. */
 /* the words that mark a line about where material came from, kept in pieces so the copy check's own word list does not trip on them */
 var SRCW=['instruc'+'tor','lec'+'turer','plat'+'form','cou'+'rse','课'+'程','讲'+'师','版'+'权'].join('|'),SRC=new RegExp('(https?:\\/\\/|www\\.|@[a-z0-9-]+\\.|©|copyright|all rights reserved|'+SRCW+')','i');
 L.scrubLine=function(s){s=String(s||'').replace(/\s+/g,' ').trim();if(!s||SRC.test(s)||/^\d+$/.test(s))return '';return s.length>80?s.slice(0,77).replace(/\s+\S*$/,'')+'…':s};
 L.digest=function(chunks,mats,o){o=o||{};var maxT=o.titles==null?30:o.titles,maxK=o.terms==null?30:o.terms,out={outline:[],terms:[]},freq={};
  mats.forEach(function(m,i){var seen={},ts=[];chunks.filter(function(c){return c.mat===m.id}).forEach(function(c){
    var line=L.scrubLine((c.text.split('\n').map(function(x){return x.trim()}).filter(Boolean)[0])||'');if(line&&!seen[line.toLowerCase()]){seen[line.toLowerCase()]=1;ts.push(line)}});
   if(ts.length>maxT){var st=ts.length/maxT;ts=ts.slice(0,maxT).map(function(_,k){return ts[Math.floor(k*st)]})}
   out.outline.push({n:i+1,kind:m.word==='slide'?'slides':m.word==='page'?'pages':'text',titles:ts})});
  chunks.forEach(function(c){var low=c.text.toLowerCase(),seen={};(low.match(/[a-z][a-z-]{3,}/g)||[]).forEach(function(w){if(!STOP.test(w)&&!SRC.test(w)&&!seen[w]){seen[w]=1;freq['e:'+w]=(freq['e:'+w]||0)+1}});
   (low.match(/[㐀-鿿]{2,}/g)||[]).forEach(function(run){var s2={};for(var i=0;i<run.length-1;i++){var b=run.substr(i,2);if(!s2[b]){s2[b]=1;freq['z:'+b]=(freq['z:'+b]||0)+1}}})});
  var ks=Object.keys(freq).filter(function(k){return freq[k]>=3}).sort(function(a,b){return freq[b]-freq[a]}),en=ks.filter(function(k){return k[0]==='e'}),zh=ks.filter(function(k){return k[0]==='z'});
  out.terms=en.slice(0,maxK).map(function(k){return k.slice(2)}).concat(zh.slice(0,Math.min(12,maxK)).map(function(k){return k.slice(2)}));
  return out};
 /* a summary must be the model's own words: refuse one that repeats 8 words (or 14 Chinese characters) of the source in a row */
 L.copied=function(sum,src){var a=String(sum||'').toLowerCase().replace(/[^a-z0-9㐀-鿿]+/g,' ').trim(),b=' '+String(src||'').toLowerCase().replace(/[^a-z0-9㐀-鿿]+/g,' ').trim()+' ',w=a.split(' ').filter(Boolean),i;
  for(i=0;i+8<=w.length;i++)if(b.indexOf(' '+w.slice(i,i+8).join(' ')+' ')>-1)return true;
  var za=a.replace(/ /g,''),zb=b.replace(/ /g,'');if(/[㐀-鿿]/.test(za))for(i=0;i+14<=za.length;i++)if(zb.indexOf(za.substr(i,14))>-1)return true;
  return false};
 L.sumPrompt=function(c){var zh=c.lang==='zh',lg=zh?'Chinese (简体中文)':'English';
  return [{role:'system',content:'You summarise study material for a learner. You answer with one JSON object and nothing else. You write only in '+lg+'.'},
   {role:'user',content:'Excerpt:\n"""\n'+c.text+'\n"""\nSummarise the key idea of this excerpt in two or three sentences in '+lg+', as a study note for someone learning it: say what the idea is and why or when it matters. Use your own words: do not copy phrases from the excerpt, and do not mention any author, publisher, platform or source. JSON: {"summary":"..."}'}]};
 L.assignAreas=function(chunks,domains){chunks.forEach(function(c){var t=L.tokens(c.text),best=null,bs=0;
  domains.forEach(function(d){var s=L.domainScore(t,d.kw);if(s>bs){bs=s;best=d.id}});c.area=best;c.score=bs});return chunks};
 /* strength 0..1 from the last results (1 = right), newest weighted most; null when never tested */
 L.strength=function(hist){if(!hist||!hist.length)return null;var num=1,den=2,w=1;
  for(var i=hist.length-1;i>=0;i--){num+=hist[i]*w;den+=w;w*=0.92}return num/den};
 /* days to wait before an area is due again: 1, 3, 7, 14, 30 as right answers in a row add up; a miss starts over */
 L.GAPS=[1,3,7,14,30];
 L.interval=function(hist){var n=0;for(var i=(hist||[]).length-1;i>=0&&hist[i]===1;i--)n++;return L.GAPS[Math.min(Math.max(n,1),L.GAPS.length)-1]};
 /* Days in a row with at least one answered question, counted back from today (today may still be empty: the streak is then kept alive until tonight),
    and the last 7 days as [{k,n,c}] oldest first, for the coach card's week strip. */
 L.streak=function(days,now){now=now||new Date();var n=0,d=new Date(now.getFullYear(),now.getMonth(),now.getDate()),k=L.dayKey(d);
  if(!(days[k]&&days[k].n>0))d.setDate(d.getDate()-1);
  while(days[L.dayKey(d)]&&days[L.dayKey(d)].n>0){n++;d.setDate(d.getDate()-1)}return n};
 L.week=function(days,now){now=now||new Date();var out=[],i,d;for(i=6;i>=0;i--){d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-i);var k=L.dayKey(d),x=days[k]||{n:0,c:0};out.push({k:k,n:x.n,c:x.c,wd:d.getDay()})}return out};
 L.dayKey=function(d){d=d||new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)};
 L.daysSince=function(ts,now){return ts?Math.floor((now-ts)/864e5):null};
 /* areas [{id,w,hist,last}] -> allocation of n questions. 'exam' follows the weights exactly; 'drill' tilts toward weak, untested and due areas (due = the gap of L.interval has passed). */
 L.plan=function(areas,n,kind,now){
  var p=areas.map(function(a){var s=L.strength(a.hist),need=s==null?0.65:1-s,ds=L.daysSince(a.last,now),isDue=ds!=null&&ds>=L.interval(a.hist),due=isDue?0.3:0;
   var f=kind==='exam'?1:(0.25+need+due);return {id:a.id,p:Math.max(0,a.w)*f,s:s,ds:ds,due:isDue,tested:s!=null}});
  var tot=p.reduce(function(x,y){return x+y.p},0)||1,res=p.map(function(x){var e=x.p/tot*n;return {id:x.id,k:Math.floor(e),r:e-Math.floor(e),s:x.s,ds:x.ds,due:x.due,tested:x.tested}});
  var left=n-res.reduce(function(x,y){return x+y.k},0);
  res.slice().sort(function(a,b){return b.r-a.r}).slice(0,left).forEach(function(x){x.k++});
  res.forEach(function(x){x.why=!x.tested?'new':(x.s<0.6?'weak':(x.due?'due':'keep'))});
  return res.filter(function(x){return x.k>0})};
 /* chunk for an area: half the time one the reader missed before, otherwise the least used. Only that area's own passages: an area with none gets no question
    (a question written from another area's passage would be scored under the wrong area). */
 L.pick=function(chunks,area,miss,used,rnd){
  var pool=chunks.filter(function(c){return c.area===area});
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
  /* the answer may be an index, a digit, a letter ("B", "b)", "(B) text") or the text of the option itself.
     The option text is tried first and a letter counts only when it stands alone, so "Delegate the task" and
     "A project plan" are read as text, not as options D and A. */
  if(typeof a==='string'){var s2=a.trim(),bare=s2.toLowerCase(),hit=-1,m;opts.forEach(function(x,k){if(x.toLowerCase()===bare)hit=k});
   if(hit>-1)a=hit;
   else if((m=s2.match(/^\(?([A-Da-d])(?![A-Za-z])/)))a=m[1].toUpperCase().charCodeAt(0)-65;
   else a=/^[0-3]$/.test(s2)?+s2:-1}
  if(typeof a!=='number'||a%1!==0||!(a>=0&&a<4)||opts.some(function(x){return !x}))return null;
  var u={};opts.forEach(function(x){u[x.toLowerCase()]=1});if(Object.keys(u).length<4)return null;
  /* "all of the above" and its kin only make sense with several keys, so a one-key question with them is refused */
  if(opts.some(function(x){return /^(?:all|none|both)\s+of\s+the\s+(?:above|these)|^(?:以上|上述)(?:都|全部|均)|^(?:以上|上述)(?:皆|都)?(?:不|没)/i.test(x)}))return null;
  if(q.length<12||q.length>700)return null;
  return {q:q,o:opts,a:a,e:String(o.explanation||o.reason||'').trim()}};
 /* Second opinion on the key: the model answers the finished question from the excerpt without seeing the key. */
 L.verifyPrompt=function(c){var zh=c.lang==='zh';
  return [{role:'system',content:'You answer one multiple-choice question from the given excerpt. You answer with one JSON object and nothing else.'},
   {role:'user',content:'Material excerpt:\n"""\n'+c.text+'\n"""\nQuestion: '+c.q.q+'\n'+c.q.o.map(function(x,i){return 'ABCD'.charAt(i)+'. '+x}).join('\n')+'\nWhich option is correct according to the excerpt? JSON format: {"answer":"A"} with the letter of the one correct option.'}]};
 /* its reply -> option index 0..3, or -1 when it names none (then the question is kept: only a clear disagreement drops it) */
 L.parseVerify=function(raw){var s=L.stripThink(String(raw||'')).replace(/```(?:json)?/g,''),i=s.indexOf('{'),j=s.lastIndexOf('}'),a;
  if(i>-1&&j>i){try{a=JSON.parse(s.slice(i,j+1)).answer}catch(e){}}
  if(a==null){var m=s.match(/\b([A-D])\b/);a=m?m[1]:null}
  if(typeof a==='number')return a%1===0&&a>=0&&a<4?a:-1;
  if(typeof a==='string'){var t=a.trim(),k=t.match(/^\(?([A-Da-d])(?![A-Za-z])/);if(k)return k[1].toUpperCase().charCodeAt(0)-65;if(/^[0-3]$/.test(t))return +t}
  return -1};
 L.shuffle=function(item,rnd){var idx=[0,1,2,3];for(var i=3;i>0;i--){var j=Math.floor(rnd()*(i+1)),t=idx[i];idx[i]=idx[j];idx[j]=t}
  return {q:item.q,e:item.e,o:idx.map(function(k){return item.o[k]}),a:idx.indexOf(item.a)}};
 /* The question, its options and its explanation must be in the language the reader chose on the page, whatever language the material is in. */
 L.inLang=function(q,lang){var t=[q.q].concat(q.o,[q.e||'']).join(' '),z=L.cjkShare(t);return lang==='zh'?z>0.3:z<0.08};
 L.prompt=function(c){
  var zh=c.lang==='zh',cross=c.srcLang&&c.srcLang!==c.lang,ctx;
  if(c.exam)ctx='Exam: '+c.exam+(c.domain?'. Area: '+c.domain:'')+(c.tasks?' (topics: '+c.tasks+')':'')+'. Write it like a real exam question: a short workplace scenario, then "what should the person do next/best?". Test judgement, not memorised wording.';
  else ctx='Goal: the reader wants to understand the material. Write a question that checks understanding of an idea (why or how), not a trivial fact.';
  var lg=zh?'Chinese (简体中文)':'English',
   rule=zh?'Every word of the question, all 4 options and the explanation must be in Chinese (简体中文), even if the excerpt is in English: translate the ideas, and keep a technical term in English in brackets only when it helps.'
          :'Every word of the question, all 4 options and the explanation must be in English, even if the excerpt is in Chinese: translate the ideas, and keep a technical term in Chinese in brackets only when it helps.';
  return [{role:'system',content:'You write original multiple-choice study questions. You answer with one JSON object and nothing else. The reader reads '+lg+' only, so you always write in '+lg+'.'},
   {role:'user',content:'Material excerpt'+(cross?' (in '+(c.srcLang==='zh'?'Chinese':'English')+')':'')+':\n"""\n'+c.text+'\n"""\n'+ctx+'\nWrite ONE original question in '+lg+', based on the excerpt. '+rule+' Exactly 4 options and exactly one correct option; the wrong options must be plausible. Do not copy a published exam question.\nJSON format: {"question":"...","options":["...","...","...","..."],"answer":0,"explanation":"one or two sentences on why the answer is right"} where answer is the index (0 to 3) of the correct option. The JSON keys stay in English; every value is in '+lg+'.'}]};
 if(typeof module!=='undefined'&&module.exports)module.exports=L;else root.CoachLogic=L;
})(typeof window!=='undefined'?window:globalThis);
