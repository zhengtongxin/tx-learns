/* Study coach. Everything happens on the reader's device: files are read here, the model runs here (WebGPU), records live in IndexedDB.
   Nothing about the reader, the files or the answers is sent anywhere. The model files download once from the model host when the reader asks. */
(function(){
'use strict';
var Lg=window.CoachLogic,EX=window.COACH_EXAMS,BASE=document.currentScript.src.replace(/[^\/]*$/,'');
var $=function(id){return document.getElementById(id)};
function T(en,zh){return '<span class="en">'+en+'</span><span class="zh">'+zh+'</span>'}
function pageLang(){return document.documentElement.getAttribute('data-lang')==='zh'?'zh':'en'}
function PH(en,zh){return document.documentElement.getAttribute('data-lang')==='zh'?zh:en}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function say(en,zh){var s=$('status');if(s)s.innerHTML=T(en,zh)}
var OTHER='x:other',S,CH=[],ENG=null,ENGID='',R=null,confirmKey='',persistOK=true;

/* ---------- storage: IndexedDB, with a plain in-memory fallback and a plain warning ---------- */
var DB=null,mem={};
function openDB(){return new Promise(function(res){try{var r=indexedDB.open('tx-coach',1);r.onupgradeneeded=function(){r.result.createObjectStore('kv')};r.onsuccess=function(){res(r.result)};r.onerror=function(){res(null)};r.onblocked=function(){res(null)}}catch(e){res(null)}})}
function kvGet(k){return new Promise(function(res){if(!DB)return res(mem[k]);try{var q=DB.transaction('kv').objectStore('kv').get(k);q.onsuccess=function(){res(q.result)};q.onerror=function(){res(undefined)}}catch(e){res(undefined)}})}
function kvSet(k,v){return new Promise(function(res){if(!DB){mem[k]=v;return res()}try{var tx=DB.transaction('kv','readwrite');tx.objectStore('kv').put(v,k);tx.oncomplete=res;tx.onerror=function(){persistOK=false;mem[k]=v;res()}}catch(e){persistOK=false;mem[k]=v;res()}})}
var st=0;function save(){clearTimeout(st);st=setTimeout(function(){kvSet('state',S)},250)}
function saveChunks(){return kvSet('chunks',CH.map(function(c){return {id:c.id,mat:c.mat,loc:c.loc,text:c.text}}))}
function num(x){x=+x;return isFinite(x)&&x>0?x:0}
function tidy(s){
 s.mats=(Array.isArray(s.mats)?s.mats:[]).filter(function(m){return m&&typeof m==='object'&&typeof m.name==='string'}).map(function(m){m.id=String(m.id).replace(/[^\w-]/g,'');m.pages=num(m.pages);m.chars=num(m.chars);return m});
 if(!Array.isArray(s.bank))s.bank=[];s.bank=s.bank.filter(function(x){return x&&typeof x.q==='string'&&Array.isArray(x.o)&&x.o.length===4&&x.a>=0&&x.a<4});
 ['stats','miss','used','days'].forEach(function(k){if(!s[k]||typeof s[k]!=='object'||Array.isArray(s[k]))s[k]={}});
 Object.keys(s.stats).forEach(function(k){var v=s.stats[k];if(!v||typeof v!=='object'){delete s.stats[k];return}v.h=(Array.isArray(v.h)?v.h:[]).map(function(x){return x?1:0});v.n=num(v.n);v.c=num(v.c);v.last=num(v.last)});
 Object.keys(s.days).forEach(function(k){var v=s.days[k];if(!v||typeof v!=='object'){delete s.days[k];return}v.n=num(v.n);v.c=num(v.c)});
 if([5,10,20].indexOf(s.perDay)<0)s.perDay=10;if(s.goal!=='exam')s.goal='understand';if(s.model!=='better')s.model='light';
 return s}
function fresh(){return {v:1,goal:'understand',exam:'custom',ver:'',cname:'',ctext:'',model:'light',perDay:10,mats:[],stats:{},miss:{},used:{},bank:[],days:{},rounds:0}}

/* ---------- areas ---------- */
function exam(){
 /* any exam: the reader names it and lists its areas and weights; ready-made outlines (EX) are presets */
 if(S.exam==='custom'){var nm=(S.cname||'').trim()||'My exam';return {e:{id:'custom',name:{en:nm,zh:nm},versions:[]},v:{label:{en:'',zh:''},domains:Lg.parseAreas(S.ctext)}}}
 var e=EX.filter(function(x){return x.id===S.exam})[0]||EX[0];return {e:e,v:e.versions.filter(function(v){return v.id===S.ver})[0]||e.versions[0]}}
function useExam(){return S.goal==='exam'&&exam().v.domains.length>0}
function areas(){
 if(useExam()){var d=exam().v.domains;var out=d.map(function(x){return {id:'x:'+x.id,name:x.name,w:x.weight,kw:x.kw,tasks:x.tasks,dom:x.name.en,lessons:x.lessons}});
  /* passages whose words match no area are still practised, under "Other" (a tenth of the drill; never in a mini exam, which follows the official shares) */
  if(CH.some(function(c){return c.area===OTHER})){var tw=0;out.forEach(function(a){tw+=a.w});out.push({id:OTHER,name:{en:'Other',zh:'其他'},w:Math.max(1,Math.round(tw/10)),other:true})}
  return out}
 return S.mats.map(function(m){return {id:'m:'+m.id,name:{en:esc(m.name),zh:esc(m.name)},w:Math.max(1,m.chars)}})}
function hasMat(id){return CH.some(function(c){return c.area===id})}
function aname(id){var a=areas().filter(function(x){return x.id===id})[0];return a?T(a.name.en,a.name.zh):T('Other','其他')}
function reassign(){
 if(useExam()){Lg.assignAreas(CH,exam().v.domains.map(function(x){return {id:'x:'+x.id,kw:x.kw}}));CH.forEach(function(c){if(!c.area)c.area=OTHER})}
 else CH.forEach(function(c){c.area='m:'+c.mat;c.score=1})}
function hist(id){return (S.stats[id]&&S.stats[id].h)||[]}
/* only areas that have passages get questions; a mini exam leaves "Other" out */
function planFor(kind,n){return Lg.plan(areas().filter(function(a){return hasMat(a.id)&&!(kind==='exam'&&a.other)}).map(function(a){return {id:a.id,w:a.w,hist:hist(a.id),last:S.stats[a.id]&&S.stats[a.id].last}}),n,kind,Date.now())}
function today(){return S.days[Lg.dayKey()]||{n:0,c:0}}

/* ---------- reading files ---------- */
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error('script'))};document.head.appendChild(s)})}
async function readPdf(file,prog){
 var pdfjs=await import(BASE+'vendor/pdf-5.4.149.min.mjs');pdfjs.GlobalWorkerOptions.workerSrc=BASE+'vendor/pdf.worker-5.4.149.min.mjs';
 var doc=await pdfjs.getDocument({data:await file.arrayBuffer(),cMapUrl:BASE+'vendor/cmaps/',cMapPacked:true,isEvalSupported:false}).promise,pages=[];
 for(var i=1;i<=doc.numPages;i++){var p=await doc.getPage(i),tc=await p.getTextContent(),s='';tc.items.forEach(function(it){s+=it.str+(it.hasEOL?'\n':'')});pages.push({n:i,text:s});if(i%10===0)prog(i,doc.numPages)}
 return {pages:pages,word:'page'}}
async function readPptx(file){
 if(!window.JSZip)await loadScript(BASE+'vendor/jszip-3.10.1.min.js');
 var z=await window.JSZip.loadAsync(await file.arrayBuffer()),num=function(n){return +n.match(/(\d+)\.xml$/)[1]};
 var names=Object.keys(z.files).filter(function(n){return /^ppt\/slides\/slide\d+\.xml$/.test(n)}).sort(function(a,b){return num(a)-num(b)}),pages=[];
 function paras(xml){var d=new DOMParser().parseFromString(xml,'application/xml'),out=[];Array.prototype.forEach.call(d.getElementsByTagName('a:p'),function(p){var s='';Array.prototype.forEach.call(p.getElementsByTagName('a:t'),function(x){s+=x.textContent});if(s.trim())out.push(s.trim())});return out}
 for(var i=0;i<names.length;i++){var n=num(names[i]),lines=paras(await z.files[names[i]].async('string')),nf=z.file('ppt/notesSlides/notesSlide'+n+'.xml');
  if(nf){var nl=paras(await nf.async('string')).filter(function(x){return !/^\d+$/.test(x)});lines=lines.concat(nl)}
  pages.push({n:i+1,text:lines.join('\n')})}
 return {pages:pages,word:'slide'}}
async function readText(file){return {pages:[{n:1,text:await file.text()}],word:'text'}}
async function addFiles(files){
 var list=Array.prototype.slice.call(files),ok=0;
 for(var f of list){
  var ext=(f.name.split('.').pop()||'').toLowerCase(),r;
  try{
   say('Reading '+esc(f.name)+'…','正在读取 '+esc(f.name)+'…');
   if(ext==='pdf')r=await readPdf(f,function(i,n){say('Reading '+esc(f.name)+': page '+i+' of '+n,'正在读取 '+esc(f.name)+'：第 '+i+' / '+n+' 页')});
   else if(ext==='pptx')r=await readPptx(f);
   else if(ext==='txt'||ext==='md')r=await readText(f);
   else if(ext==='ppt'){say(esc(f.name)+' is an old PowerPoint file. Save it as .pptx or PDF and add it again.',esc(f.name)+' 是旧版 PowerPoint 文件。请另存为 .pptx 或 PDF 后再添加。');continue}
   else{say(esc(f.name)+': only PDF, PPTX and text files work.',esc(f.name)+'：只支持 PDF、PPTX 和文本文件。');continue}
  }catch(e){say('Could not read '+esc(f.name)+'. Is it damaged or protected by a password?','无法读取 '+esc(f.name)+'。文件可能损坏或有密码保护。');continue}
  var chunks=Lg.chunk(r.pages,r.word),chars=chunks.reduce(function(x,c){return x+c.text.length},0);
  if(!chunks.length){say(esc(f.name)+' has no readable text (a scanned file or only pictures). Text files only, for now.',esc(f.name)+' 里没有可读的文字（扫描件或纯图片）。目前只支持文字内容。');continue}
  var old=S.mats.filter(function(m){return m.name===f.name})[0];if(old)dropMat(old.id);
  var id='f'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  S.mats.push({id:id,name:f.name,pages:r.pages.length,word:r.word,chars:chars,lang:Lg.lang(chunks.map(function(c){return c.text}).join(' ').slice(0,3000))});
  chunks.forEach(function(c,i){CH.push({id:id+'-'+i,mat:id,loc:c.loc,text:c.text})});ok++}
 reassign();await saveChunks();save();renderAll();
 if(ok)say(ok+' file'+(ok>1?'s':'')+' added. It stays on this device.',ok+' 个文件已添加，只保存在这台设备上。')}
function dropMat(id){S.mats=S.mats.filter(function(m){return m.id!==id});CH=CH.filter(function(c){return c.mat!==id})}

/* ---------- the model (open weights, in the browser) ---------- */
function setProg(p,txt){['mprog','pprog'].forEach(function(i){var b=$(i);if(b){b.hidden=false;b.value=Math.round((p||0)*100)}});['mline','pline'].forEach(function(i){var l=$(i);if(l&&txt)l.textContent=txt})}
async function loadModel(){
 if(window.__coachTestEngine){ENG=window.__coachTestEngine;return ENG}
 if(!navigator.gpu)throw new Error('nogpu');
 var ad=await navigator.gpu.requestAdapter();if(!ad)throw new Error('nogpu');
 var f16=!!(ad.features&&ad.features.has('shader-f16')),id=(S.model==='better'?'Qwen3-4B':'Qwen3-1.7B')+(f16?'-q4f16_1-MLC':'-q4f32_1-MLC');
 if(ENG&&ENGID===id)return ENG;
 var wl=await import(BASE+'vendor/web-llm-0.2.89.js');
 if(!wl.prebuiltAppConfig.model_list.some(function(m){return m.model_id===id}))throw new Error('nomodel');
 var o={initProgressCallback:function(p){setProg(p.progress,p.text)}},e;
 try{e=await wl.CreateWebWorkerMLCEngine(new Worker(BASE+'worker.js',{type:'module'}),id,o)}catch(x){e=await wl.CreateMLCEngine(id,o)}
 ENGID=id;ENG={chat:async function(msgs){var q={messages:msgs,temperature:0.7,max_tokens:700,extra_body:{enable_thinking:false}},r;
   try{q.response_format={type:'json_object'};r=await e.chat.completions.create(q)}catch(x){delete q.response_format;r=await e.chat.completions.create(q)}
   return r.choices[0].message.content}};
 return ENG}
async function ensureModel(){
 if(ENG&&(window.__coachTestEngine||ENGID))return ENG;
 renderModel(true);
 try{await loadModel();renderModel();return ENG}
 catch(e){var m=e&&e.message;renderModel(false,m==='nogpu'?'nogpu':(m==='nomodel'?'nomodel':'fail'));throw e}}

/* ---------- a round of questions ---------- */
function mix(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
/* the gaps the coach names: weak areas, areas never tested, areas due for review, and the passages missed most */
function gapInfo(){
 var now=Date.now(),weak=[],fresh=[],due=[],soon=null;
 areas().filter(function(a){return hasMat(a.id)}).forEach(function(a){var h=hist(a.id),v=Lg.strength(h),last=S.stats[a.id]&&S.stats[a.id].last;
  if(v==null){fresh.push(a);return}
  if(v<0.6)weak.push({a:a,p:Math.round(v*100)});
  var left=last?Lg.interval(h)-Lg.daysSince(last,now):0;
  if(left<=0)due.push(a);else if(!soon||left<soon.d)soon={a:a,d:left}});
 weak.sort(function(x,y){return x.p-y.p});
 var miss=Object.keys(S.miss).filter(function(k){return S.miss[k]>0}).map(function(k){return {c:CH.filter(function(c){return c.id===k})[0],n:S.miss[k]}}).filter(function(x){return x.c}).sort(function(x,y){return y.n-x.n}).slice(0,6);
 return {weak:weak,fresh:fresh,due:due,miss:miss,soon:soon,any:!!(weak.length||miss.length||due.length)}}
/* a gap round: the passages you missed first, then the weakest areas */
function gapSlots(n){
 var g=gapInfo(),out=g.miss.slice(0,Math.min(n,6)).map(function(x){return {area:x.c.area,chunk:x.c.id}});
 if(out.length<n){var rest=planFor('drill',n-out.length).filter(function(p){return p.why==='weak'||p.why==='due'});if(!rest.length)rest=planFor('drill',n-out.length);flatten(rest).forEach(function(x){if(out.length<n)out.push(x)})}
 return mix(out)}
function nextHint(){var g=gapInfo();if(g.due.length)return T('Due for review now: '+g.due.slice(0,3).map(function(a){return a.name.en}).join(', ')+'.','现在该复习：'+g.due.slice(0,3).map(function(a){return a.name.zh}).join('、')+'。');
 if(g.soon)return T('Next review: '+g.soon.a.name.en+' '+(g.soon.d===1?'tomorrow':'in '+g.soon.d+' days')+'.','下次复习：'+g.soon.a.name.zh+(g.soon.d===1?'，明天。':'，'+g.soon.d+' 天后。'));return ''}
function flatten(plan){var out=[];plan.forEach(function(p){for(var i=0;i<p.k;i++)out.push({area:p.id})});return mix(out)}
async function startRound(kind,n){
 if(!CH.length){say('Add material first.','请先添加资料。');return}
 if(R&&R.busy)return;
 var slots=kind==='gap'?gapSlots(n):flatten(planFor(kind,n));
 if(!slots.length){say('No passage matches an exam area yet. Add keywords to your areas, or add material that covers them.','还没有文字能对上任何考试领域。请给领域加关键词，或添加覆盖这些领域的资料。');return}
 R={kind:kind,slots:slots,items:[],i:0,gen:0,busy:false,fail:0,view:'wait'};
 go('practice');renderPractice();
 try{await ensureModel()}catch(e){R=null;renderPractice();go('model');return}
 pump();show()}
async function pump(){
 var r=R;if(!r||r.busy)return;r.busy=true;
 while(R===r&&r.gen<r.slots.length&&r.items.length-r.i<2){
  var slot=r.slots[r.gen],item=null;
  for(var tries=0;tries<3&&!item&&R===r;tries++){
   var ch=slot.chunk?CH.filter(function(c){return c.id===slot.chunk})[0]:Lg.pick(CH,slot.area,S.miss,S.used,Math.random);if(!ch)break;
   var a=areas().filter(function(x){return x.id===slot.area})[0]||{},ex=useExam();
   var pl=pageLang();
   try{var raw=await ENG.chat(Lg.prompt({text:ch.text,lang:pl,srcLang:Lg.lang(ch.text),exam:ex?exam().e.name[pl]+(exam().v.label[pl]?' ('+(pl==='zh'?'考纲：':'outline: ')+exam().v.label[pl]+')':''):'',domain:(a.name&&a.name[pl])||a.dom||'',tasks:a.tasks||''}));
    var q=Lg.parseQuestion(raw);if(q&&!Lg.inLang(q,pl))q=null;
    /* second opinion: the model answers its own question from the passage without the key; a clear disagreement drops the question */
    if(q&&r.items.concat(S.bank.slice(-30)).some(function(x){return x.chunk===ch.id&&x.lang===pl&&Lg.similar(q,x)})){q=null;r.dup=(r.dup||0)+1}
    if(q){var v=Lg.parseVerify(await ENG.chat(Lg.verifyPrompt({text:ch.text,lang:pl,q:q})));if(v>-1&&v!==q.a){q=null;r.dropped=(r.dropped||0)+1}}
    if(q){q=Lg.shuffle(q,Math.random);S.used[ch.id]=(S.used[ch.id]||0)+1;
     var m=S.mats.filter(function(x){return x.id===ch.mat})[0];
     item={id:'q'+Date.now().toString(36)+r.gen,area:slot.area,chunk:ch.id,q:q.q,o:q.o,a:q.a,e:q.e,lang:pl,loc:ch.loc,mat:m?m.name:'',snip:ch.text.slice(0,420),res:null}}}catch(e){}
  }
  if(R!==r)break;
  r.gen++;if(item){r.items.push(item);S.bank.push(item);if(S.bank.length>300)S.bank.shift();save()}else r.fail++;
  if(r.view==='wait')show()}
 r.busy=false;if(R===r&&r.view==='wait')show()}
function show(){
 if(!R)return;
 if(R.i<R.items.length){R.view=R.items[R.i].res==null?'q':'fb'}
 else if(R.gen>=R.slots.length&&!R.busy)R.view='end';else R.view='wait';
 renderPractice(true)}
function record(it,ok){
 var s=S.stats[it.area]||(S.stats[it.area]={h:[],n:0,c:0,last:0});s.h.push(ok?1:0);if(s.h.length>30)s.h.shift();s.n++;s.c+=ok?1:0;s.last=Date.now();
 /* it.md = what this answer did to the passage's miss count, so undo takes back exactly that */
 var m=S.miss[it.chunk]||0;it.md=ok?(m>0?-1:0):1;S.miss[it.chunk]=m+it.md;
 var k=Lg.dayKey(),d=S.days[k]||(S.days[k]={n:0,c:0});d.n++;d.c+=ok?1:0;
 var keys=Object.keys(S.days).sort();while(keys.length>120)delete S.days[keys.shift()];
 it.res=ok?1:0;save()}
function answer(i){var it=R.items[R.i];if(it.res!=null||it.pick!=null)return;it.pick=i;
 if(R.kind==='exam'){record(it,i===it.a);R.i++;pump();show()}else{record(it,i===it.a);it.counted=true;syncOrig(it);R.view='fb';renderPractice(true);pump();renderBook()}}
function undo(it){var s=S.stats[it.area];if(s){s.h.pop();s.n--;s.c-=it.res?1:0}S.miss[it.chunk]=Math.max(0,(S.miss[it.chunk]||0)-(it.md||0));it.md=0;
 var d=S.days[Lg.dayKey()];if(d){d.n--;d.c-=it.res?1:0}it.counted=false}
/* a right answer you guessed counts as a miss: the strength map should not trust luck */
function guess(){var it=R.items[R.i];if(!it||!it.counted||it.res!==1||it.guess)return;undo(it);record(it,false);it.counted=true;it.guess=1;save();renderPractice(true)}
/* a slip of the finger: take the answer back and choose again */
function redo(){var it=R.items[R.i];if(!it||!it.counted)return;undo(it);it.pick=null;it.res=null;it.guess=0;save();R.view='q';renderPractice(true)}
/* take its result back out; a question flagged while redoing the wrong-question book leaves the book too */
function flag(){var it=R.items[R.i];if(!it||!it.counted)return;undo(it);it.flag=1;if(it.orig)it.orig.flag=1;save();next()}
function next(){R.i++;pump();show();renderAll(true)}

/* ---------- rendering ---------- */
var WHY={new:['Not tested yet','还没测过'],weak:['Weak','薄弱'],due:['Due for review','该复习了'],keep:['Keep warm','保持']};
function streakBox(td,n){
 var st=Lg.streak(S.days),wk=Lg.week(S.days),R=22,C=2*Math.PI*R,pct=Math.min(1,td.n/Math.max(1,n)),WD=[T('S','日'),T('M','一'),T('T','二'),T('W','三'),T('T','四'),T('F','五'),T('S','六')];
 var msg=td.n>=n?T('Goal reached today. Anything more is a bonus.','今天的目标完成了，再做就是加分。'):td.n>0?T('Keep going.','继续保持。'):st>0?T('Do a few questions today to keep your '+st+'-day streak.','今天做几题，保住连续 '+st+' 天的记录。'):T('Answer a few questions today to start a streak.','今天做几题，开始连续记录。');
 return '<div class="streak"><svg class="ring" viewBox="0 0 52 52" width="52" height="52" role="img" aria-label="'+(pageLang()==='zh'?'今天：'+td.n+' / '+n+' 题':'Today: '+td.n+' of '+n+' questions')+'"><circle cx="26" cy="26" r="'+R+'" class="rt"/><circle cx="26" cy="26" r="'+R+'" class="rf" stroke-dasharray="'+(C*pct).toFixed(1)+' '+C.toFixed(1)+'" transform="rotate(-90 26 26)"/><text x="26" y="30" text-anchor="middle">'+td.n+'</text></svg>'+
  '<div class="sk"><b>'+(st?'🔥 '+T(st+(st===1?' day':' days'),st+' 天'):T('No streak yet','还没有连续记录'))+'</b><span class="meta">'+T('Today '+td.n+' of '+n+' questions. ','今天 '+td.n+' / '+n+' 题。')+msg+'</span></div>'+
  '<div class="wk" aria-hidden="true">'+wk.map(function(x){return '<i class="'+(x.n?(x.c/x.n>=.7?'hi':'mid'):'')+'" title="'+x.k+(x.n?' · '+x.c+'/'+x.n:'')+'"><u>'+WD[x.wd]+'</u></i>'}).join('')+'</div></div>'}
/* the coach's word after a round: how it went and how far today's goal has come */
function coachNote(got,tot){if(!tot)return '';var r=got/tot,td=today(),n=S.perDay,left=Math.max(0,n-td.n),m;
 m=r>=0.8?T('Solid round. Keep this up and these areas will move to “due for review” instead of “weak”.','这一轮很扎实。保持下去，这些领域会从“薄弱”变成“到期复习”。'):
  r>=0.5?T('You are getting there. The misses are where the next round will help most.','正在进步。答错的地方，正是下一轮最有帮助的地方。'):
  T('A hard round, and that is useful: it shows exactly where the gaps are. Redo the misses once, then try again.','这一轮不容易，但很有用：它准确指出了缺口。先把错题重做一遍，再来一轮。');
 return '<p class="coachnote">'+m+' '+(left?T(left+' more question'+(left===1?'':'s')+' to reach today’s goal.','离今天的目标还差 '+left+' 题。'):T('Today’s goal is reached.','今天的目标已完成。'))+'</p>'}
function renderToday(){
 var el=$('today'),n=S.perDay,td=today();
 if(!CH.length){el.innerHTML='';return}
 var plan=planFor('drill',n),g=gapInfo(),tested=Object.keys(S.stats).length>0,h,names=function(l){return l.slice(0,3).map(function(x){return T((x.a||x).name.en,(x.a||x).name.zh)}).join(T(', ','、'))};
 if(!tested)h=T('Your coach starts with a first round across your material. The answers show where the gaps are.','教练先带你过一遍资料，看你答得怎样，就知道缺口在哪里。');
 else if(!g.any)h=T('No gaps right now. Keep it warm with a short round.','目前没有明显缺口。做一小轮保持手感。');
 else h=(g.weak.length?T('Weak: ','薄弱：')+names(g.weak)+'. ':'')+(g.due.length?T('Due for review: ','该复习：')+names(g.due)+'. ':'')+(g.fresh.length?T('Not tested yet: ','还没测过：')+names(g.fresh)+'. ':'');
 el.innerHTML='<h2>'+T('Your <em>coach</em>','你的<em>教练</em>')+'</h2><p class="lead2">'+h+'</p>'+streakBox(td,n)+
  (g.miss.length?'<p class="meta">'+T('Passages you missed most: ','你错得最多的段落：')+g.miss.slice(0,3).map(function(x){return aname(x.c.area)+' · '+esc(x.c.loc)+' ×'+x.n}).join(' ; ')+'</p>':'')+
  '<ul class="plan">'+plan.map(function(p){var w=WHY[p.why];return '<li><span class="pk">'+p.k+'</span><span>'+aname(p.id)+'</span><span class="chip">'+T(w[0],w[1])+'</span></li>'}).join('')+'</ul>'+
  '<p class="acts"><button class="btn pri" data-act="drill">'+T('Practise now','现在练习')+'</button>'+(g.any?'<button class="btn" data-act="gap">'+T('Fix my gaps','补我的缺口')+'</button>':'')+(useExam()?'<button class="btn sm" data-act="exam">'+T('Mini exam · 20 questions','小测验 · 20 题')+'</button>':'')+
  '<label class="per">'+T('Per day','每天')+' <select data-act="perday" aria-label="Questions per day · 每天题数">'+[5,10,20].map(function(x){return '<option'+(x===n?' selected':'')+'>'+x+'</option>'}).join('')+'</select></label></p>'}
function renderMap(){
 var el=$('map');if(!CH.length){el.innerHTML='';return}
 el.innerHTML='<h2>'+T('Strength <em>map</em>','强弱<em>图</em>')+'</h2><div class="rows">'+areas().map(function(a){var s=Lg.strength(hist(a.id)),p=s==null?0:Math.round(s*100),n=(S.stats[a.id]||{}).n||0,none=!hasMat(a.id);
  return '<div class="row"><div class="rl">'+T(a.name.en,a.name.zh)+(useExam()&&!a.other?' <span class="meta">'+a.w+'%</span>':'')+(s!=null&&s<0.6?lessonLinks(a):'')+'</div><div class="bar" role="img" aria-label="'+(s==null?'Not tested yet · 还没测过':p+'%')+'"><i class="'+(s!=null&&s<0.6?'weak':'')+'" style="width:'+p+'%"></i></div><div class="rv2">'+(s==null?(none?T('no material','缺资料'):T('not tested','未测')):p+'%')+'</div><div class="meta rn">'+n+'</div></div>'}).join('')+'</div><p class="meta">'+T('Strength blends your recent answers, newest first. The right-hand number is questions answered.','强度综合你近期的作答，越新权重越大。最右边的数字是已答题数。')+'</p>'+mapNotes()+'<p class="acts"><button class="btn pri" data-go="practice">'+T('Practise now','现在练习')+'</button>'+'<button class="btn" data-go="track">'+T('Turn it into a track','变成一条路线')+'</button></p>'}
/* what the map cannot show by itself: areas with nothing to ask from, and passages that matched no area */
function mapNotes(){if(!useExam())return '';var A=areas(),no=A.filter(function(a){return !a.other&&!hasMat(a.id)}),o=CH.filter(function(c){return c.area===OTHER}).length,h='';
 if(no.length)h+='<p class="meta warn">'+T('No material for: ','缺资料的领域：')+no.map(function(a){return T(a.name.en,a.name.zh)}).join(T(', ','、'))+T('. No questions are asked there until a passage matches: add material, or add keywords to the area.','。在有文字对上之前，这些领域不出题：请添加资料，或给领域加关键词。')+'</p>';
 if(o)h+='<p class="meta">'+T(o+' of '+CH.length+' passages matched no area. They are practised under “Other” and left out of the mini exam.','共 '+CH.length+' 段文字，其中 '+o+' 段没有对上任何领域。它们归在“其他”里练习，不进小测验。')+'</p>';
 return h}
/* a weak area of a ready-made outline points at this site's lessons on it (titles from tracks-index.js) */
function lessonLinks(a){var L=a.lessons,X=window.TRACK_INDEX&&L&&window.TRACK_INDEX[L.track];if(!X)return '';
 var f=L.files.filter(function(x){return X.titles[x]});if(!f.length)return '';
 return '<div class="meta ll">'+T('Lessons on this: ','相关的课：')+f.map(function(x){return '<a href="../'+L.track+'/'+x+'">'+T(esc(X.titles[x].en),esc(X.titles[x].zh))+'</a>'}).join(' · ')+'</div>'}
function renderMats(){
 $('mats').innerHTML=(S.mats.length?'<p class="meta">'+S.mats.length+' '+T('files','个文件')+' · '+CH.length+' '+T('passages','段文字')+'</p><ul class="files'+(S.mats.length>6?' long':'')+'">'+S.mats.map(function(m){return '<li><span class="fn">'+esc(m.name)+'</span><span class="meta">'+m.pages+' '+(m.word==='slide'?T('slides','张幻灯片'):(m.word==='page'?T('pages','页'):T('text','文本')))+' · '+(m.lang==='zh'?'中文':'English')+'</span><button class="btn sm" data-act="rm" data-id="'+m.id+'" aria-label="Remove '+esc(m.name)+' · 移除">'+T('Remove','移除')+'</button></li>'}).join('')+'</ul>':'')+
  '<label class="drop" id="drop"><input type="file" id="files" multiple accept=".pdf,.pptx,.txt,.md"><span>'+T('Choose files or drop them here · PDF, PPTX, text · English or 中文','选择文件或拖到这里 · PDF、PPTX、文本 · 中英文均可')+'</span></label><p class="meta">'+T('Private: your files are read on this device and never uploaded. No login.','私密：文件只在这台设备上读取，从不上传。不用登录。')+'</p>'+(CH.length?'<p class="acts"><button class="btn pri" data-go="goal">'+T('Continue: your goal','继续：你的目标')+' →</button></p>':'')}
function chint(n){return T('Copy these from the exam’s official outline. Add words to help the matching with “Area | word word | 30”.','请抄自该考试的官方考纲。想让匹配更准，可以写成“领域 | 关键词 关键词 | 30”。')+(n?'':' <b>'+T('Add at least one area; until then questions follow your files.','至少填一个领域；在此之前，题目按你的文件出。')+'</b>')}
function renderGoal(){
 var x=exam(),d=x.v.domains,cu=S.exam==='custom';
 $('goal').innerHTML='<div class="seg2" role="radiogroup" aria-label="Goal · 目标"><label><input type="radio" name="goal" value="understand"'+(S.goal==='understand'?' checked':'')+'> '+T('Understand the material','弄懂这份资料')+'</label><label><input type="radio" name="goal" value="exam"'+(S.goal==='exam'?' checked':'')+'> '+T('Prepare for an exam','备考某场考试')+'</label></div>'+
  (S.goal==='exam'?'<p class="rowf"><label>'+T('Exam','考试')+' <select data-act="exam-id" aria-label="Exam · 考试"><option value="custom"'+(cu?' selected':'')+'>My own exam, enter its areas · 我自己的考试，填写领域</option>'+EX.map(function(e){return '<option value="'+e.id+'"'+(e.id===S.exam?' selected':'')+'>Ready-made outline: '+e.name.en+' · 现成考纲：'+e.name.zh+'</option>'}).join('')+'</select></label>'+
   (cu?'':' <label>'+T('Outline','考纲')+' <select data-act="exam-ver" aria-label="Outline version · 考纲版本">'+x.e.versions.map(function(v){return '<option value="'+v.id+'"'+(v.id===S.ver?' selected':'')+'>'+v.label.en+' · '+v.label.zh+'</option>'}).join('')+'</select></label>')+'</p>'+
   (cu?'<p class="rowf"><label>'+T('Exam name','考试名称')+' <input type="text" id="cname" maxlength="60" value="'+esc(S.cname||'')+'" placeholder="'+esc(PH('e.g. my certification','例如：我要考的证书'))+'"></label></p>'+
     '<p class="rowf"><label>'+T('Areas and weights, one per line','领域和比例，每行一个')+'<textarea id="ctext" rows="5" aria-label="Areas and weights · 领域和比例" placeholder="'+esc(PH('Area one, 40\nArea two, 35\nArea three, 25','领域一, 40\n领域二, 35\n领域三, 25'))+'">'+esc(S.ctext||'')+'</textarea></label></p>'+
     '<p class="meta" id="chint">'+chint(d.length)+'</p>'
    :'<p class="meta">'+d.map(function(a){return T(a.name.en,a.name.zh)+' '+a.weight+'%'}).join(' · ')+'. '+T('Questions follow these shares. Check them against the','题目按这些比例出。请对照')+' <a href="https://www.pmi.org/certifications/project-management-pmp" target="_blank" rel="noopener noreferrer">'+T('official outline','官方考纲')+'</a>.</p>'):
   '<p class="meta">'+T('Questions spread across your files and lean toward what you miss.','题目分布在你的各个文件里，并偏向你答错的地方。')+'</p>')+'<p class="acts"><button class="btn pri" data-go="model">'+T('Continue: the model','继续：模型')+' →</button></p>'}
function renderModel(busy,err){
 renderFlow();
 var gpu=!!navigator.gpu||!!window.__coachTestEngine,ready=!!ENG&&(window.__coachTestEngine||ENGID);
 var msg=err==='nogpu'?T('This browser or computer cannot run the model (it needs WebGPU). Use desktop Chrome or Edge.','这个浏览器或电脑无法运行模型（需要 WebGPU）。请用电脑版 Chrome 或 Edge。'):
  err==='nomodel'?T('The model list changed. Please report it on GitHub.','模型列表已变化。请到 GitHub 报告。'):err==='fail'?T('The download or start failed. Check your connection and try again.','下载或启动失败。请检查网络后重试。'):'';
 $('model').innerHTML='<div class="seg2" role="radiogroup" aria-label="Model · 模型"><label><input type="radio" name="model" value="light"'+(S.model==='light'?' checked':'')+'> '+T('Light · about 1.2 GB, faster','轻量 · 约 1.2 GB，更快')+'</label><label><input type="radio" name="model" value="better"'+(S.model==='better'?' checked':'')+'> '+T('Better · about 2.5 GB, needs more memory','更好 · 约 2.5 GB，需要更多内存')+'</label></div>'+
  '<p class="acts"><button class="btn'+(ready?'':' pri')+'" data-act="load"'+(busy||!gpu?' disabled':'')+'>'+(ready?T('Model ready','模型已就绪'):busy?T('Starting…','启动中…'):T('Download and start the model','下载并启动模型'))+'</button></p>'+
  '<progress id="mprog" max="100" value="0"'+(busy?'':' hidden')+' aria-label="Model download · 模型下载"></progress><p class="meta" id="mline" aria-live="polite"></p>'+
  (!navigator.gpu&&!window.__coachTestEngine?'<p class="warn">'+T('This browser has no WebGPU. You can still add material and see the plan, but questions need desktop Chrome or Edge.','这个浏览器没有 WebGPU。你仍可添加资料、查看计划，但出题需要电脑版 Chrome 或 Edge。')+'</p>':'')+(msg?'<p class="warn">'+msg+'</p>':'')+
  '<p class="meta">'+T('Open models (Qwen3, Apache 2.0), run by your own browser on desktop Chrome or Edge. The first download is large and is kept by the browser for next time. A small model: some questions will be wrong, so use “looks wrong” on them.','开源模型（Qwen3，Apache 2.0），由你自己的浏览器在电脑版 Chrome 或 Edge 上运行。首次下载较大，浏览器会留着供下次使用。模型较小，有些题会出错：用“有问题”按钮标出来。')+'</p>'+(ready&&CH.length?'<p class="acts"><button class="btn pri" data-go="practice">'+T('Start practising','开始练习')+' →</button></p>':'')}
function renderBackup(){
 $('backup').innerHTML='<p class="acts"><button class="btn" data-act="export">'+T('Export my records','导出我的记录')+'</button><label class="btn">'+T('Import','导入')+'<input type="file" id="imp" accept=".json,application/json" hidden></label>'+
  '<button class="btn" data-act="reset">'+(confirmKey==='reset'?T('Click again to erase everything','再点一次，清除全部'):T('Erase everything','清除全部'))+'</button></p>'+
  '<p class="meta">'+T('Your records and the text of your files live only in this browser. Export to back them up or move to another device; the file contains your materials’ text, so keep it private.','你的记录和资料文字只保存在这个浏览器里。可导出来备份或换设备；导出的文件含有资料文字，请妥善保管。')+(persistOK?'':' <b>'+T('This browser blocks saving: export before you leave.','这个浏览器禁止保存：离开前请先导出。')+'</b>')+'</p>'}
function renderPractice(focus){
 var el=$('practice');if(!R){el.hidden=true;el.innerHTML='';return}
 el.hidden=V!=='practice';var h='',it=R.items[R.i],total=R.slots.length;
 if(R.view==='wait'){h='<p class="meta" aria-live="polite">'+T('Writing question '+(Math.min(R.items.length,total-1)+1)+' of '+total+'… the first one takes a little while.','正在出第 '+(Math.min(R.items.length,total-1)+1)+' / '+total+' 题…第一题要稍等。')+'</p><progress id="pprog" max="100" value="0" hidden aria-label="Model download · 模型下载"></progress><p class="meta" id="pline" aria-live="polite"></p>'}
 else if(R.view==='end'){
  var got=R.items.filter(function(x){return x.res===1}).length,by={};R.items.forEach(function(x){var b=by[x.area]||(by[x.area]={n:0,c:0});if(x.res!=null){b.n++;b.c+=x.res}});
  h='<h2>'+T('Round <em>done</em>','本轮<em>完成</em>')+'</h2><p class="lead2">'+T(got+' of '+R.items.length+' right','答对 '+got+' / '+R.items.length)+(R.fail?' <span class="meta">'+T('('+R.fail+' could not be written)','（有 '+R.fail+' 题没能生成）')+'</span>':'')+'</p><ul class="plan">'+Object.keys(by).map(function(k){return '<li><span class="pk">'+by[k].c+'/'+by[k].n+'</span><span>'+aname(k)+'</span></li>'}).join('')+'</ul>';
  if(R.kind==='exam'){var wr=R.items.filter(function(x){return x.res===0});if(wr.length)h+='<h3>'+T('Review','回顾')+'</h3>'+wr.map(function(x){return '<div class="rev"><p class="qt">'+esc(x.q)+'</p><p><b>'+T('Answer','答案')+':</b> '+esc(x.o[x.a])+'</p><p class="meta">'+esc(x.e)+'</p></div>'}).join('')}
  var missed=R.items.filter(function(x){return x.res===0}),nh=nextHint();
  h+=coachNote(got,R.items.length);
  if(R.kind!=='exam'&&missed.length)h+='<p class="meta">'+T('Your gaps from this round: ','本轮的缺口：')+Object.keys(missed.reduce(function(o,x){o[x.area]=1;return o},{})).map(aname).join(T(', ','、'))+'.</p>';
  if(nh)h+='<p class="meta">'+nh+'</p>';
  h+='<p class="acts">'+(book().length?'<button class="btn pri" data-act="redoset">'+T('Redo my misses now','马上重做错题')+' ('+book().length+')</button><button class="btn" data-act="drill">':'<button class="btn pri" data-act="drill">')+T('Another round','再来一轮')+'</button><button class="btn" data-go="progress">'+T('See my progress','看我的进度')+'</button><button class="btn" data-act="close">'+T('Done','完成')+'</button></p>'}
 else if(it){
  var fb=R.view==='fb';
  h='<p class="meta">'+T('Question '+(R.i+1)+' of '+total,'第 '+(R.i+1)+' / '+total+' 题')+' · '+aname(it.area)+'</p><h3 class="qt" id="qt" tabindex="-1">'+esc(it.q)+'</h3><div class="opts" role="group" aria-labelledby="qt">'+
   it.o.map(function(o,i){var c=fb?(i===it.a?' ok':(i===it.pick?' no':'')):'';return '<button class="opt'+c+'" data-act="opt" data-i="'+i+'"'+(fb?' disabled':'')+'><b>'+'ABCD'[i]+'</b><span>'+esc(o)+'</span></button>'}).join('')+'</div>';
  if(fb)h+='<div class="fb" aria-live="polite"><p><b>'+(it.pick===it.a?T('Right.','答对了。'):T('Not quite.','不对。'))+'</b> '+esc(it.e)+'</p><details><summary>'+T('From your material','来自你的资料')+': '+esc(it.mat)+', '+esc(it.loc)+'</summary><p class="snip">'+esc(it.snip)+'…</p></details><p class="acts"><button class="btn pri" id="nx" data-act="next">'+(R.i+1>=R.items.length&&R.gen>=total?T('See the result','看结果'):T('Next','下一题'))+'</button>'+(it.pick===it.a&&!it.guess?'<button class="btn sm" data-act="guess">'+T('I guessed','我是蒙的')+'</button>':'')+'<button class="btn sm" data-act="redo">'+T('Change my answer','改我的答案')+'</button><button class="btn sm" data-act="flag">'+T('This question looks wrong: don’t count it','这道题有问题：不计入')+'</button></p></div>'}
 el.innerHTML=h;
 if(focus){var f=R.view==='fb'?$('nx'):(R.view==='q'?$('qt'):null);if(f)f.focus()}}
function renderAll(keepPractice){var ap=$('app');if(ap){if(CH.length)ap.setAttribute('data-ready','');else ap.removeAttribute('data-ready')}renderToday();renderMap();renderMats();renderGoal();renderBackup();renderShare();renderBook();if(!keepPractice)renderPractice();applyView()}



/* ---------- one flow: a bar of steps, and only the panel you are on ---------- */
var V='mats';
function modelReady(){return !!ENG&&!!(window.__coachTestEngine||ENGID)}
function goalLabel(){return S.goal==='exam'?((S.exam==='custom'?(S.cname||'').trim():exam().e.name[pageLang()])||T('Exam','考试')):T('Understand','弄懂资料')}
function renderFlow(){
 var el=$('flow');if(!el)return;var has=CH.length>0,td=today(),bk=book().length;
 var it=[['mats','1 ',T('Material','资料'),has?S.mats.length+' '+T('files','个文件'):T('add files','添加文件'),1],
  ['goal','2 ',T('Goal','目标'),goalLabel(),1],
  ['model','3 ',T('Model','模型'),modelReady()?T('ready','已就绪'):T('not started','未启动'),1],
  null,
  ['practice','',T('Practise','练习'),has?td.n+' / '+S.perDay+' '+T('today','今天'):'',has],
  ['progress','',T('Progress','进度'),has&&bk?bk+' '+T('to redo','待重做'):'',has],
  ['track','',T('Track','路线'),'',has]];
 el.innerHTML=it.map(function(x){if(!x)return '<span class="sep" aria-hidden="true"></span>';
  return '<button type="button" data-go="'+x[0]+'"'+(x[0]===V?' aria-current="step"':'')+(x[4]?'':' disabled')+'><b>'+(x[1]?'<i>'+x[1]+'</i>':'')+x[2]+'</b><small>'+(x[3]||'&nbsp;')+'</small></button>'}).join('')}
function applyView(){
 if(!CH.length&&V!=='mats'&&V!=='goal'&&V!=='model')V='mats';
 document.querySelectorAll('#app > section[data-v]').forEach(function(sec){sec.hidden=sec.dataset.v!==V||(sec.id==='practice'&&!R)||(sec.id==='today'&&R)||sec.id==='review'});
 renderFlow()}
function go(v,quiet){V=v;applyView();var ap=$('app');if(ap&&!quiet&&ap.scrollIntoView)ap.scrollIntoView({block:'start'})}

/* ---------- wrong-question book: what you missed or guessed, redone shuffled, printable ---------- */
function book(){return S.bank.filter(function(x){return x.res===0&&!x.flag&&!x.done})}
function syncOrig(it){if(!it.orig)return;if(it.res===1&&!it.guess)it.orig.done=1;else if(it.res===0||it.guess){it.orig.done=0;if(!it.again){it.again=1;it.orig.again=(it.orig.again||0)+1}}}
function renderBook(){
 var el=$('book');if(!el)return;var b=book(),rep=b.filter(function(x){return x.again>0}).length;
 if(!b.length){el.innerHTML='<p class="meta">'+T('Nothing here yet. Questions you miss, or guess right, are kept here so you can redo them.','这里还没有内容。你答错或蒙对的题会留在这里，方便重做。')+'</p>';return}
 el.innerHTML='<p>'+T(b.length+' questions to redo'+(rep?', '+rep+' missed again':''),'待重做 '+b.length+' 题'+(rep?'，其中 '+rep+' 题重做后又错':''))+'</p><ul class="files">'+b.slice(0,6).map(function(x){return '<li><span class="fn">'+esc(x.q.slice(0,90))+(x.q.length>90?'…':'')+'</span><span class="meta">'+(x.guess?T('guessed','蒙的')+' · ':'')+(x.again?T('missed again','又错了')+' · ':'')+aname(x.area)+'</span></li>'}).join('')+'</ul>'+(b.length>6?'<p class="meta">+ '+(b.length-6)+'</p>':'')+
  '<p class="acts"><button class="btn pri" data-act="redoset">'+T('Redo them, shuffled','打乱后重做')+'</button><button class="btn" data-act="print">'+T('Print the book','打印错题本')+'</button></p>'}
function startRedo(){
 var b=book();if(!b.length||(R&&R.busy))return;
 var items=mix(b.slice()).map(function(x,i){var q=Lg.shuffle({q:x.q,o:x.o,a:x.a,e:x.e},Math.random);return {id:'r'+Date.now().toString(36)+i,area:x.area,chunk:x.chunk,q:q.q,o:q.o,a:q.a,e:q.e,loc:x.loc,mat:x.mat,snip:x.snip,res:null,orig:x}});
 R={kind:'redo',slots:items.map(function(x){return {area:x.area}}),items:items,i:0,gen:items.length,busy:false,fail:0,view:'q'};
 go('practice');renderPractice()}
function printBook(){
 var b=book(),el=$('printarea');if(!el||!b.length)return;
 el.innerHTML='<h1>'+T('My wrong-question book','我的错题本')+'</h1>'+b.map(function(x,i){return '<div class="pq"><p><b>'+(i+1)+'.</b> '+esc(x.q)+'</p><ol type="A">'+x.o.map(function(o){return '<li>'+esc(o)+'</li>'}).join('')+'</ol><p><b>'+T('Answer','答案')+':</b> '+'ABCD'.charAt(x.a)+'. '+esc(x.o[x.a])+'</p><p>'+esc(x.e)+'</p></div>'}).join('');
 document.body.classList.add('printing');window.print();setTimeout(function(){document.body.classList.remove('printing')},500)}

/* ---------- share notes (opens GitHub's own new-file page; nothing is sent from here) ---------- */
var REPO='zhengtongxin/tx-learns';
function defTopic(){return (S.noteTopic||'').trim()||(S.exam==='custom'?(S.cname||'').trim():exam().e.name.en)||PH('My notes','我的笔记')}
/* where the notes go: a brand-new track (default), or one more lesson in an existing track */
function trackChoices(){return (window.TRACKS||[]).map(function(t){return {id:t.id,en:t.title.en,zh:t.title.zh}})}
function shareBody(o){
 o=o||{};
 var weak=areas().map(function(a){var v=Lg.strength(hist(a.id));return {n:a.name.en,p:v==null?null:Math.round(v*100)}}).filter(function(a){return a.p!=null}).sort(function(a,b){return a.p-b.p});
 var topic=defTopic(),tr=S.noteTrack||'new',dg=CH.length?Lg.digest(CH,S.mats,{titles:o.titles,terms:o.terms}):{outline:[],terms:[]},t,sec='';
 if(useExam()){var x=exam();sec+='\n## Exam areas\n'+x.v.domains.map(function(a){return '- '+a.name.en+': '+a.weight+'%'}).join('\n')+'\n'}
 if(dg.outline.some(function(m){return m.titles.length}))sec+='\n## Outline of my material (the first line of each passage, cut short)\n'+dg.outline.filter(function(m){return m.titles.length}).map(function(m){return '### Material '+m.n+' ('+m.kind+')\n'+m.titles.map(function(x,i){return (i+1)+'. '+x}).join('\n')}).join('\n\n')+'\n';
 if(dg.terms.length)sec+='\n## Key terms\n'+dg.terms.join(', ')+'\n';
 if((o.sums==null?true:o.sums)&&S.sums&&S.sums.length)sec+='\n## Key ideas from my material (written by the AI in its own words)\n'+S.sums.map(function(x){return '- '+x}).join('\n')+'\n';
 t='# '+topic+'\n\nTrack: '+tr+'\n'+(tr==='new'?'Subject: community\n':'')+'Language: '+pageLang()+'\n'+sec+'\n## Where I was weak\n'+(weak.length?weak.slice(0,4).map(function(a){return '- '+a.n+': '+a.p+'% right in my practice'}).join('\n'):'- (no practice yet)')+'\n\n## What I learned, in my own words\n'+((S.notes||'').trim()||'(none yet)')+'\n';
 return {topic:topic,text:t,content:dg.outline.some(function(m){return m.titles.length})||dg.terms.length>0}}
/* one GitHub link when it fits (a prefilled link only holds so much); otherwise the full text is copied and pasted into the editor */
var URLMAX=7000;
function shareUrl(){
 var steps=[[30,30],[20,20],[12,12],[6,10],[0,0]],b,u,slug,folder,i;
 function mk(b,withValue){slug=b.topic.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'notes';
  folder=slug+'-'+Lg.dayKey().replace(/-/g,'')+'-'+(S.shareId||(S.shareId=Math.random().toString(36).slice(2,6)));
  return 'https://github.com/'+REPO+'/new/notes?filename='+encodeURIComponent('inbox/'+folder+'/notes.md')+(withValue?'&value='+encodeURIComponent(b.text):'')+'&message='+encodeURIComponent('Add study notes: '+b.topic)}
 for(i=0;i<steps.length;i++){b=shareBody({titles:steps[i][0],terms:steps[i][1]});u=mk(b,true);if(u.length<=URLMAX)return {url:u,text:b.text,clip:false,content:b.content}}
 b=shareBody({titles:60,terms:40});return {url:mk(b,false),text:b.text,clip:true,content:b.content}}
function shareOK(){var u=shareUrl();return !!S.shareOk&&((S.notes||'').trim().length>=40||u.content)&&u.text.length<60000}
function outline(){return areas().map(function(a){return '## '+a.name.en+'\n- '}).join('\n\n')}
var sBusy=false,sStop=false;
/* up to 30 passages, spread evenly over all the material, so the notes cover all of it */
function pickSums(){var n=Math.min(30,CH.length),out=[],st=CH.length/Math.max(1,n);for(var i=0;i<n;i++)out.push(CH[Math.floor(i*st)]);return out}
async function makeSums(){
 if(sBusy||!CH.length)return;sBusy=true;sStop=false;renderShare();
 try{await ensureModel()}catch(e){sBusy=false;renderShare();go('model');return}
 var pl=pageLang(),picks=pickSums(),out=[],i;S.sums=[];
 for(i=0;i<picks.length&&!sStop;i++){
  var pp=$('sline');if(pp)pp.textContent=T('Writing note '+(i+1)+' of '+picks.length+'…','正在写第 '+(i+1)+' / '+picks.length+' 条…');
  try{var raw=Lg.stripThink(await ENG.chat(Lg.sumPrompt({text:picks[i].text,lang:pl}))),a=raw.indexOf('{'),b=raw.lastIndexOf('}'),o=JSON.parse(raw.slice(a,b+1)),sm=String(o.summary||'').trim(),z=Lg.cjkShare(sm);
   if(sm.length>=15&&sm.length<=500&&!Lg.copied(sm,picks[i].text)&&Lg.scrubLine(sm)===sm&&(pl==='zh'?z>0.3:z<0.08)){out.push(sm);S.sums=out.slice();save()}}catch(e){}}
 sBusy=false;say(out.length+' notes written; read them below before you send.',out.length+' 条笔记已写好，发送前请在下面核对。');renderShare()}
function renderShare(){
 var el=$('share');if(!el)return;var n=(S.notes||''),u=shareUrl(),ok=shareOK(),tr=S.noteTrack||'new',ns=(S.sums||[]).length;
 el.innerHTML='<p class="meta">'+T('The model reads your material here in your browser and writes the key ideas in its own words. Those notes, an outline of headings and your own words go to GitHub; the content creator agent turns them into a track. Your files and their names never leave your device.','模型在你的浏览器里读你的资料，用它自己的话写出要点。这些笔记、标题提纲和你自己的话会发到 GitHub，由内容创作 agent 写成一条路线。你的文件和文件名不会离开你的设备。')+'</p>'+
 '<h3>'+T('1 · Let the model write the notes','1 · 让模型写笔记')+'</h3>'+
 '<p class="acts"><button class="btn'+(ns?'':' pri')+'" data-act="sums"'+(sBusy?' disabled':'')+'>'+(sBusy?T('Writing…','正在写…'):(ns?T('Write them again','重新写'):T('Write the notes with the AI','用 AI 写笔记')))+'</button>'+(sBusy?'<button class="btn sm" data-act="sstop">'+T('Stop','停止')+'</button>':'')+'</p>'+
 '<p class="meta" id="sline" aria-live="polite">'+(ns?T(ns+' notes from your material, up to 30 passages spread over all of it.',ns+' 条笔记，来自分布在全部资料里的至多 30 段。'):T('It reads up to 30 passages spread over all your material. It takes a few minutes; you can stop and keep what is done.','它会读分布在全部资料里的至多 30 段，需要几分钟；可以中途停止，已写好的会保留。'))+'</p>'+
 '<h3>'+T('2 · Topic and place','2 · 主题和去处')+'</h3><p class="rowf"><label>'+T('Topic','主题')+' <input type="text" id="ntopic" maxlength="60" value="'+esc(S.noteTopic||'')+'" placeholder="'+esc(defTopic())+'"></label>'+
 ' <label>'+T('Goes to','放到')+' <select data-act="track" aria-label="Where it goes · 放到哪里"><option value="new"'+(tr==='new'?' selected':'')+'>A new track · 一条新路线</option>'+trackChoices().map(function(t){return '<option value="'+t.id+'"'+(t.id===tr?' selected':'')+'>One more lesson in '+esc(t.en)+' · 加到 '+esc(t.zh)+'</option>'}).join('')+'</select></label></p>'+
 '<h3>'+T('3 · Your own words (optional)','3 · 你自己的话（可选）')+'</h3>'+
 '<textarea id="nbody" rows="4" maxlength="4000" aria-label="Your notes · 你的笔记" placeholder="Your own notes: what clicked, what confused you · 你自己的笔记：哪里想通了，哪里没懂">'+esc(n)+'</textarea>'+
 (n.trim()?'':'<p class="acts"><button class="btn sm" data-act="outline">'+T('Start from my areas','按我的领域列个提纲')+'</button></p>')+
 '<h3>'+T('4 · Check and send','4 · 检查并发送')+'</h3>'+
 '<label class="meta" for="npreview">'+T('What will be sent:','将要发送的内容：')+'</label><textarea id="npreview" rows="8" readonly aria-label="What will be sent · 将要发送的内容">'+esc(u.text)+'</textarea>'+
 '<label class="chk"><input type="checkbox" id="nok"'+(S.shareOk?' checked':'')+'> <span>'+T('I have read what will be sent. It has no pasted slides or text and no names of the material’s provider or platform, and I understand it becomes public.','我看过将要发送的内容：里面没有粘贴的课件或原文，也没有资料提供方或平台的名字，我明白它会公开。')+'</span></label>'+
 '<p class="acts"><button class="btn pri" data-act="share"'+(ok?'':' disabled')+'>'+T('Send to GitHub','发到 GitHub')+'</button><button class="btn" data-go="practice">'+T('Back to practice','回到练习')+'</button></p>'+
 '<p class="meta">'+T('This opens GitHub with everything filled in; you need a GitHub account. If you own the site, press “Commit changes” and the track is written for you. Anyone else gets a pull request, and nothing is merged until the site owner has read it.','这会打开 GitHub 并填好全部内容；你需要一个 GitHub 账号。站点拥有者按“Commit changes”，路线就会自动生成。其他人会发起一个 pull request，站点拥有者看过之前不会合并。')+' <b id="clipnote">'+clipNote(u.clip)+'</b></p>'}
function clipNote(c){return c?T('It is too long for one link, so it is copied for you: paste it into the editor with Ctrl or ⌘ + V.','内容太长，一个链接装不下，所以会先复制好：在编辑器里按 Ctrl 或 ⌘ + V 粘贴。'):''}
function doShare(){var u=shareUrl();if(!shareOK())return;
 if(u.clip){var go=function(){window.open(u.url,'_blank','noopener,noreferrer')};
  try{navigator.clipboard.writeText(u.text).then(function(){say('Copied. Paste it into the GitHub editor.','已复制。请粘贴到 GitHub 编辑器里。');go()},function(){say('Could not copy: select the text in the box and copy it yourself.','无法自动复制：请在框里选中文字自己复制。');go()})}catch(e){say('Could not copy: select the text in the box and copy it yourself.','无法自动复制：请在框里选中文字自己复制。');go()}
  S.shareId='';return}
 window.open(u.url,'_blank','noopener,noreferrer');S.shareId=''}

/* ---------- backup ---------- */
function exportAll(){
 var blob=new Blob([JSON.stringify({app:'tx-learns-coach',v:1,state:S,chunks:CH.map(function(c){return {id:c.id,mat:c.mat,loc:c.loc,text:c.text}})})],{type:'application/json'}),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download='study-coach-'+Lg.dayKey()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},2000)}
async function importAll(file){
 try{var d=JSON.parse(await file.text());if(d.app!=='tx-learns-coach'||!d.state||!Array.isArray(d.chunks))throw 0;
  S=tidy(Object.assign(fresh(),d.state));
  CH=d.chunks.filter(function(c){return c&&typeof c.text==='string'&&c.id&&c.mat}).slice(0,6000);R=null;reassign();await saveChunks();await kvSet('state',S);renderAll();say('Records imported.','记录已导入。')}
 catch(e){say('That file is not a study coach backup.','这个文件不是学习教练的备份。')}}

/* ---------- events ---------- */
document.addEventListener('click',function(e){
 var g=e.target.closest&&e.target.closest('[data-go]');if(g&&!g.disabled){go(g.dataset.go);return}
 var b=e.target.closest&&e.target.closest('[data-act]');if(!b||b.tagName==='SELECT')return;var a=b.dataset.act;
 if(a!=='reset'&&confirmKey){confirmKey='';renderBackup()}
 if(a==='drill'){if(R&&R.busy&&R.view!=='end')return;startRound('drill',S.perDay)}
 else if(a==='exam')startRound('exam',20);
 else if(a==='opt')answer(+b.dataset.i);
 else if(a==='next')next();
 else if(a==='flag')flag();
 else if(a==='guess'){guess();syncOrig(R.items[R.i])}
 else if(a==='redoset')startRedo();
 else if(a==='gap')startRound('gap',S.perDay);
 else if(a==='print')printBook();
 else if(a==='redo'){redo();syncOrig(R.items[R.i])}
 else if(a==='close'){R=null;renderAll()}
 else if(a==='rm'){dropMat(b.dataset.id);reassign();saveChunks();save();renderAll()}
 else if(a==='load')ensureModel().then(function(){renderFlow();if(V==='model'&&CH.length){go('practice');startRound('drill',S.perDay)}}).catch(function(){});
 else if(a==='export')exportAll();
 else if(a==='share')doShare();
 else if(a==='sums')makeSums();
 else if(a==='sstop')sStop=true;
 else if(a==='outline'){S.notes=outline();save();renderShare()}
 else if(a==='reset'){if(confirmKey==='reset'){S=fresh();CH=[];R=null;confirmKey='';kvSet('state',S);saveChunks();renderAll();say('Everything erased.','已全部清除。')}else{confirmKey='reset';renderBackup()}}});
document.addEventListener('change',function(e){var x=e.target;
 if(x.id==='files'){addFiles(x.files);x.value=''}
 else if(x.id==='nok'){S.shareOk=x.checked;save();renderShare()}
 else if(x.id==='imp'){if(x.files[0])importAll(x.files[0]);x.value=''}
 else if(x.name==='goal'){S.goal=x.value;reassign();save();renderAll()}
 else if(x.name==='model'){S.model=x.value;save();if(ENGID&&!window.__coachTestEngine){ENG=null;ENGID=''}renderModel()}
 else if(x.dataset&&x.dataset.act==='track'){S.noteTrack=x.value;save();renderShare()}
 else if(x.dataset&&x.dataset.act==='perday'){S.perDay=+x.value;save();renderToday()}
 else if(x.dataset&&x.dataset.act==='exam-id'){S.exam=x.value;S.ver=S.exam==='custom'?'':exam().e.versions[0].id;reassign();save();renderAll()}
 else if(x.id==='cname'||x.id==='ctext'){S.cname=($('cname')||{}).value!=null?$('cname').value:S.cname;S.ctext=($('ctext')||{}).value!=null?$('ctext').value:S.ctext;reassign();save();var h=$('chint');if(h)h.innerHTML=chint(exam().v.domains.length);renderToday();renderMap();renderShare();renderBook();renderFlow()}
 else if(x.dataset&&x.dataset.act==='exam-ver'){S.ver=x.value;reassign();save();renderAll()}});
document.addEventListener('input',function(e){var x=e.target;if(x.id==='nbody'||x.id==='ntopic'){if(x.id==='nbody')S.notes=x.value;else S.noteTopic=x.value;save();var b=document.querySelector('[data-act=share]');if(b)b.disabled=!shareOK();var su=shareUrl(),pv=$('npreview'),cn=$('clipnote');if(pv)pv.value=su.text;if(cn)cn.innerHTML=clipNote(su.clip)}});
document.addEventListener('dragover',function(e){if(e.target.closest&&e.target.closest('#drop'))e.preventDefault()});
document.addEventListener('drop',function(e){if(e.target.closest&&e.target.closest('#drop')){e.preventDefault();addFiles(e.dataTransfer.files)}});

/* ---------- start ---------- */
(async function(){
 DB=await openDB();if(!DB)persistOK=false;
 var s=await kvGet('state'),c=await kvGet('chunks');
 S=tidy(Object.assign(fresh(),s||{}));CH=Array.isArray(c)?c:[];
 if(S.exam!=='custom'&&!EX.some(function(x){return x.id===S.exam}))S.exam='custom';
 reassign();V=CH.length?'practice':'mats';renderAll();renderModel();$('app').hidden=false;window.__coach={state:function(){return S},chunks:function(){return CH},view:function(){return V}};
 if(navigator.storage&&navigator.storage.persist)try{navigator.storage.persist()}catch(e){}
})();
})();
