/* Study coach. Everything happens on the reader's device: files are read here, the model runs here (WebGPU), records live in IndexedDB.
   Nothing about the reader, the files or the answers is sent anywhere. The model files download once from the model host when the reader asks. */
(function(){
'use strict';
var Lg=window.CoachLogic,EX=window.COACH_EXAMS,BASE=document.currentScript.src.replace(/[^\/]*$/,'');
var $=function(id){return document.getElementById(id)};
function T(en,zh){return '<span class="en">'+en+'</span><span class="zh">'+zh+'</span>'}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function say(en,zh){var s=$('status');if(s)s.innerHTML=T(en,zh)}
var S,CH=[],ENG=null,ENGID='',R=null,confirmKey='',persistOK=true;

/* ---------- storage: IndexedDB, with a plain in-memory fallback and a plain warning ---------- */
var DB=null,mem={};
function openDB(){return new Promise(function(res){try{var r=indexedDB.open('tx-coach',1);r.onupgradeneeded=function(){r.result.createObjectStore('kv')};r.onsuccess=function(){res(r.result)};r.onerror=function(){res(null)};r.onblocked=function(){res(null)}}catch(e){res(null)}})}
function kvGet(k){return new Promise(function(res){if(!DB)return res(mem[k]);try{var q=DB.transaction('kv').objectStore('kv').get(k);q.onsuccess=function(){res(q.result)};q.onerror=function(){res(undefined)}}catch(e){res(undefined)}})}
function kvSet(k,v){return new Promise(function(res){if(!DB){mem[k]=v;return res()}try{var tx=DB.transaction('kv','readwrite');tx.objectStore('kv').put(v,k);tx.oncomplete=res;tx.onerror=function(){persistOK=false;mem[k]=v;res()}}catch(e){persistOK=false;mem[k]=v;res()}})}
var st=0;function save(){clearTimeout(st);st=setTimeout(function(){kvSet('state',S)},250)}
function saveChunks(){return kvSet('chunks',CH.map(function(c){return {id:c.id,mat:c.mat,loc:c.loc,text:c.text}}))}
function fresh(){return {v:1,goal:'exam',exam:'pmp',ver:'2026',model:'light',perDay:10,mats:[],stats:{},miss:{},used:{},bank:[],days:{},rounds:0}}

/* ---------- areas ---------- */
function exam(){var e=EX.filter(function(x){return x.id===S.exam})[0]||EX[0];return {e:e,v:e.versions.filter(function(v){return v.id===S.ver})[0]||e.versions[0]}}
function areas(){
 if(S.goal==='exam'){var d=exam().v.domains;return d.map(function(x){return {id:'x:'+x.id,name:x.name,w:x.weight,kw:x.kw,tasks:x.tasks,dom:x.name.en}})}
 return S.mats.map(function(m){return {id:'m:'+m.id,name:{en:esc(m.name),zh:esc(m.name)},w:Math.max(1,m.chars)}})}
function aname(id){var a=areas().filter(function(x){return x.id===id})[0];return a?T(a.name.en,a.name.zh):T('Other','其他')}
function reassign(){
 if(S.goal==='exam')Lg.assignAreas(CH,areas().map(function(a){return {id:a.id,kw:a.kw}}));
 else CH.forEach(function(c){c.area='m:'+c.mat;c.score=1})}
function hist(id){return (S.stats[id]&&S.stats[id].h)||[]}
function planFor(kind,n){return Lg.plan(areas().map(function(a){return {id:a.id,w:a.w,hist:hist(id0(a)),last:S.stats[a.id]&&S.stats[a.id].last}}),n,kind,Date.now())}
function id0(a){return a.id}
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
function setProg(p,txt){var b=$('mprog');if(b){b.hidden=false;b.value=Math.round((p||0)*100)}var l=$('mline');if(l&&txt)l.textContent=txt}
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
function flatten(plan){var out=[];plan.forEach(function(p){for(var i=0;i<p.k;i++)out.push({area:p.id})});
 for(var i=out.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=out[i];out[i]=out[j];out[j]=t}return out}
async function startRound(kind,n){
 if(!CH.length){say('Add material first.','请先添加资料。');return}
 if(R&&R.busy)return;
 R={kind:kind,slots:flatten(planFor(kind,n)),items:[],i:0,gen:0,busy:false,fail:0,view:'wait'};
 $('practice').hidden=false;renderPractice();$('practice').scrollIntoView({block:'start'});
 try{await ensureModel()}catch(e){R=null;renderPractice();return}
 pump();show()}
async function pump(){
 var r=R;if(!r||r.busy)return;r.busy=true;
 while(R===r&&r.gen<r.slots.length&&r.items.length-r.i<2){
  var slot=r.slots[r.gen],item=null;
  for(var tries=0;tries<3&&!item&&R===r;tries++){
   var ch=Lg.pick(CH,slot.area,S.miss,S.used,Math.random);if(!ch)break;
   var a=areas().filter(function(x){return x.id===slot.area})[0]||{},ex=S.goal==='exam';
   try{var raw=await ENG.chat(Lg.prompt({text:ch.text,lang:Lg.lang(ch.text),exam:ex?exam().e.name.en+' (outline: '+exam().v.label.en+')':'',domain:a.dom||'',tasks:a.tasks||''}));
    var q=Lg.parseQuestion(raw);if(q){q=Lg.shuffle(q,Math.random);S.used[ch.id]=(S.used[ch.id]||0)+1;
     var m=S.mats.filter(function(x){return x.id===ch.mat})[0];
     item={id:'q'+Date.now().toString(36)+r.gen,area:slot.area,chunk:ch.id,q:q.q,o:q.o,a:q.a,e:q.e,loc:ch.loc,mat:m?m.name:'',snip:ch.text.slice(0,420),res:null}}}catch(e){}
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
 var m=S.miss[it.chunk]||0;if(ok){if(m>0)S.miss[it.chunk]=m-1}else S.miss[it.chunk]=m+1;
 var k=Lg.dayKey(),d=S.days[k]||(S.days[k]={n:0,c:0});d.n++;d.c+=ok?1:0;
 var keys=Object.keys(S.days).sort();while(keys.length>120)delete S.days[keys.shift()];
 it.res=ok?1:0;save()}
function answer(i){var it=R.items[R.i];if(it.res!=null||it.pick!=null)return;it.pick=i;
 if(R.kind==='exam'){record(it,i===it.a);R.i++;pump();show()}else{record(it,i===it.a);it.counted=true;syncOrig(it);R.view='fb';renderPractice(true);pump();renderBook()}}
function undo(it){var s=S.stats[it.area];if(s){s.h.pop();s.n--;s.c-=it.res?1:0}var m=S.miss[it.chunk]||0;if(it.res)S.miss[it.chunk]=m+1;else S.miss[it.chunk]=Math.max(0,m-1);
 var d=S.days[Lg.dayKey()];if(d){d.n--;d.c-=it.res?1:0}it.counted=false}
/* a right answer you guessed counts as a miss: the strength map should not trust luck */
function guess(){var it=R.items[R.i];if(!it||!it.counted||it.res!==1||it.guess)return;undo(it);record(it,false);it.counted=true;it.guess=1;save();renderPractice(true)}
/* a slip of the finger: take the answer back and choose again */
function redo(){var it=R.items[R.i];if(!it||!it.counted)return;undo(it);it.pick=null;it.res=null;it.guess=0;save();R.view='q';renderPractice(true)}
function flag(){var it=R.items[R.i];if(!it||!it.counted)return;/* take its result back out */
 var s=S.stats[it.area];if(s){s.h.pop();s.n--;s.c-=it.res?1:0}var m=S.miss[it.chunk]||0;if(it.res)S.miss[it.chunk]=m+1;else S.miss[it.chunk]=Math.max(0,m-1);
 var d=S.days[Lg.dayKey()];if(d){d.n--;d.c-=it.res?1:0}it.flag=1;it.counted=false;save();next()}
function next(){R.i++;pump();show();renderAll(true)}

/* ---------- rendering ---------- */
var WHY={new:['Not tested yet','还没测过'],weak:['Weak','薄弱'],due:['Due for review','该复习了'],keep:['Keep warm','保持']};
function renderToday(){
 var el=$('today'),n=S.perDay,td=today();
 if(!CH.length){el.innerHTML='<h2>'+T('Get <em>started</em>','开始<em>吧</em>')+'</h2><ol class="steps"><li>'+T('Add your slides or PDFs below.','在下面添加你的课件或 PDF。')+'</li><li>'+T('Pick a goal: understand the material, or pass an exam.','选目标：弄懂资料，或通过考试。')+'</li><li>'+T('Download the free model once, then practise.','一次性下载免费模型，然后开始练习。')+'</li></ol>';return}
 var plan=planFor('drill',n);
 el.innerHTML='<h2>'+T('Practise <em>today</em>','今天<em>练什么</em>')+'</h2><p class="meta">'+T('Done today: '+td.n+' of '+n+' questions.','今天已做：'+td.n+' / '+n+' 题。')+'</p>'+
  '<ul class="plan">'+plan.map(function(p){var w=WHY[p.why];return '<li><span class="pk">'+p.k+'</span><span>'+aname(p.id)+'</span><span class="chip">'+T(w[0],w[1])+'</span></li>'}).join('')+'</ul>'+
  '<p class="acts"><button class="btn pri" data-act="drill">'+T('Practise now','现在练习')+'</button>'+(S.goal==='exam'?'<button class="btn" data-act="exam">'+T('Mini exam · 20 questions','小测验 · 20 题')+'</button>':'')+
  '<label class="per">'+T('Per day','每天')+' <select data-act="perday" aria-label="Questions per day · 每天题数">'+[5,10,20].map(function(x){return '<option'+(x===n?' selected':'')+'>'+x+'</option>'}).join('')+'</select></label></p>'}
function renderMap(){
 var el=$('map');if(!CH.length){el.innerHTML='';return}
 el.innerHTML='<h2>'+T('Strength <em>map</em>','强弱<em>图</em>')+'</h2><div class="rows">'+areas().map(function(a){var s=Lg.strength(hist(a.id)),p=s==null?0:Math.round(s*100),n=(S.stats[a.id]||{}).n||0;
  return '<div class="row"><div class="rl">'+T(a.name.en,a.name.zh)+(S.goal==='exam'?' <span class="meta">'+a.w+'%</span>':'')+'</div><div class="bar" role="img" aria-label="'+(s==null?'Not tested yet · 还没测过':p+'%')+'"><i class="'+(s!=null&&s<0.6?'weak':'')+'" style="width:'+p+'%"></i></div><div class="rv2">'+(s==null?T('not tested','未测'):p+'%')+'</div><div class="meta rn">'+n+'</div></div>'}).join('')+'</div><p class="meta">'+T('Strength blends your recent answers, newest first. The right-hand number is questions answered.','强度综合你近期的作答，越新权重越大。最右边的数字是已答题数。')+'</p>'}
function renderMats(){
 $('mats').innerHTML=(S.mats.length?'<p class="meta">'+S.mats.length+' '+T('files','个文件')+' · '+CH.length+' '+T('passages','段文字')+'</p><ul class="files'+(S.mats.length>6?' long':'')+'">'+S.mats.map(function(m){return '<li><span class="fn">'+esc(m.name)+'</span><span class="meta">'+m.pages+' '+(m.word==='slide'?T('slides','张幻灯片'):(m.word==='page'?T('pages','页'):T('text','文本')))+' · '+(m.lang==='zh'?'中文':'English')+'</span><button class="btn sm" data-act="rm" data-id="'+m.id+'" aria-label="Remove '+esc(m.name)+' · 移除">'+T('Remove','移除')+'</button></li>'}).join('')+'</ul>':'')+
  '<label class="drop" id="drop"><input type="file" id="files" multiple accept=".pdf,.pptx,.txt,.md"><span>'+T('Choose files or drop them here · PDF, PPTX, text · English or 中文','选择文件或拖到这里 · PDF、PPTX、文本 · 中英文均可')+'</span></label>'}
function renderGoal(){
 var x=exam(),d=x.v.domains;
 $('goal').innerHTML='<div class="seg2" role="radiogroup" aria-label="Goal · 目标"><label><input type="radio" name="goal" value="understand"'+(S.goal==='understand'?' checked':'')+'> '+T('Understand the material','弄懂这份资料')+'</label><label><input type="radio" name="goal" value="exam"'+(S.goal==='exam'?' checked':'')+'> '+T('Pass an exam','通过一场考试')+'</label></div>'+
  (S.goal==='exam'?'<p class="rowf"><label>'+T('Exam','考试')+' <select data-act="exam-id" aria-label="Exam · 考试">'+EX.map(function(e){return '<option value="'+e.id+'"'+(e.id===S.exam?' selected':'')+'>'+e.name.en+'</option>'}).join('')+'</select></label> <label>'+T('Outline','考纲')+' <select data-act="exam-ver" aria-label="Outline version · 考纲版本">'+x.e.versions.map(function(v){return '<option value="'+v.id+'"'+(v.id===S.ver?' selected':'')+'>'+v.label.en+' · '+v.label.zh+'</option>'}).join('')+'</select></label></p>'+
   '<p class="meta">'+d.map(function(a){return T(a.name.en,a.name.zh)+' '+a.weight+'%'}).join(' · ')+'. '+T('Questions follow these shares. Check them against the','题目按这些比例出。请对照')+' <a href="https://www.pmi.org/certifications/project-management-pmp" target="_blank" rel="noopener noreferrer">'+T('official outline','官方考纲')+'</a>.</p>':
   '<p class="meta">'+T('Questions spread across your files and lean toward what you miss.','题目分布在你的各个文件里，并偏向你答错的地方。')+'</p>')}
function renderModel(busy,err){
 var gpu=!!navigator.gpu||!!window.__coachTestEngine,ready=!!ENG&&(window.__coachTestEngine||ENGID);
 var msg=err==='nogpu'?T('This browser or computer cannot run the model (it needs WebGPU). Use desktop Chrome or Edge.','这个浏览器或电脑无法运行模型（需要 WebGPU）。请用电脑版 Chrome 或 Edge。'):
  err==='nomodel'?T('The model list changed. Please report it on GitHub.','模型列表已变化。请到 GitHub 报告。'):err==='fail'?T('The download or start failed. Check your connection and try again.','下载或启动失败。请检查网络后重试。'):'';
 $('model').innerHTML='<div class="seg2" role="radiogroup" aria-label="Model · 模型"><label><input type="radio" name="model" value="light"'+(S.model==='light'?' checked':'')+'> '+T('Light · about 1.2 GB, faster','轻量 · 约 1.2 GB，更快')+'</label><label><input type="radio" name="model" value="better"'+(S.model==='better'?' checked':'')+'> '+T('Better · about 2.5 GB, needs more memory','更好 · 约 2.5 GB，需要更多内存')+'</label></div>'+
  '<p class="acts"><button class="btn'+(ready?'':' pri')+'" data-act="load"'+(busy||!gpu?' disabled':'')+'>'+(ready?T('Model ready','模型已就绪'):busy?T('Starting…','启动中…'):T('Download and start the model','下载并启动模型'))+'</button></p>'+
  '<progress id="mprog" max="100" value="0"'+(busy?'':' hidden')+' aria-label="Model download · 模型下载"></progress><p class="meta" id="mline" aria-live="polite"></p>'+
  (!navigator.gpu&&!window.__coachTestEngine?'<p class="warn">'+T('This browser has no WebGPU. You can still add material and see the plan, but questions need desktop Chrome or Edge.','这个浏览器没有 WebGPU。你仍可添加资料、查看计划，但出题需要电脑版 Chrome 或 Edge。')+'</p>':'')+(msg?'<p class="warn">'+msg+'</p>':'')+
  '<p class="meta">'+T('Open models (Qwen3, Apache 2.0), run by your own browser. The first download is large and is kept by the browser for next time.','开源模型（Qwen3，Apache 2.0），由你自己的浏览器运行。首次下载较大，浏览器会留着供下次使用。')+'</p>'}
function renderBackup(){
 $('backup').innerHTML='<p class="acts"><button class="btn" data-act="export">'+T('Export my records','导出我的记录')+'</button><label class="btn">'+T('Import','导入')+'<input type="file" id="imp" accept=".json,application/json" hidden></label>'+
  '<button class="btn" data-act="reset">'+(confirmKey==='reset'?T('Click again to erase everything','再点一次，清除全部'):T('Erase everything','清除全部'))+'</button></p>'+
  '<p class="meta">'+T('Your records and the text of your files live only in this browser. Export to back them up or move to another device; the file contains your materials’ text, so keep it private.','你的记录和资料文字只保存在这个浏览器里。可导出来备份或换设备；导出的文件含有资料文字，请妥善保管。')+(persistOK?'':' <b>'+T('This browser blocks saving: export before you leave.','这个浏览器禁止保存：离开前请先导出。')+'</b>')+'</p>'}
function renderPractice(focus){
 var el=$('practice');if(!R){el.hidden=true;el.innerHTML='';return}
 el.hidden=false;var h='',it=R.items[R.i],total=R.slots.length;
 if(R.view==='wait'){h='<p class="meta" aria-live="polite">'+T('Writing question '+(Math.min(R.items.length,total-1)+1)+' of '+total+'… the first one takes a little while.','正在出第 '+(Math.min(R.items.length,total-1)+1)+' / '+total+' 题…第一题要稍等。')+'</p>'}
 else if(R.view==='end'){
  var got=R.items.filter(function(x){return x.res===1}).length,by={};R.items.forEach(function(x){var b=by[x.area]||(by[x.area]={n:0,c:0});if(x.res!=null){b.n++;b.c+=x.res}});
  h='<h2>'+T('Round <em>done</em>','本轮<em>完成</em>')+'</h2><p class="lead2">'+T(got+' of '+R.items.length+' right','答对 '+got+' / '+R.items.length)+(R.fail?' <span class="meta">'+T('('+R.fail+' could not be written)','（有 '+R.fail+' 题没能生成）')+'</span>':'')+'</p><ul class="plan">'+Object.keys(by).map(function(k){return '<li><span class="pk">'+by[k].c+'/'+by[k].n+'</span><span>'+aname(k)+'</span></li>'}).join('')+'</ul>';
  if(R.kind==='exam'){var wr=R.items.filter(function(x){return x.res===0});if(wr.length)h+='<h3>'+T('Review','回顾')+'</h3>'+wr.map(function(x){return '<div class="rev"><p class="qt">'+esc(x.q)+'</p><p><b>'+T('Answer','答案')+':</b> '+esc(x.o[x.a])+'</p><p class="meta">'+esc(x.e)+'</p></div>'}).join('')}
  h+='<p class="acts"><button class="btn pri" data-act="drill">'+T('Another round','再来一轮')+'</button><button class="btn" data-act="close">'+T('Done','完成')+'</button></p>'}
 else if(it){
  var fb=R.view==='fb';
  h='<p class="meta">'+T('Question '+(R.i+1)+' of '+total,'第 '+(R.i+1)+' / '+total+' 题')+' · '+aname(it.area)+'</p><h3 class="qt" id="qt" tabindex="-1">'+esc(it.q)+'</h3><div class="opts" role="group" aria-labelledby="qt">'+
   it.o.map(function(o,i){var c=fb?(i===it.a?' ok':(i===it.pick?' no':'')):'';return '<button class="opt'+c+'" data-act="opt" data-i="'+i+'"'+(fb?' disabled':'')+'><b>'+'ABCD'[i]+'</b><span>'+esc(o)+'</span></button>'}).join('')+'</div>';
  if(fb)h+='<div class="fb" aria-live="polite"><p><b>'+(it.pick===it.a?T('Right.','答对了。'):T('Not quite.','不对。'))+'</b> '+esc(it.e)+'</p><details><summary>'+T('From your material','来自你的资料')+': '+esc(it.mat)+', '+esc(it.loc)+'</summary><p class="snip">'+esc(it.snip)+'…</p></details><p class="acts"><button class="btn pri" id="nx" data-act="next">'+(R.i+1>=R.items.length&&R.gen>=total?T('See the result','看结果'):T('Next','下一题'))+'</button>'+(it.pick===it.a&&!it.guess?'<button class="btn sm" data-act="guess">'+T('I guessed','我是蒙的')+'</button>':'')+'<button class="btn sm" data-act="redo">'+T('Change my answer','改我的答案')+'</button><button class="btn sm" data-act="flag">'+T('This question looks wrong: don’t count it','这道题有问题：不计入')+'</button></p></div>'}
 el.innerHTML=h;
 if(focus){var f=R.view==='fb'?$('nx'):(R.view==='q'?$('qt'):null);if(f)f.focus()}}
function renderAll(keepPractice){renderToday();renderMap();renderMats();renderGoal();renderBackup();renderShare();renderBook();if(!keepPractice)renderPractice()}



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
 var items=b.slice().sort(function(){return Math.random()-.5}).map(function(x,i){var q=Lg.shuffle({q:x.q,o:x.o,a:x.a,e:x.e},Math.random);return {id:'r'+Date.now().toString(36)+i,area:x.area,chunk:x.chunk,q:q.q,o:q.o,a:q.a,e:q.e,loc:x.loc,mat:x.mat,snip:x.snip,res:null,orig:x}});
 R={kind:'redo',slots:items.map(function(x){return {area:x.area}}),items:items,i:0,gen:items.length,busy:false,fail:0,view:'q'};
 $('practice').hidden=false;renderPractice();$('practice').scrollIntoView({block:'start'})}
function printBook(){
 var b=book(),el=$('printarea');if(!el||!b.length)return;
 el.innerHTML='<h1>'+T('My wrong-question book','我的错题本')+'</h1>'+b.map(function(x,i){return '<div class="pq"><p><b>'+(i+1)+'.</b> '+esc(x.q)+'</p><ol type="A">'+x.o.map(function(o){return '<li>'+esc(o)+'</li>'}).join('')+'</ol><p><b>'+T('Answer','答案')+':</b> '+'ABCD'.charAt(x.a)+'. '+esc(x.o[x.a])+'</p><p>'+esc(x.e)+'</p></div>'}).join('');
 document.body.classList.add('printing');window.print();setTimeout(function(){document.body.classList.remove('printing')},500)}

/* ---------- share notes (opens GitHub's own new-file page; nothing is sent from here) ---------- */
var REPO='zhengtongxin/tx-learns',MAXV=6000;
function shareBody(){
 var x=exam(),weak=areas().map(function(a){var v=Lg.strength(hist(a.id));return {n:a.name.en,p:v==null?null:Math.round(v*100)}}).filter(function(a){return a.p!=null}).sort(function(a,b){return a.p-b.p});
 var topic=(S.noteTopic||'').trim()||x.e.name.en;
 var t='# '+topic+'\n\nExam outline: '+x.e.name.en+' ('+x.v.label.en+')\nSuggested track: '+(S.noteTrack||'new').trim()+'\n\n## Where I was weak\n'+(weak.length?weak.slice(0,4).map(function(a){return '- '+a.n+': '+a.p+'% right in my practice'}).join('\n'):'- (no practice yet)')+'\n\n## What I learned, in my own words\n'+(S.notes||'').trim()+'\n';
 return {topic:topic,text:t}}
function shareUrl(){
 var b=shareBody(),slug=b.topic.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'notes',
  folder=slug+'-'+Lg.dayKey().replace(/-/g,'')+'-'+Math.random().toString(36).slice(2,6);
 return {url:'https://github.com/'+REPO+'/new/notes?filename='+encodeURIComponent('inbox/'+folder+'/notes.md')+'&value='+encodeURIComponent(b.text)+'&message='+encodeURIComponent('Add study notes: '+b.topic),len:b.text.length}}
function renderShare(){
 var el=$('share');if(!el)return;var n=(S.notes||''),ok=!!S.shareOk&&n.trim().length>=40,u=shareUrl();
 el.innerHTML='<p>'+T('Turn what you learned into a pull request, so it can join the knowledge base. Write the key points in your own words. Weak areas are added by name only; your files are never sent.','把你学到的变成一个 pull request，让它有机会加入知识库。用你自己的话写要点。薄弱领域只带名称，你的文件不会被发送。')+'</p>'+
 '<p class="rowf"><label>'+T('Topic','主题')+' <input type="text" id="ntopic" maxlength="60" value="'+esc(S.noteTopic||'')+'" placeholder="'+esc(exam().e.name.en)+'"></label></p>'+
 '<textarea id="nbody" rows="7" maxlength="4000" aria-label="Your notes · 你的笔记" placeholder="Key points, in your own words · 用你自己的话写要点">'+esc(n)+'</textarea>'+
 '<label class="chk"><input type="checkbox" id="nok"'+(S.shareOk?' checked':'')+'> <span>'+T('These are my own words. They contain no pasted slides or text, and no names of the material’s provider or platform. I understand they become public.','这是我自己的话，没有粘贴课件或原文，也没有资料提供方或平台的名字。我明白提交后内容会公开。')+'</span></label>'+
 '<p class="acts"><button class="btn pri" data-act="share"'+(ok?'':' disabled')+'>'+T('Open on GitHub to submit','在 GitHub 上提交')+'</button></p>'+
 '<p class="meta">'+T('This opens GitHub with your notes filled in; you need a GitHub account. GitHub makes a copy for you and opens the pull request. Nothing is merged until the site owner reviews it.','这会打开 GitHub 并填好你的笔记；你需要一个 GitHub 账号。GitHub 会为你建一份副本并发起 pull request。站点负责人审核之前不会合并。')+(u.len>MAXV?' <b>'+T('Too long for one link: shorten it.','太长，一个链接装不下：请缩短。')+'</b>':'')+'</p>'}
function doShare(){var u=shareUrl();if(!S.shareOk||(S.notes||'').trim().length<40||u.len>MAXV)return;window.open(u.url,'_blank','noopener,noreferrer')}

/* ---------- backup ---------- */
function exportAll(){
 var blob=new Blob([JSON.stringify({app:'tx-learns-coach',v:1,state:S,chunks:CH.map(function(c){return {id:c.id,mat:c.mat,loc:c.loc,text:c.text}})})],{type:'application/json'}),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download='study-coach-'+Lg.dayKey()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},2000)}
async function importAll(file){
 try{var d=JSON.parse(await file.text());if(d.app!=='tx-learns-coach'||!d.state||!Array.isArray(d.chunks))throw 0;
  var f=fresh();S=Object.assign(f,d.state);['mats','bank'].forEach(function(k){if(!Array.isArray(S[k]))S[k]=[]});['stats','miss','used','days'].forEach(function(k){if(!S[k]||typeof S[k]!=='object')S[k]={}});
  CH=d.chunks.filter(function(c){return c&&typeof c.text==='string'&&c.id&&c.mat}).slice(0,6000);R=null;reassign();await saveChunks();await kvSet('state',S);renderAll();say('Records imported.','记录已导入。')}
 catch(e){say('That file is not a study coach backup.','这个文件不是学习教练的备份。')}}

/* ---------- events ---------- */
document.addEventListener('click',function(e){
 var b=e.target.closest&&e.target.closest('[data-act]');if(!b||b.tagName==='SELECT')return;var a=b.dataset.act;
 if(a!=='reset'&&confirmKey){confirmKey='';renderBackup()}
 if(a==='drill'){if(R&&R.busy&&R.view!=='end')return;startRound('drill',S.perDay)}
 else if(a==='exam')startRound('exam',20);
 else if(a==='opt')answer(+b.dataset.i);
 else if(a==='next')next();
 else if(a==='flag')flag();
 else if(a==='guess'){guess();syncOrig(R.items[R.i])}
 else if(a==='redoset')startRedo();
 else if(a==='print')printBook();
 else if(a==='redo'){redo();syncOrig(R.items[R.i])}
 else if(a==='close'){R=null;renderAll()}
 else if(a==='rm'){dropMat(b.dataset.id);reassign();saveChunks();save();renderAll()}
 else if(a==='load')ensureModel().catch(function(){});
 else if(a==='export')exportAll();
 else if(a==='share')doShare();
 else if(a==='reset'){if(confirmKey==='reset'){S=fresh();CH=[];R=null;confirmKey='';kvSet('state',S);saveChunks();renderAll();say('Everything erased.','已全部清除。')}else{confirmKey='reset';renderBackup()}}});
document.addEventListener('change',function(e){var x=e.target;
 if(x.id==='files'){addFiles(x.files);x.value=''}
 else if(x.id==='nok'){S.shareOk=x.checked;save();renderShare()}
 else if(x.id==='imp'){if(x.files[0])importAll(x.files[0]);x.value=''}
 else if(x.name==='goal'){S.goal=x.value;reassign();save();renderAll()}
 else if(x.name==='model'){S.model=x.value;save();if(ENGID&&!window.__coachTestEngine){ENG=null;ENGID=''}renderModel()}
 else if(x.dataset&&x.dataset.act==='perday'){S.perDay=+x.value;save();renderToday()}
 else if(x.dataset&&x.dataset.act==='exam-id'){S.exam=x.value;S.ver=exam().e.versions[0].id;reassign();save();renderAll()}
 else if(x.dataset&&x.dataset.act==='exam-ver'){S.ver=x.value;reassign();save();renderAll()}});
document.addEventListener('input',function(e){var x=e.target;if(x.id==='nbody'||x.id==='ntopic'){if(x.id==='nbody')S.notes=x.value;else S.noteTopic=x.value;save();var b=document.querySelector('[data-act=share]');if(b){var okk=!!S.shareOk&&(S.notes||'').trim().length>=40&&shareUrl().len<=MAXV;b.disabled=!okk}}});
document.addEventListener('dragover',function(e){if(e.target.closest&&e.target.closest('#drop'))e.preventDefault()});
document.addEventListener('drop',function(e){if(e.target.closest&&e.target.closest('#drop')){e.preventDefault();addFiles(e.dataTransfer.files)}});

/* ---------- start ---------- */
(async function(){
 DB=await openDB();if(!DB)persistOK=false;
 var s=await kvGet('state'),c=await kvGet('chunks');
 S=Object.assign(fresh(),s||{});CH=Array.isArray(c)?c:[];
 if(!EX.some(function(x){return x.id===S.exam}))S.exam=EX[0].id;
 reassign();renderAll();renderModel();$('app').hidden=false;window.__coach={state:function(){return S},chunks:function(){return CH}};
 if(navigator.storage&&navigator.storage.persist)try{navigator.storage.persist()}catch(e){}
})();
})();
