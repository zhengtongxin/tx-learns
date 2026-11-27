(function(){
  var KEY='learn-lang',DONE='learn-done',TH='learn-theme',root=document.documentElement;
  function get(k,d){try{return localStorage.getItem(k)||d}catch(e){return d}}
  function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function t(o){return '<span class="en">'+o.en+'</span><span class="zh">'+o.zh+'</span>'}
  function done(){try{return JSON.parse(get(DONE,'{}'))}catch(e){return {}}}
  var LAST='learn-last';
  function jget(k,d){try{var v=JSON.parse(get(k,''));return v==null?d:v}catch(e){return d}}
  var L0=get(KEY,(navigator.language||'').toLowerCase().indexOf('zh')===0?'zh':'en');if(L0!=='zh')L0='en';
  /* The page language follows EN/中文, so screen readers and search engines read it right. */
  function setLang(l){root.setAttribute('data-lang',l);root.lang=l==='zh'?'zh-Hans':'en'}setLang(L0);
  var calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.setAttribute('data-theme',get(TH,'dark'));
  /* Fonts: the reader's own system fonts (CSS --sans), so nothing loads from a font host and Chinese uses a native font. */

  function burst(x,y){if(calm)return;var e=['✨','⭐','💠','🎉','💫'];for(var i=0;i<14;i++){var s=document.createElement('span');s.className='pc';s.textContent=e[i%e.length];
    s.style.left=x+'px';s.style.top=y+'px';s.style.setProperty('--dx',(Math.random()*260-130)+'px');s.style.setProperty('--dy',(Math.random()*-220-20)+'px');s.style.setProperty('--r',(Math.random()*360)+'deg');
    document.body.appendChild(s);setTimeout(function(a){a.remove()},1000,s)}}
  window.TX={t:t,burst:burst};
  var TYPE={f:{en:'Foundations',zh:'基础'},c:{en:'Concept',zh:'概念'},p:{en:'Project',zh:'项目'}};

  /* Reader signals: the site keeps exactly two, both anonymous (a lesson's path and yes/no/done, nothing about the reader):
     the answer to "Was this lesson clear?" and that a lesson was read to its end. They go to this site's own /api/feedback
     (api/feedback.js). Nothing is sent from a local copy or from an automated browser, so the agents' checks never count.
     window.txq keeps what this page raised, for scripts/test-site.mjs. */
  function track(n,d){try{(window.txq=window.txq||[]).push({name:n,data:d});
    if(!/^https?:$/.test(location.protocol)||/^(localhost|127\.)/.test(location.hostname)||navigator.webdriver)return;
    var b=JSON.stringify({event:n==='Lesson done'?'done':'feedback',lesson:d.lesson,answer:d.answer});
    if(!(navigator.sendBeacon&&navigator.sendBeacon('/api/feedback',b)))fetch('/api/feedback',{method:'POST',body:b,keepalive:true})}catch(e){}}
  document.addEventListener('DOMContentLoaded',function(){
    var C=window.TRACK,here=location.pathname.split('/').pop()||'index.html',d=done(),AREA=root.getAttribute('data-area')||'',P=(C||AREA==='study')?'../':'';
    if(C){C.all=[];C.topics.forEach(function(w){w.items.forEach(function(it,i){it.w=w.n;it.i=i+1;it.g=C.all.length+1;C.all.push(it)})});C.lessons=C.all.filter(function(x){return x.file});C.total=C.all.length}
    function countUp(el){var to=+el.dataset.count,s=performance.now();if(calm){el.textContent=to;return}(function tick(n){var k=Math.min(1,(n-s)/1200);el.textContent=Math.round(to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(tick)})(s)}
    /* Progress counts only keys that still match a published lesson (files = that track's lesson files), so old or renamed lessons never inflate it. */
    function count(c,files){var n=0;for(var k in d)if(k.indexOf(c+'/')===0&&d[k]&&(!files||files.indexOf(k.slice(c.length+1))>-1))n++;return n}
    var CF=C?C.lessons.map(function(x){return x.file}):[];
    /* The lesson to open next: the one you were on if unfinished, else the first unfinished one after it, else the first unfinished one. */
    function nextOf(id,files,from){var last=jget(LAST,null),i,s0=-1;
      if(last&&last.t===id&&files.indexOf(last.f)>-1){if(!d[id+'/'+last.f])return last.f;s0=files.indexOf(last.f)}
      else if(from)s0=files.indexOf(from);
      for(i=s0+1;i<files.length;i++)if(!d[id+'/'+files[i]])return files[i];
      for(i=0;i<files.length;i++)if(!d[id+'/'+files[i]])return files[i];return null}

    var bar=document.createElement('div');bar.className='prog';bar.setAttribute('aria-hidden','true');document.body.prepend(bar);
    /* Skip link: the first Tab stop, so keyboard users can jump past the top bar, the menu and the dock. */
    var mn=document.querySelector('main');
    if(mn){if(!mn.id)mn.id='main';mn.setAttribute('tabindex','-1');var sk=document.createElement('a');sk.className='skip';sk.href='#'+mn.id;sk.innerHTML=t({en:'Skip to content',zh:'跳到正文'});sk.onclick=function(){setTimeout(function(){mn.focus()},0)};document.body.prepend(sk)}
    var top=document.createElement('div');top.className='top';
    function lk(h,tt,ic,en,zh){return '<a class="icon-btn eco-btn" href="'+h+'" title="'+tt+'" aria-label="'+tt+'">'+ic+'<span class="lbl"> <span class="en">'+en+'</span><span class="zh">'+zh+'</span></span></a>'}
    /* Three parts: the landing page (two choices, no menu), the study coach (its own About and How it works), and the tracks (About, How it works, Glossary). */
    var nav=AREA==='landing'?'':AREA==='study'?'<a class="icon-btn menu-btn" href="'+P+'study/index.html" aria-label="Study coach · 学习教练">🎯 <span class="en">Study coach</span><span class="zh">学习教练</span></a><span class="sp"></span>'+lk(P+'study/about.html','About the coach · 关于学习教练','','About this site','关于本站')+lk(P+'study/how.html','How it works · 运作方式','🌐','How it works','运作方式'):
      '<button class="icon-btn menu-btn" aria-label="Topics · 主题" aria-expanded="false" aria-controls="topics-nav">☰ <span class="en">Topics</span><span class="zh">主题</span></button><span class="sp"></span>'+lk(P+'about.html','About this site · 关于本站','','About this site','关于本站')+lk(P+'ecosystem.html','How it works · 运作方式','🌐','How it works','运作方式')+lk(P+'glossary.html','Glossary · 词汇表','📖','Glossary','词汇表');
    if(AREA==='landing')nav='<span class="sp"></span>';
    top.innerHTML='<a class="brand" href="'+P+'index.html"><b></b>TX Learns</a>'+nav+
      '<div class="seg" role="group" aria-label="Language · 语言"><button data-l="en" lang="en">EN</button><button data-l="zh" lang="zh-Hans">中文</button></div><button class="icon-btn th" aria-label="theme"></button>';
    document.body.insertBefore(top,bar.nextSibling);
    function mark(){top.querySelectorAll('[data-l]').forEach(function(b){var on=b.dataset.l===root.getAttribute('data-lang');b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});var dk=root.getAttribute('data-theme')==='dark',th=top.querySelector('.th');th.textContent=dk?'☀︎':'☾';th.setAttribute('aria-label',dk?'Switch to light theme · 切换到浅色':'Switch to dark theme · 切换到深色')}
    top.querySelectorAll('[data-l]').forEach(function(b){b.onclick=function(){setLang(b.dataset.l);set(KEY,b.dataset.l);mark()}});
    top.querySelector('.th').onclick=function(){var n=root.getAttribute('data-theme')==='dark'?'light':'dark';root.setAttribute('data-theme',n);set(TH,n);mark()};
    mark();

    /* Topics menu helpers. byDomain: the tracks grouped by subject, in DOMAINS order (subjects without a track are left out). group: one collapsible box. wire: open/close, remembered in st. */
    function byDomain(ts){var D=window.DOMAINS&&window.DOMAINS.length?window.DOMAINS:[{id:'ai',icon:'',title:{en:'AI',zh:'AI'}}];
      return D.map(function(dm){var x=ts.filter(function(c){return (c.domain||'ai')===dm.id});return {id:dm.id,icon:dm.icon,title:dm.title,ts:x,one:x.length===1}}).filter(function(g){return g.ts.length})}
    function group(g,open,body){return '<div class="cg dg'+(open?' open':'')+'" data-c="d:'+g.id+'"><button class="cg-h" aria-expanded="'+!!open+'" aria-controls="cgb-d-'+g.id+'"><span class="ic">'+(g.icon||'')+'</span><span class="tt">'+t(g.title)+'</span><i class="chev"></i></button><div class="cg-b" id="cgb-d-'+g.id+'"'+(open?'':' inert')+'><div>'+body+'</div></div></div>'}
    function wire(box,st,onOpen,save){box.querySelectorAll('button.cg-h').forEach(function(h){h.onclick=function(){var g=h.parentNode,o=!g.classList.contains('open');if(o&&onOpen)onOpen(g.dataset.c);g.classList.toggle('open',o);h.setAttribute('aria-expanded',o);g.querySelector('.cg-b').inert=!o;st[g.dataset.c]=o;if(save)save()}})}
    var side=document.querySelector('.side'),scrim;if(side){side.id='topics-nav';side.setAttribute('aria-label','Topics · 主题');side.inert=true}
    if(!C&&!side&&!AREA){
      /* Pages outside a track (home, How it works, Glossary, About): Topics opens a drawer with the track list. */
      side=document.createElement('div');side.className='side';side.id='topics-nav';side.setAttribute('aria-label','Topics · 主题');side.inert=true;
      var tl=(window.TRACKS||[]);
      side.innerHTML='<div class="side-top"><a class="side-all" href="tracks.html">⌂ '+t({en:'All tracks',zh:'所有路线'})+'</a><button type="button" class="side-close" aria-label="Close topics menu · 关闭主题菜单">✕</button></div>'+byDomain(tl).map(function(g){
        /* subjects at the top level (AI, project management): one with several tracks opens to show them, one with a single track is that track's link */
        if(g.one)return '<div class="cg"><a class="cg-h" href="'+g.ts[0].href+'"><span class="ic">'+(g.ts[0].icon||'')+'</span><span class="tt">'+t(g.ts[0].title)+'</span></a></div>';
        return group(g,false,g.ts.map(function(c){return '<a href="'+c.href+'">'+(c.icon?c.icon+' ':'')+t(c.title)+'</a>'}).join(''))}).join('');
      wire(side,{});
      scrim=document.createElement('div');scrim.className='scrim';scrim.setAttribute('aria-hidden','true');document.body.appendChild(scrim);document.body.appendChild(side);
      var mb0=top.querySelector('.menu-btn'),tg0=function(o){side.inert=!o;side.classList.toggle('open',o);scrim.classList.toggle('on',o);mb0.setAttribute('aria-expanded',o);if(o)side.querySelector('.side-close').focus();else mb0.focus()};
      mb0.onclick=function(){tg0(!side.classList.contains('open'))};scrim.onclick=function(){tg0(false)};side.querySelector('.side-close').onclick=function(){tg0(false)};
      document.addEventListener('keydown',function(e){if(side.classList.contains('open')&&e.key==='Escape')tg0(false)});
    }
    if(C&&side){
      var NK='learn-nav',ns={};try{ns=JSON.parse(localStorage.getItem(NK)||'{}')}catch(e){}
      var list=(window.TRACKS&&window.TRACKS.length)?window.TRACKS:[{id:C.id,icon:'',title:C.title,href:'agentic-ai/index.html'}];
      side.innerHTML='<div class="side-top"><a class="side-all" href="../tracks.html">← '+t({en:'All tracks',zh:'所有路线'})+'</a><button type="button" class="side-close" aria-label="Close topics menu · 关闭主题菜单">✕</button></div>'+byDomain(list).map(function(g){
        /* subjects at the top level: a subject with several tracks is one group that opens to its tracks (open when it holds this track), a subject with one track is that track */
        var h=g.ts.map(trackBox).join(''),has=g.ts.some(function(c){return c.id===C.id});
        return g.one?h:group(g,ns['d:'+g.id]!==undefined?ns['d:'+g.id]:has,h)}).join('');
      function trackBox(c){
        var cur=c.id===C.id,open=ns[c.id]!==undefined?ns[c.id]:cur,body;
        if(cur)body='<a href="index.html" class="'+(here==='index.html'?'cur':'')+'">⌂ '+t({en:'Overview',zh:'总览'})+'</a>'+
          C.topics.map(function(w){return '<h5>'+t(w.title)+'</h5>'+w.items.map(function(l){
            return l.file?'<a href="'+l.file+'" class="'+(l.file===here?'cur ':'')+(d[C.id+'/'+l.file]?'done':'')+'"'+(l.file===here?' aria-current="page"':'')+'>'+t(l.title)+'</a>':'<span class="soon">'+t(l.title)+'</span>'}).join('')}).join('');
        else body='<a href="../'+c.href+'">⌂ '+t({en:'Overview',zh:'总览'})+'</a><div class="oth" data-o="'+c.id+'"></div>';
        return '<div class="cg'+(open?' open':'')+(cur?' cur':'')+'" data-c="'+c.id+'"><button class="cg-h" aria-expanded="'+open+'" aria-controls="cgb-'+c.id+'"><span class="ic">'+(c.icon||'')+'</span><span class="tt">'+t(c.title)+'</span>'+(cur?'<span class="pg">'+count(c.id,CF)+'/'+CF.length+'</span>':'')+'<i class="chev"></i></button><div class="cg-b" id="cgb-'+c.id+'"'+(open?'':' inert')+'><div>'+body+'</div></div></div>'}
      /* Other tracks: read their lessons.js (in a throwaway window object) to list their lessons and show done/total. Without it (e.g. opened from disk) only the Overview link shows. */
      var loaded={};
      function loadOther(c){if(c.id===C.id||loaded[c.id])return;loaded[c.id]=1;
        fetch('../'+c.id+'/lessons.js').then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(src){
          var w={};new Function('window',src)(w);var T=w.TRACK;if(!T||!T.topics)return;
          var files=[],h='';T.topics.forEach(function(tp){var part='';tp.items.forEach(function(l){if(l.file){files.push(l.file);part+='<a href="../'+c.id+'/'+l.file+'"'+(d[c.id+'/'+l.file]?' class="done"':'')+'>'+t(l.title)+'</a>'}else part+='<span class="soon">'+t(l.title)+'</span>'});h+='<h5>'+t(tp.title)+'</h5>'+part});
          var box=side.querySelector('.oth[data-o="'+c.id+'"]'),hd=side.querySelector('.cg[data-c="'+c.id+'"] .cg-h');
          if(box)box.innerHTML=h;
          if(hd&&files.length&&!hd.querySelector('.pg')){var sp=document.createElement('span');sp.className='pg';sp.textContent=count(c.id,files)+'/'+files.length;hd.insertBefore(sp,hd.querySelector('.chev'))}
        }).catch(function(){loaded[c.id]=0})}
      /* Lazy: a track's lesson list is fetched only when its section is open (or when it is opened), not for every track on every page. */
      list.forEach(function(c){if(ns[c.id]===true)loadOther(c)});
      wire(side,ns,function(id){list.forEach(function(c){if(c.id===id)loadOther(c)})},function(){try{localStorage.setItem(NK,JSON.stringify(ns))}catch(e){}});
      scrim=document.createElement('div');scrim.className='scrim';scrim.setAttribute('aria-hidden','true');document.body.appendChild(scrim);
      document.body.appendChild(side);
      var opener=null;
      var tg=function(on){var o=on===undefined?!side.classList.contains('open'):on,mb=top.querySelector('.menu-btn');
        if(o)opener=document.activeElement;
        var inside=side.contains(document.activeElement);
        side.inert=!o;side.classList.toggle('open',o);scrim.classList.toggle('on',o);mb.setAttribute('aria-expanded',o);
        if(o){var fa=side.querySelector('.side-close');if(fa)fa.focus()}
        else if(inside){var back=opener&&document.contains(opener)&&!opener.closest('.side')?opener:mb;back.focus()}};
      top.querySelector('.menu-btn').onclick=function(){tg()};scrim.onclick=function(){tg(false)};side.querySelector('.side-close').onclick=function(){tg(false)};
      /* Escape closes the drawer; Tab stays inside it while it is open. */
      document.addEventListener('keydown',function(e){if(!side.classList.contains('open'))return;
        if(e.key==='Escape'){tg(false);return}
        if(e.key==='Tab'){var f=[].filter.call(side.querySelectorAll('a[href],button'),function(x){return !x.closest('[inert]')});if(!f.length)return;var a=f[0],z=f[f.length-1];
          if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
      window.TX.menu=tg;
    }

    /* stage progress ring */
    var rb=document.querySelector('.ringbox');
    if(C&&rb){var n=count(C.id,CF),pub=CF.length,R=36,L=2*Math.PI*R,p=pub?n/pub:0;
      rb.innerHTML='<div class="bigring"><svg width="84" height="84" viewBox="0 0 84 84"><defs><linearGradient id="rg"><stop offset="0" stop-color="#ffb703"/><stop offset="1" stop-color="#ffe066"/></linearGradient></defs><circle class="bg" cx="42" cy="42" r="'+R+'"/><circle class="fg" cx="42" cy="42" r="'+R+'" stroke-dasharray="'+L+'" stroke-dashoffset="'+L+'"/></svg><b>'+Math.round(p*100)+'%</b></div><div style="text-align:left"><div style="font-weight:700">'+t({en:n+' of '+pub+' published lessons completed',zh:'已完成 '+n+' / '+pub+' 课（已发布）'})+'</div></div>';
      var br=rb.querySelector('.bigring');br.setAttribute('role','progressbar');br.setAttribute('aria-valuemin','0');br.setAttribute('aria-valuemax',pub);br.setAttribute('aria-valuenow',n);br.setAttribute('aria-valuetext',n+' of '+pub+' published lessons completed · 已完成 '+n+' / '+pub+' 课');br.setAttribute('aria-label','Track progress · 路线进度');
      setTimeout(function(){rb.querySelector('.fg').style.strokeDashoffset=L*(1-p)},200)}
    var sb=document.querySelector('.startbtn');
    var NX=C&&CF.length?nextOf(C.id,CF):null,started=C&&(count(C.id,CF)>0||(jget(LAST,{}).t===C.id));
    if(C&&sb&&CF.length){sb.href=NX||CF[0];sb.innerHTML=!NX?t({en:'All done: review from the start →',zh:'全部完成：从头复习 →'}):started?t({en:'Continue where you left off →',zh:'继续上次的进度 →'}):t({en:'Start learning →',zh:'开始学习 →'})}

    /* lesson: "Updated" date from <meta name="updated"> (set by node scripts/check-pages.mjs --fix, never typed) */
    var um=document.querySelector('meta[name="updated"]'),hm=document.querySelector('main .meta');
    if(um&&hm&&/^\d{4}-\d\d-\d\d$/.test(um.content)){var ud=um.content.split('-'),MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var us=document.createElement('span');us.className='updated';us.innerHTML=t({en:'Updated '+(+ud[2])+' '+MO[ud[1]-1]+' '+ud[0],zh:'更新于 '+ud[0]+' 年 '+(+ud[1])+' 月 '+(+ud[2])+' 日'});hm.appendChild(us)}

    var LV={1:{en:'Beginner',zh:'入门'},2:{en:'Intermediate',zh:'进阶'},3:{en:'Advanced',zh:'高级'}};
    /* journey: topic tabs + lesson cards */
    var jr=document.querySelector('.journey');
    if(C&&jr){
      var cur=0,tf=NX||CF[0];for(var wi=0;wi<C.topics.length;wi++){if(C.topics[wi].items.some(function(x){return x.file&&x.file===tf})){cur=wi;break}}
      var draw=function(){
        jr.innerHTML=C.topics.map(function(w){var rd=w.items.filter(function(x){return x.file}).length;
          return '<section class="wsec"><div class="wph"><div><div class="ey">'+t({en:'Topic '+w.n,zh:'主题 '+w.n})+(w.level?' · '+t(LV[w.level]):'')+'</div><h3>'+t(w.title)+'</h3></div>'+(rd<w.items.length?'<div class="meta">'+t({en:rd+' of '+w.items.length+' lessons available',zh:'已发布 '+rd+' / '+w.items.length+' 课'})+'</div>':'')+'</div>'+
          '<div class="lgrid">'+w.items.map(function(l){
            var no=('0'+l.g).slice(-2),chip='<span class="chip '+l.k+'">'+t(TYPE[l.k])+'</span>';
            if(l.file){var fin=d[C.id+'/'+l.file];return '<a class="lcard ready spot" href="'+l.file+'"><span class="n">'+no+'</span>'+chip+'<h4>'+t(l.title)+'</h4><span class="st">'+(fin?t({en:'✓ Completed',zh:'✓ 已完成'}):t({en:'Start →',zh:'开始 →'}))+'</span></a>'}
            return '<div class="lcard soon"><span class="n">'+no+'</span>'+chip+'<h4>'+t(l.title)+'</h4><span class="st">'+t({en:'Coming soon',zh:'即将发布'})+'</span></div>'}).join('')+'</div></section>'}).join('');
      };
      draw();
      if(CF.length&&started)whatNext(false,function(a){jr.after(a)},NX&&C.lessons.filter(function(x){return x.file===NX})[0],!NX);
    }

    /* prerequisites + project card + track before/after: each lesson carries its own data as <script type="application/json" id="lesson-data"> (scripts/check-pages.mjs --fix writes it from the track's prereqs.js / projects.js and packages folder); the track before/after comes from tracks.js */
    function li(a){return (a||[]).map(function(x){return '<li>'+t(x)+'</li>'}).join('')}
    function renderMeta(){
      var LD={};try{LD=JSON.parse((document.getElementById('lesson-data')||{}).textContent||'{}')}catch(e){}
      var P=LD.p,J=LD.j,hm2=document.querySelector('main .meta'),anchor=hm2&&(hm2.closest('.hero')||hm2);
      /* optional P.changed={en,zh}: what changed last, shown after "Updated" */
      if(P&&P.changed&&P.changed.en&&hm2&&!hm2.querySelector('.changed')){var cs=document.createElement('span');cs.className='changed';cs.innerHTML=t({en:'Last changed: '+P.changed.en,zh:'最近改动：'+(P.changed.zh||P.changed.en)});hm2.appendChild(cs)}
      /* learning goals: optional P.goals={en:[],zh:[]}; skipped when the lesson body already has its own objectives block */
      if(P&&P.goals&&P.goals.en&&P.goals.en.length&&hm2&&!document.querySelector('main .objectives,main .goals')&&!Array.prototype.some.call(document.querySelectorAll('main h2,main h3,main .lbl'),function(h){return /learning objectives|学习目标/i.test(h.textContent)})){
        var gb=document.createElement('aside');gb.className='card goals';gb.setAttribute('aria-label','You will be able to · 学完你能');
        gb.innerHTML='<b class="lbl">'+t({en:'You will be able to',zh:'学完你能'})+'</b><ul>'+P.goals.en.map(function(e,i){return '<li>'+t({en:e,zh:P.goals.zh[i]||e})+'</li>'}).join('')+'</ul>';
        anchor.after(gb);anchor=gb}
      if(J&&hm2){var pc=document.createElement('aside');pc.className='card prereq proj';pc.setAttribute('aria-label','Project card · 项目卡');
        var pk=J.pkg,fl=LD.f||[],files='';
        /* every file of the package (listed by --fix from the packages folder), grouped by folder */
        if(fl.length){var gr={};fl.forEach(function(f){var i=f.lastIndexOf('/'),k=i<0?'':f.slice(0,i);(gr[k]=gr[k]||[]).push(f)});
          files=Object.keys(gr).map(function(k){return '<li>'+(k?'<b>'+k+'/</b> ':'')+gr[k].map(function(f){return '<a href="../'+pk.dir+'/'+f+'" download="'+f.split('/').pop()+'">'+f.slice(k?k.length+1:0)+'</a>'}).join(' · ')+'</li>'}).join('')}
        /* reference solution: only the files under final/ */
        var refs=fl.filter(function(f){return f.indexOf('final/')===0}).map(function(f){return '<li><a href="../'+pk.dir+'/'+f+'">'+f+'</a></li>'}).join('');
        /* "Done when" checklist: ticks are kept per lesson in the browser (learn-accept), never required */
        function esc(x){return String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
        function acceptList(a){var AK='learn-accept',m=jget(AK,{}),ck=m[here]||[];
          return '<ul class="accept">'+(a.en||[]).map(function(e,i){return '<li><label><input type="checkbox" data-i="'+i+'"'+(ck.indexOf(i)>-1?' checked':'')+'> '+t({en:esc(e),zh:esc((a.zh||[])[i]||e)})+'</label></li>'}).join('')+'</ul>'}
        pc.innerHTML='<b class="lbl">'+t({en:'Project card',zh:'项目卡'})+'</b>'+(pk?'<p class="meta">'+t({en:'The lesson shows the key parts. The complete project, with the file names used below, is in the starter and final code at the end of this card.',zh:'课文只展示关键部分。完整的项目（用的就是下面这些文件名）在这张卡片末尾的起步与完成代码里。'})+'</p>':'')+'<dl>'+
          (J.goal?'<dt>'+t({en:'Goal',zh:'目标'})+'</dt><dd>'+t(J.goal)+'</dd>':'')+(J.deliver?'<dt>'+t({en:'Deliverable',zh:'交付物'})+'</dt><dd>'+t(J.deliver)+'</dd>':'')+
          (J.level?'<dt>'+t({en:'Difficulty',zh:'难度'})+'</dt><dd>'+t(LV[J.level])+'</dd>':'')+((P&&P.mins)||J.mins?'<dt>'+t({en:'Time',zh:'时间'})+'</dt><dd>'+t({en:'about '+((P&&P.mins)||J.mins)+' minutes',zh:'约 '+((P&&P.mins)||J.mins)+' 分钟'})+'</dd>':'')+
          (J.accept?'<dt>'+t({en:'Done when…',zh:'完成标准'})+'</dt><dd>'+(Array.isArray(J.accept)?'<ul>'+li(J.accept)+'</ul>':acceptList(J.accept))+'</dd>':'')+
          (J.fail?'<dt>'+t({en:'Common problems',zh:'常见问题'})+'</dt><dd><ul>'+li(J.fail)+'</ul></dd>':'')+
          (J.stretch?'<dt>'+t({en:'Stretch goals',zh:'进阶挑战'})+'</dt><dd><ul>'+li(J.stretch)+'</ul></dd>':'')+
          (J.solution&&refs?'<dt>'+t({en:'Reference solution',zh:'参考答案'})+'</dt><dd><p>'+t({en:esc(J.solution.en),zh:esc(J.solution.zh)})+'</p><ul class="pkg">'+refs+'</ul></dd>':'')+
          (files?'<dt>'+t({en:'Starter and final code',zh:'起步与完成代码'})+'</dt><dd><ul class="pkg">'+files+'</ul>'+(pk.note?'<p class="meta">'+t(pk.note)+'</p>':'')+'<p><button type="button" class="btn dl-all" data-dir="'+pk.dir+'" data-files="'+esc(fl.join('|'))+'">'+t({en:'Download all files (.zip)',zh:'下载全部文件（.zip）'})+'</button></p><p class="meta">'+t({en:'The zip keeps the folder layout.',zh:'压缩包保留文件夹结构。'})+'</p></dd>':'')+'</dl>';
        pc.addEventListener('change',function(ev){var c=ev.target;if(!c||c.type!=='checkbox'||!c.closest('.accept'))return;
          var AK='learn-accept',m=jget(AK,{}),ck=[];pc.querySelectorAll('.accept input').forEach(function(x){if(x.checked)ck.push(+x.dataset.i)});m[here]=ck;set(AK,JSON.stringify(m))});
        anchor.after(pc)}
      if(typeof pc!=='undefined'&&pc)fold(pc,'Project card: goal, done when, files','项目卡：目标、完成标准、文件');
      var ba=document.querySelector('.stage .track-ba');
      if(!ba&&window.TRACKS&&document.querySelector('.stage .ringbox')){var tr=window.TRACKS.filter(function(x){return x.id===C.id})[0];
        if(tr&&(tr.before||tr.after)){ba=document.createElement('div');ba.className='track-ba';
          ba.innerHTML=(tr.before?'<div><b class="lbl">'+t({en:'Before this track',zh:'学这条路线之前'})+'</b><p>'+t(tr.before)+'</p></div>':'')+(tr.after?'<div><b class="lbl">'+t({en:'After this track',zh:'学完之后'})+'</b><p>'+t(tr.after)+'</p></div>':'');
          document.querySelector('.stage .ringbox').after(ba)}}
    }
    if(C&&(document.querySelector('.stage .ringbox')||document.querySelector('main .meta')))renderMeta();

    /* hub: topic and lesson counts are never typed by hand. They come from each track's lessons.js
       (scripts/check-counts.mjs fails a PR that types one). Progress is completed / PUBLISHED lessons; planned lessons are shown separately. */
    var hub=document.querySelector('.track-list'),rsm=document.getElementById('resume');
    function pbar(n,tot,label){return '<div class="mini" role="progressbar" aria-label="'+label+'" aria-valuemin="0" aria-valuemax="'+tot+'" aria-valuenow="'+n+'" aria-valuetext="'+n+' / '+tot+'"><i style="width:'+(tot?n/tot*100:0)+'%"></i></div>'}
    function card(c,ci,n,ok){return '<a class="cc spot" href="'+c.href+'"><div class="orbi">'+c.icon+'</div><div><h3>'+t(c.title)+'</h3><div class="meta" style="margin-top:4px">'+t(c.desc)+'</div><div class="chips"><span class="chip">'+(c.entry?t(c.entry):ci>-1?t({en:'Step '+(ci+1),zh:'第 '+(ci+1)+' 步'}):'')+(c.level?((c.entry||ci>-1)?' · ':'')+t({en:'Starts at '+LV[c.level].en.toLowerCase(),zh:LV[c.level].zh+'起步'}):'')+'</span>'+(ok&&n?'<span class="chip">'+t({en:n+' of '+c.published+' done',zh:'已完成 '+n+' / '+c.published})+'</span>':'')+'</div>'+pbar(n,c.published||0,'Progress in '+c.title.en+' · '+c.title.zh)+'</div><div class="go">→</div></a>'}
    /* Tracks are grouped by domain (window.DOMAINS in tracks.js); a track names its domain with domain:'<id>'. Step numbers count within a domain. */
    function drawHub(){if(!hub)return;var D=window.DOMAINS&&window.DOMAINS.length?window.DOMAINS:[{id:'ai',title:{en:'AI',zh:'AI'}}];
      function tracksOf(dm){return window.TRACKS.filter(function(c){return (c.domain||'ai')===dm.id})}
      var want=(location.hash||'').slice(1),cur=null;D.forEach(function(dm){if(dm.id===want&&tracksOf(dm).length>1)cur=dm});
      /* Two levels: the domains first (AI, project management); a domain with several tracks opens its track list, one with a single track goes straight to it. */
      var hints=document.querySelectorAll('#topics > .sub, #topics > p.meta');for(var h=0;h<hints.length;h++)hints[h].hidden=!cur;
      if(cur){var ts=tracksOf(cur);
        hub.innerHTML='<section class="dom"><p class="meta"><a href="tracks.html" data-back>'+t({en:'← All subjects',zh:'← 全部领域'})+'</a></p><h3 class="dom-h">'+(cur.icon?'<span aria-hidden="true">'+cur.icon+'</span> ':'')+t(cur.title)+'</h3>'+(cur.desc?'<p class="meta">'+t(cur.desc)+'</p>':'')+(function(){var en=ts.filter(function(c){return c.entry}),pa=ts.filter(function(c){return !c.entry});
          function list(a,num){return '<div class="tl">'+a.map(function(c,ci){return card(c,num?ci:-1,count(c.id,c.files),c.total>0)}).join('')+'</div>'}
          /* Entry points (pick by who you are) come first; the tracks after them are one path, numbered. A domain without entry points is one numbered path. */
          if(!en.length||!pa.length)return list(ts,pa.length>1);
          return '<h4 class="dom-g">'+t({en:'Pick where you start',zh:'选一个起点'})+'</h4>'+list(en,false)+'<h4 class="dom-g">'+t({en:'Then the engineering path, in order',zh:'然后按顺序走工程路线'})+'</h4>'+list(pa,true)})()+'</section>';return}
      hub.innerHTML='<section class="dom"><div class="tl">'+D.map(function(dm){var ts=tracksOf(dm);if(!ts.length)return '';var href=ts.length>1?'#'+dm.id:ts[0].href;
        return '<a class="cc spot" href="'+href+'"><div class="orbi">'+(dm.icon||'')+'</div><div><h3>'+t(dm.title)+'</h3>'+(dm.desc?'<div class="meta" style="margin-top:4px">'+t(dm.desc)+'</div>':'')+'</div><div class="go">→</div></a>'}).join('')+'</div></section>'}
    addEventListener('hashchange',function(){drawHub();scrollTo(0,document.getElementById('topics')?document.getElementById('topics').offsetTop-20:0)});
    function canStore(){try{localStorage.setItem('learn-t','1');localStorage.removeItem('learn-t');return true}catch(e){return false}}
    function drawResume(){
      var T=window.TRACKS,tot=0,fin=0,hasP=false,lookup={};
      T.forEach(function(c){tot+=c.published||0;var k=count(c.id,c.files);fin+=k;if(k)hasP=true;(c.files||[]).forEach(function(f,i){lookup[c.id+'/'+f]={c:c,f:f,t:c.titles[f]}})});
      /* where to continue: the lesson you were on, else the next unfinished one in that track, else the first unfinished one anywhere */
      var last=jget(LAST,null),go=null,ci=-1;
      if(last){T.forEach(function(c,i){if(c.id===last.t)ci=i})}
      if(ci>-1){var nf=nextOf(T[ci].id,T[ci].files||[]);if(nf)go={c:T[ci],f:nf}}
      if(!go)T.some(function(c){var nf=c.files&&nextOf(c.id,c.files);if(nf){go={c:c,f:nf};return true}});
      var started=hasP||!!last,hs=document.querySelector('[data-start]');
      if(hs&&go&&started){hs.href=go.c.href.replace(/[^\/]*$/,'')+go.f;hs.innerHTML=t({en:'Continue where you left off →',zh:'继续上次的进度 →'})}
      var sh=document.getElementById('stopped');if(sh){if(go&&started){sh.hidden=false;sh.innerHTML=t({en:'Next up: ',zh:'下一课：'})+t(go.c.titles[go.f])}else sh.hidden=true}
      if(!rsm)return;
      if(!started){rsm.hidden=false;rsm.innerHTML='<p class="meta">'+t({en:'No saved progress yet. Your progress is kept only in this browser; open any lesson to begin.',zh:'还没有学习记录。进度只保存在这个浏览器里，打开任意一课就开始了。'})+'</p>'+(canStore()?'':'<p class="meta warn">'+t({en:'This browser is blocking saved progress, so your place cannot be remembered.',zh:'这个浏览器禁止保存数据，所以无法记住你的进度。'})+'</p>');return}
      rsm.hidden=false;
      rsm.innerHTML='<h2>'+t({en:'Your learning',zh:'我的学习'})+'</h2><div class="rs-grid">'+
        (go?'<a class="cc spot rs-go" href="'+go.c.href.replace(/[^\/]*$/,'')+go.f+'"><div><div class="ey">'+t({en:'Continue',zh:'继续学习'})+' · '+t(go.c.title)+'</div><h3>'+t(go.c.titles[go.f])+'</h3></div><div class="go">→</div></a>':'<div class="cc rs-go"><div><h3>'+t({en:'You have finished every published lesson. 🎉',zh:'所有已发布的课你都学完了。🎉'})+'</h3></div></div>')+
        '<div class="cc rs-all"><div><div class="ey">'+t({en:'All tracks',zh:'全部路线'})+'</div><div style="font-weight:700">'+t({en:fin+' of '+tot+' published lessons completed',zh:'已完成 '+fin+' / '+tot+' 课（已发布）'})+'</div>'+pbar(fin,tot,'Overall progress · 总进度')+'</div></div></div>'+
        (canStore()?'':'<p class="meta warn">'+t({en:'This browser is blocking saved progress.',zh:'这个浏览器禁止保存数据。'})+'</p>');
    }
    /* Progress needs every track's lesson files and titles: tracks-index.js (window.TRACK_INDEX, written by scripts/check-pages.mjs --fix from each lessons.js) holds them in one file. */
    function absorb(){var X=window.TRACK_INDEX||{};(window.TRACKS||[]).forEach(function(c){var x=X[c.id];if(x){c.topics=x.topics;c.total=x.total;c.files=x.files;c.titles=x.titles;c.published=x.files.length}})}
    function withIndex(cb){if(window.TRACK_INDEX)return cb();var sc=document.createElement('script');sc.src=P+'tracks-index.js';sc.onload=sc.onerror=function(){cb()};document.body.appendChild(sc)}
    if(window.TRACKS&&(hub||rsm))withIndex(function(){absorb();drawHub();drawResume()});

    /* What next: a card pointing to the next lesson in this track or, when the track is finished, to the tracks it names in tracks.js (next:['<id>',...], always in its own subject) and its optional go:{href,title} link. The track's "after" line is always shown, also when nothing follows. */
    function whatNext(host,place,nl,fin){
      var cur=C&&window.TRACKS?window.TRACKS.filter(function(x){return x.id===C.id})[0]:null;
      function show(h,why){var a=document.createElement('aside');a.className='card whatnext';a.setAttribute('aria-label','What next · 下一步');
        a.innerHTML='<b class="lbl">'+t({en:'What next',zh:'下一步'})+'</b>'+why+h;place(a)}
      if(nl){var tp=C.topics.filter(function(w){return w.n===nl.w})[0],cw=C.lessons[C.lessons.indexOf(nl)-1];
        var why=(host&&tp&&cw&&cw.w!==nl.w)?'<p>'+t({en:'You have finished this topic. Next topic: ',zh:'这个主题学完了。下一个主题：'})+t(tp.title)+'</p>':'';
        show('<a class="btn pri wn-go" href="'+nl.file+'"><small>'+t({en:'Next lesson',zh:'下一课'})+'</small> '+t(nl.title)+' →</a>',why);return}
      if(!fin||!cur)return;
      withIndex(function(){var X=window.TRACK_INDEX||{},h='',pre='';
        (cur.next||[]).forEach(function(id,k){var c=window.TRACKS.filter(function(x){return x.id===id&&(x.domain||'ai')===(cur.domain||'ai')})[0],x=X[id];if(!c||!x||!x.files.length)return;
          h+='<a class="btn'+(h?'':' pri')+' wn-go" href="../'+id+'/'+x.files[0]+'"><small>'+t({en:'Next track',zh:'下一条路线'})+' · '+t(c.title)+'</small> '+t(x.titles[x.files[0]])+' →</a> ';
          if(c.before&&!pre)pre=(cur.next.length>1?'':'<p class="meta">'+t({en:'Before you start it: ',zh:'开始之前：'})+t(c.before)+'</p>')});
        if(cur.go)h+='<a class="btn'+(h?'':' pri')+' wn-go" href="../'+cur.go.href+'">'+t(cur.go.title)+' →</a> ';
        show(h+pre,cur.after?'<p>'+t(cur.after)+'</p>':'<p>'+t({en:'You have finished this track.',zh:'这条路线学完了。'})+'</p>')})}
    /* "Download all files": a store-only .zip built in the browser (no library), so the folder layout survives */
    function crc32(u){var t=crc32.t;if(!t){t=crc32.t=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}}var r=-1;for(var i=0;i<u.length;i++)r=t[(r^u[i])&255]^(r>>>8);return(r^-1)>>>0}
    function makeZip(list){var enc=new TextEncoder(),parts=[],cen=[],off=0;
      list.forEach(function(f){var nm=enc.encode(f.name),c=crc32(f.data),h=new DataView(new ArrayBuffer(30));
        h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint32(14,c,true);h.setUint32(18,f.data.length,true);h.setUint32(22,f.data.length,true);h.setUint16(26,nm.length,true);
        parts.push(h.buffer,nm,f.data);
        var e=new DataView(new ArrayBuffer(46));e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(8,0x0800,true);e.setUint32(16,c,true);e.setUint32(20,f.data.length,true);e.setUint32(24,f.data.length,true);e.setUint16(28,nm.length,true);e.setUint32(42,off,true);
        cen.push(e.buffer,nm);off+=30+nm.length+f.data.length});
      var cs=0;cen.forEach(function(b){cs+=b.byteLength||b.length});
      var z=new DataView(new ArrayBuffer(22));z.setUint32(0,0x06054b50,true);z.setUint16(8,list.length,true);z.setUint16(10,list.length,true);z.setUint32(12,cs,true);z.setUint32(16,off,true);
      return new Blob(parts.concat(cen,[z.buffer]),{type:'application/zip'})}
    document.addEventListener('click',function(ev){var b=ev.target.closest&&ev.target.closest('.dl-all');if(!b||b.disabled)return;
      var dir=b.dataset.dir,names=(b.dataset.files||'').split('|').filter(Boolean),label=b.innerHTML;b.disabled=true;
      Promise.all(names.map(function(n){return fetch('../'+dir+'/'+n).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()}).then(function(buf){return{name:n,data:new Uint8Array(buf)}})}))
        .then(function(list){var a=document.createElement('a');a.href=URL.createObjectURL(makeZip(list));a.download=dir.split('/').pop()+'.zip';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1000)})
        .then(function(){b.innerHTML=label},function(){b.innerHTML=t({en:'Could not download. Save each file above instead.',zh:'下载失败，请逐个保存上方文件。'})})
        .then(function(){b.disabled=false})});
    /* browser tab title follows the language: fixed pages by name, lessons from their own zh title */
    var TZ={'index.html':'TX Learns – 中英双语互动学习','tracks.html':'选一条路线 | TX Learns','study/index.html':'学习教练 | TX Learns','study/about.html':'关于学习教练 | TX Learns','study/how.html':'学习教练如何运作 | TX Learns','ecosystem.html':'TX Learns 如何运作','glossary.html':'AI 词汇表 | TX Learns','about.html':'关于本站 | TX Learns'},TE=document.title;
    function setTitle(){var zh=root.getAttribute('data-lang')==='zh',tl=C&&C.lessons?C.lessons.filter(function(l){return l.file===here})[0]:null,z=!C&&TZ[(AREA==='study'?'study/':'')+here]?TZ[(AREA==='study'?'study/':'')+here]:(tl&&tl.title&&tl.title.zh?tl.title.zh+' | TX Learns':'');document.title=zh&&z?z:TE}
    setTitle();new MutationObserver(setTitle).observe(root,{attributes:true,attributeFilter:['data-lang']});
    /* detail cards start folded so the lesson itself comes first */
    function fold(el,en,zh){if(!el||!el.parentNode||el.parentNode.classList.contains('fold'))return;var dt=document.createElement('details'),sm=document.createElement('summary');dt.className='fold';sm.innerHTML=t({en:en,zh:zh});el.before(dt);dt.appendChild(sm);dt.appendChild(el)}
    /* "On this page": a contents list beside wide screens, with the section in view highlighted */
    function buildToc(){var hs=[].slice.call(document.querySelectorAll('main h2')).filter(function(h){return h.textContent.trim()});if(hs.length<3||document.querySelector('.toc'))return;
      var nav=document.createElement('nav'),h='<b class="lbl">'+t({en:'On this page',zh:'本页目录'})+'</b><ol>';nav.className='toc';nav.setAttribute('aria-label','On this page · 本页目录');
      hs.forEach(function(x,i){if(!x.id)x.id='sec-'+(i+1);h+='<li><a href="#'+x.id+'">'+x.innerHTML.replace(/<span class="no">.*?<\/span>/g,'')+'</a></li>'});
      nav.innerHTML=h+'</ol>';document.body.appendChild(nav);var links=nav.querySelectorAll('a');
      if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)links.forEach(function(l){l.classList.toggle('on',l.getAttribute('href')==='#'+e.target.id)})})},{rootMargin:'-15% 0px -75% 0px'});hs.forEach(function(x){io.observe(x)})}}
    /* keep the topics drawer in step after a lesson is marked done or undone: ticks and the n/total counters */
    function syncSide(){if(!side)return;var key=function(a){var h=(a.getAttribute('href')||'').replace(/^(\.\.\/)+/,'');return h.indexOf('/')>-1?h:(C?C.id+'/'+h:h)};
      side.querySelectorAll('.cg').forEach(function(g){var n=0,tot=0;g.querySelectorAll('.cg-b a[href]').forEach(function(a){var h=a.getAttribute('href')||'';if(!/\.html$/.test(h)||/(^|\/)index\.html$/.test(h))return;tot++;var on=!!d[key(a)];a.classList.toggle('done',on);if(on)n++});
        var pg=g.querySelector('.pg');if(pg&&tot)pg.textContent=n+'/'+tot})}
    /* lesson: prev/next + done + dock */
    var idx=C?C.lessons.findIndex(function(l){return l.file===here}):-1;
    if(C&&idx>-1){
      set(LAST,JSON.stringify({t:C.id,f:here}));
      var cl=C.lessons[idx],tp=C.topics.filter(function(w){return w.n===cl.w})[0],tag0=document.querySelector('main .tag');
      if(tag0&&tp){var bc=document.createElement('nav');bc.className='crumbs';bc.setAttribute('aria-label','Breadcrumb · 面包屑');
        bc.innerHTML='<a href="../tracks.html">'+t({en:'Tracks',zh:'路线'})+'</a> › <a href="index.html">'+t(C.title)+'</a> › <span>'+t(tp.title)+'</span>';tag0.before(bc)}
      var pg=document.querySelector('.pager'),p=C.lessons[idx-1],n=C.lessons[idx+1];
      if(pg)pg.innerHTML=(p?'<a href="'+p.file+'"><small>← '+t({en:'Previous',zh:'上一课'})+'</small>'+t(p.title)+'</a>':'')+'<a class="back" href="index.html">'+t({en:'All lessons in this track',zh:'本路线所有课'})+'</a>'+(n?'<a class="next" href="'+n.file+'"><small>'+t({en:'Next',zh:'下一课'})+' →</small>'+t(n.title)+'</a>':'');
      /* "Was this lesson clear?": one tap, sent as an anonymous analytics event (lesson and yes/no only); the answer is kept on this device so it is asked once */
      (function(){var FK='learn-fb',fbs=jget(FK,{}),fk=C.id+'/'+here,a=document.createElement('aside');a.className='fbk';a.setAttribute('aria-label','Was this lesson clear? · 这一课讲清楚了吗？');
        function draw(){a.innerHTML=fbs[fk]?'<p role="status">'+t({en:'Thanks. That shows me which lessons to fix first.',zh:'谢谢，这能让我知道先改哪一课。'})+'</p>':'<b class="lbl">'+t({en:'Was this lesson clear?',zh:'这一课讲清楚了吗？'})+'</b><button type="button" class="btn" data-v="yes">'+t({en:'Yes',zh:'清楚'})+'</button><button type="button" class="btn" data-v="no">'+t({en:'Not quite',zh:'不太清楚'})+'</button>'}
        a.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-v]');if(!b)return;fbs[fk]=b.dataset.v;set(FK,JSON.stringify(fbs));track('Lesson feedback',{lesson:fk,answer:b.dataset.v});draw()});
        draw();if(pg)pg.before(a)})();
      /* last published lesson of its topic: the What next card */
      var lastIn=C.lessons.filter(function(x){return x.w===cl.w}).pop()===cl;
      if(lastIn)whatNext(true,function(a){if(pg)pg.before(a);else{var m3=document.querySelector('main');if(m3)m3.appendChild(a)}},n,!n);
      /* no button: a lesson counts as done once the reader is at its end and has had the page open for half a minute, so a quick swipe to the pager does not count */
      if(pg&&'IntersectionObserver' in window){var key=C.id+'/'+here,T0=Date.now(),MINREAD=30000,atEnd=false,endT=0,
        fin=function(){if(!atEnd)return;endIO.disconnect();var x=done();if(!x[key]){x[key]=1;set(DONE,JSON.stringify(x));d=x;try{var rv=jget('learn-review',{}),h1=document.querySelector('main h1');rv[key]={t:Date.now(),en:((h1&&h1.querySelector('.en'))||{}).textContent||document.title,zh:((h1&&h1.querySelector('.zh'))||{}).textContent||document.title,h:key};set('learn-review',JSON.stringify(rv))}catch(e){}syncSide();track('Lesson done',{lesson:key})}},
        endIO=new IntersectionObserver(function(es){atEnd=es[es.length-1].isIntersecting;clearTimeout(endT);if(atEnd)endT=setTimeout(fin,Math.max(0,MINREAD-(Date.now()-T0)))});endIO.observe(pg)}
      buildToc();
      var dock=document.createElement('div');dock.className='dock';var RR=18,LL=2*Math.PI*RR;
      dock.innerHTML='<button class="dk" data-a="m" title="Menu" aria-label="Open topics menu · 打开主题菜单">☰</button>'+(p?'<a class="dk" href="'+p.file+'" title="Previous" aria-label="Previous lesson · 上一课">‹</a>':'<span class="dk off" aria-hidden="true">‹</span>')+
        '<div class="dk ring" role="progressbar" aria-label="Reading progress · 阅读进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><svg width="44" height="44" viewBox="0 0 44 44"><circle class="bg" cx="22" cy="22" r="'+RR+'"/><circle class="fg" cx="22" cy="22" r="'+RR+'" stroke-dasharray="'+LL+'" stroke-dashoffset="'+LL+'"/></svg><b>0</b></div>'+
        (n?'<a class="dk" href="'+n.file+'" title="Next" aria-label="Next lesson · 下一课">›</a>':'<span class="dk off" aria-hidden="true">›</span>')+'<button class="dk" data-a="t" title="Top" aria-label="Back to top · 回到顶部">↑</button>';
      document.body.appendChild(dock);
      /* phone: hide the dock while scrolling down, show it when scrolling up or near the page end */
      var ly=window.scrollY,tk=0;window.addEventListener('scroll',function(){if(tk)return;tk=requestAnimationFrame(function(){tk=0;var y=window.scrollY,end=y+innerHeight>=document.documentElement.scrollHeight-80;dock.classList.toggle('away',y>ly+6&&y>200&&!end&&innerWidth<=720);if(Math.abs(y-ly)>6)ly=y})},{passive:true});
      dock.querySelector('[data-a=m]').onclick=function(){window.TX.menu()};
      dock.querySelector('[data-a=t]').onclick=function(){window.scrollTo({top:0,behavior:calm?'auto':'smooth'})};
    }
    var fg=document.querySelector('.dock .fg'),rn=document.querySelector('.dock .ring b');
    function onScroll(){var h=document.documentElement,pr=h.scrollTop/(h.scrollHeight-h.clientHeight||1);bar.style.width=(pr*100)+'%';
      if(fg){fg.style.strokeDashoffset=2*Math.PI*18*(1-pr);rn.textContent=Math.round(pr*100);rn.parentNode.setAttribute('aria-valuenow',Math.round(pr*100))}}
    window.addEventListener('scroll',onScroll,{passive:true});onScroll();

    var codeN=0;
    /* code boxes: a Copy button, an optional file/language label (data-file, data-lang on the <pre>), and a keyboard-scrollable region */
    document.querySelectorAll('main pre, main .codebox').forEach(function(pre){
      if(pre.closest('.codewrap'))return;
      var w=document.createElement('div');w.className='codewrap';pre.parentNode.insertBefore(w,pre);
      var bar=document.createElement('div');bar.className='codebar';
      var lab=[pre.getAttribute('data-file'),pre.getAttribute('data-lang')].filter(Boolean).join(' · ');
      bar.innerHTML='<span class="codelab">'+lab+'</span><button type="button" class="codecopy">'+t({en:'Copy',zh:'复制'})+'</button>';
      w.appendChild(bar);w.appendChild(pre);
      pre.tabIndex=0;pre.setAttribute('role','region');pre.setAttribute('aria-label',(lab?lab+' · ':'')+'Code '+(++codeN)+' · 代码 '+codeN);
      var b=bar.querySelector('.codecopy');
      b.onclick=function(){var txt=pre.innerText.replace(/\n+$/,'');
        function ok(){b.innerHTML=t({en:'Copied ✓',zh:'已复制 ✓'});setTimeout(function(){b.innerHTML=t({en:'Copy',zh:'复制'})},1800)}
        function fb(){var ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok()}catch(e){b.innerHTML=t({en:'Press Ctrl+C',zh:'请按 Ctrl+C'})}ta.remove()}
        if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(ok,fb);else fb()}});

    /* components */
    document.querySelectorAll('.flip').forEach(function(f){var w=document.createElement('div');w.className='flip-in';while(f.firstChild)w.appendChild(f.firstChild);f.appendChild(w);
      /* A flashcard is a toggle button: Tab to it, Enter or Space flips it. */
      f.setAttribute('role','button');f.tabIndex=0;f.setAttribute('aria-pressed','false');
      var flip=function(){var o=f.classList.toggle('on');f.setAttribute('aria-pressed',o)};
      f.onclick=flip;f.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}}});
    var qs=document.querySelectorAll('.quiz'),right=0,answered=0,sc;
    if(qs.length){sc=document.createElement('div');sc.className='score';sc.setAttribute('aria-live','polite');qs[qs.length-1].after(sc)}
    qs.forEach(function(q){q.classList.add('spot');q.querySelectorAll('.opt').forEach(function(o){o.onclick=function(e){
      if(q.classList.contains('done'))return;q.classList.add('done');answered++;
      var ok=o.dataset.k===q.dataset.answer;if(ok){right++;burst(e.clientX,e.clientY)}
      var st=q.querySelector('.sr-st');if(!st){st=document.createElement('div');st.className='sr';st.setAttribute('role','status');st.setAttribute('aria-live','polite');st.classList.add('sr-st');q.appendChild(st)}
      st.textContent=ok?'Correct · 答对了':'Not quite, the right answer is now marked · 不太对，已标出正确答案';
      o.classList.add(ok?'ok':'bad');q.querySelector('.opt[data-k="'+q.dataset.answer+'"]').classList.add('ok');
      if(answered===qs.length)sc.innerHTML=t({en:'Score: '+right+' / '+qs.length+(right===qs.length?' 🏆':''),zh:'得分：'+right+' / '+qs.length+(right===qs.length?' 🏆':'')})}})});
    document.querySelectorAll('.stepper').forEach(function(s){
      var st=s.querySelectorAll('.step'),i=0,b=document.createElement('div');b.className='bar';
      b.innerHTML='<button class="btn prev">←</button><div class="dots">'+[].map.call(st,function(x,k){return '<button type="button" aria-label="Step '+(k+1)+' · 第 '+(k+1)+' 步"></button>'}).join('')+'</div><button class="btn pri nxt">→</button>';s.appendChild(b);
      var dots=b.querySelectorAll('.dots button');b.querySelector('.prev').setAttribute('aria-label','Previous step · 上一步');b.querySelector('.nxt').setAttribute('aria-label','Next step · 下一步');
      function show(){st.forEach(function(x,k){x.classList.toggle('on',k===i);dots[k].classList.toggle('on',k<=i)});dots.forEach(function(x,k){if(k===i)x.setAttribute('aria-current','step');else x.removeAttribute('aria-current')});b.querySelector('.prev').disabled=i===0;b.querySelector('.nxt').disabled=i===st.length-1}
      b.querySelector('.prev').onclick=function(){i--;show()};b.querySelector('.nxt').onclick=function(){i++;show()};
      dots.forEach(function(x,k){x.onclick=function(){i=k;show()}});show()});
    document.querySelectorAll('.card,.callout,.stepper,.wfwrap').forEach(function(e){e.classList.add('spot')});

    /* keyboard: lesson widgets often make a <div> or an SVG node clickable. Give each one a Tab stop and let
       Enter or Space click it, so nothing is mouse-only (the frontend engineer agent flags anything still missed). */
    var FOC='a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])';
    function kb(){[].forEach.call(document.querySelectorAll('main *,.side *'),function(el){
      if(el.hasAttribute('data-kb')||el.closest(FOC)||el.querySelector(FOC))return;
      var cs=getComputedStyle(el),pc=el.parentElement&&getComputedStyle(el.parentElement).cursor;
      if(typeof el.onclick!=='function'&&!(cs.cursor==='pointer'&&pc!=='pointer'))return;
      el.setAttribute('data-kb','');el.setAttribute('tabindex','0');if(!el.getAttribute('role'))el.setAttribute('role','button')})}
    document.addEventListener('keydown',function(e){var el=e.target;
      if((e.key==='Enter'||e.key===' ')&&el&&el.hasAttribute&&el.hasAttribute('data-kb')){e.preventDefault();el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))}});
    /* any box that scrolls sideways or down (wide figures, tables, code) must be reachable with the keyboard too */
    var scN=0;
    function scrollers(){[].forEach.call(document.querySelectorAll('main *'),function(el){
      if(el.hasAttribute('tabindex')||el.hasAttribute('data-sc')||el.closest('[hidden]'))return;
      var ox=getComputedStyle(el).overflowX,oy=getComputedStyle(el).overflowY;
      if(!/(auto|scroll)/.test(ox+oy)||(el.scrollWidth<=el.clientWidth+1&&el.scrollHeight<=el.clientHeight+1))return;
      if(el.querySelector(FOC))return;
      el.setAttribute('data-sc','');el.tabIndex=0;el.setAttribute('role','region');
      if(!el.getAttribute('aria-label'))el.setAttribute('aria-label','Scrollable content '+(++scN)+' · 可滚动内容 '+scN)})}
    var kbt;function kbLater(){clearTimeout(kbt);kbt=setTimeout(function(){kb();scrollers()},150)}
    if(window.MutationObserver)new MutationObserver(kbLater).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('load',kbLater);window.addEventListener('resize',kbLater);kbLater();

    /* effects: spotlight, tilt, count-up, reveal */
    document.addEventListener('mousemove',function(e){var s=e.target.closest&&e.target.closest('.spot');if(s){var r=s.getBoundingClientRect();s.style.setProperty('--mx',(e.clientX-r.left)+'px');s.style.setProperty('--my',(e.clientY-r.top)+'px')}
      var c=e.target.closest&&e.target.closest('.cc');if(c){var r2=c.getBoundingClientRect(),x=(e.clientX-r2.left)/r2.width-.5,y=(e.clientY-r2.top)/r2.height-.5;c.style.transform='perspective(900px) rotateX('+(-y*5)+'deg) rotateY('+(x*7)+'deg) translateY(-4px)'}});
    document.addEventListener('mouseout',function(e){var c=e.target.closest&&e.target.closest('.cc');if(c&&!c.contains(e.relatedTarget))c.style.transform=''});
    document.querySelectorAll('.zh:not([lang])').forEach(function(e){e.lang='zh-Hans'});document.querySelectorAll('.en:not([lang])').forEach(function(e){e.lang='en'});
    /* study page: lessons finished 1, 3, 7, 14 or 30 days ago come back as a short review list (kept on this device only) */
    (function(){var el=document.getElementById('review');if(!el)return;var m=jget('learn-review',{}),now=Date.now(),W=[[1,2],[3,4],[7,9],[14,17],[30,35]],due=[];
      Object.keys(m).forEach(function(k){var r=m[k],a=(now-(r&&r.t||0))/864e5;if(r&&r.h&&W.some(function(w){return a>=w[0]&&a<w[1]}))due.push(r)});
      if(!due.length){el.hidden=true;return}
      function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
      el.innerHTML='<h2><span class="en">Review <em>today</em></span><span class="zh">今日<em>复习</em></span></h2><ul class="rv-l">'+due.slice(0,3).map(function(r){return '<li><a href="'+P+esc(r.h)+'"><span class="en">'+esc(r.en)+'</span><span class="zh">'+esc(r.zh)+'</span></a></li>'}).join('')+'</ul>';el.hidden=false})();
    /* installable and readable offline: only on the live site over https, never in automated browsers */
    try{if(location.protocol==='https:'&&!navigator.webdriver){var ml=document.createElement('link');ml.rel='manifest';ml.href='/manifest.webmanifest';document.head.appendChild(ml);if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(function(){})}}catch(e){}
    document.querySelectorAll('[data-count]').forEach(countUp);
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:0,rootMargin:'0px 0px -8% 0px'});
    document.querySelectorAll('main > h2,main > .card,main > .callout,main > .quiz,main > .stepper,main > .grid,main > .flow,main > .wfwrap,main > p,main > section,main > .track-list').forEach(function(e){e.classList.add('rv');io.observe(e)});
  });
})();
