(function(){
  var KEY='learn-lang',DONE='learn-done',TH='learn-theme',root=document.documentElement;
  function get(k,d){try{return localStorage.getItem(k)||d}catch(e){return d}}
  function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function t(o){return '<span class="en">'+o.en+'</span><span class="zh">'+o.zh+'</span>'}
  function done(){try{return JSON.parse(get(DONE,'{}'))}catch(e){return {}}}
  var L0=get(KEY,(navigator.language||'').toLowerCase().indexOf('zh')===0?'zh':'en');if(L0!=='zh')L0='en';
  /* The page language follows EN/中文, so screen readers and search engines read it right. */
  function setLang(l){root.setAttribute('data-lang',l);root.lang=l==='zh'?'zh-Hans':'en'}setLang(L0);
  var calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.setAttribute('data-theme',get(TH,'dark'));
  var f=document.createElement('link');f.rel='stylesheet';f.href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';document.head.appendChild(f);

  function burst(x,y){if(calm)return;var e=['✨','⭐','💠','🎉','💫'];for(var i=0;i<14;i++){var s=document.createElement('span');s.className='pc';s.textContent=e[i%e.length];
    s.style.left=x+'px';s.style.top=y+'px';s.style.setProperty('--dx',(Math.random()*260-130)+'px');s.style.setProperty('--dy',(Math.random()*-220-20)+'px');s.style.setProperty('--r',(Math.random()*360)+'deg');
    document.body.appendChild(s);setTimeout(function(a){a.remove()},1000,s)}}
  window.TX={t:t,burst:burst};
  var TYPE={f:{en:'Foundations',zh:'基础'},c:{en:'Concept',zh:'概念'},p:{en:'Project',zh:'项目'}};

  if(window.TRACK&&!window.TRACKS)document.write('<script src="../tracks.js"><\/script>');
  document.addEventListener('DOMContentLoaded',function(){
    var C=window.TRACK,here=location.pathname.split('/').pop()||'index.html',d=done();
    if(C){C.all=[];C.topics.forEach(function(w){w.items.forEach(function(it,i){it.w=w.n;it.i=i+1;it.g=C.all.length+1;C.all.push(it)})});C.lessons=C.all.filter(function(x){return x.file});C.total=C.all.length}
    function countUp(el){var to=+el.dataset.count,s=performance.now();if(calm){el.textContent=to;return}(function tick(n){var k=Math.min(1,(n-s)/1200);el.textContent=Math.round(to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(tick)})(s)}
    function count(c){var n=0;for(var k in d)if(k.indexOf(c+'/')===0)n++;return n}

    var bar=document.createElement('div');bar.className='prog';document.body.prepend(bar);
    var top=document.createElement('div');top.className='top';
    top.innerHTML='<a class="brand" href="'+(C?'../index.html':'index.html')+'"><b></b>TX Learns</a>'+(C?'<button class="icon-btn menu-btn" aria-expanded="false" aria-controls="topics-nav">☰ <span class="en">Topics</span><span class="zh">主题</span></button>':'')+'<span class="sp"></span>'+'<a class="icon-btn eco-btn" href="'+(C?'../':'')+'ecosystem.html" title="How it works · 运作方式" aria-label="How it works · 运作方式">🌐<span class="lbl"> <span class="en">How it works</span><span class="zh">运作方式</span></span></a>'+
      '<div class="seg" role="group" aria-label="Language · 语言"><button data-l="en" lang="en">EN</button><button data-l="zh" lang="zh-Hans">中文</button></div><button class="icon-btn th" aria-label="theme"></button>';
    document.body.insertBefore(top,bar.nextSibling);
    function mark(){top.querySelectorAll('[data-l]').forEach(function(b){var on=b.dataset.l===root.getAttribute('data-lang');b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});var dk=root.getAttribute('data-theme')==='dark',th=top.querySelector('.th');th.textContent=dk?'☀︎':'☾';th.setAttribute('aria-label',dk?'Switch to light theme · 切换到浅色':'Switch to dark theme · 切换到深色')}
    top.querySelectorAll('[data-l]').forEach(function(b){b.onclick=function(){setLang(b.dataset.l);set(KEY,b.dataset.l);mark()}});
    top.querySelector('.th').onclick=function(){var n=root.getAttribute('data-theme')==='dark'?'light':'dark';root.setAttribute('data-theme',n);set(TH,n);mark()};
    mark();

    var side=document.querySelector('.side'),scrim;if(side){side.id='topics-nav';side.setAttribute('aria-label','Topics · 主题')}
    if(C&&side){
      var NK='learn-nav',ns={};try{ns=JSON.parse(localStorage.getItem(NK)||'{}')}catch(e){}
      var list=(window.TRACKS&&window.TRACKS.length)?window.TRACKS:[{id:C.id,icon:'',title:C.title,href:'agentic-ai/index.html'}];
      side.innerHTML=list.map(function(c){
        var cur=c.id===C.id,open=ns[c.id]!==undefined?ns[c.id]:cur,body;
        if(cur)body='<a href="index.html" class="'+(here==='index.html'?'cur':'')+'">⌂ '+t({en:'Overview',zh:'总览'})+'</a>'+
          C.topics.map(function(w){return '<h5>'+t(w.title)+'</h5>'+w.items.map(function(l){
            return l.file?'<a href="'+l.file+'" class="'+(l.file===here?'cur ':'')+(d[C.id+'/'+l.file]?'done':'')+'">'+t(l.title)+'</a>':'<span class="soon">'+t(l.title)+'</span>'}).join('')}).join('');
        else body='<a href="../'+c.href+'">⌂ '+t({en:'Overview',zh:'总览'})+'</a>';
        return '<div class="cg'+(open?' open':'')+(cur?' cur':'')+'" data-c="'+c.id+'"><button class="cg-h" aria-expanded="'+open+'"><span class="ic">'+(c.icon||'')+'</span><span class="tt">'+t(c.title)+'</span><span class="pg">'+count(c.id)+'/'+(cur?C.total:c.total||'')+'</span><i class="chev"></i></button><div class="cg-b"><div>'+body+'</div></div></div>'}).join('');
      side.querySelectorAll('.cg-h').forEach(function(h){h.onclick=function(){var g=h.parentNode,o=!g.classList.contains('open');g.classList.toggle('open',o);h.setAttribute('aria-expanded',o);ns[g.dataset.c]=o;try{localStorage.setItem(NK,JSON.stringify(ns))}catch(e){}}});
      scrim=document.createElement('div');scrim.className='scrim';scrim.setAttribute('aria-hidden','true');document.body.appendChild(scrim);
      document.body.appendChild(side);
      var tg=function(on){var o=on===undefined?!side.classList.contains('open'):on;side.classList.toggle('open',o);scrim.classList.toggle('on',o);var mb=top.querySelector('.menu-btn');mb.setAttribute('aria-expanded',o);
        if(o){var fa=side.querySelector('a,button');if(fa)fa.focus()}else if(side.contains(document.activeElement))mb.focus()};
      top.querySelector('.menu-btn').onclick=function(){tg()};scrim.onclick=function(){tg(false)};
      document.addEventListener('keydown',function(e){if(e.key==='Escape'&&side.classList.contains('open'))tg(false)});
      window.TX.menu=tg;
    }

    /* stage progress ring */
    var rb=document.querySelector('.ringbox');
    if(C&&rb){var n=count(C.id),R=36,L=2*Math.PI*R,p=n/C.total;
      rb.innerHTML='<div class="bigring"><svg width="84" height="84" viewBox="0 0 84 84"><defs><linearGradient id="rg"><stop offset="0" stop-color="#4c7dff"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs><circle class="bg" cx="42" cy="42" r="'+R+'"/><circle class="fg" cx="42" cy="42" r="'+R+'" stroke-dasharray="'+L+'" stroke-dashoffset="'+L+'"/></svg><b>'+Math.round(p*100)+'%</b></div><div style="text-align:left"><div style="font-weight:700">'+t({en:n+' of '+C.total+' lessons completed',zh:'已完成 '+n+' / '+C.total+' 课'})+'</div><div class="meta">'+t({en:C.lessons.length+' available now',zh:'当前已发布 '+C.lessons.length+' 课'})+'</div></div>';
      setTimeout(function(){rb.querySelector('.fg').style.strokeDashoffset=L*(1-p)},200)}
    var tm=document.querySelector('.track-meta');
    if(C&&tm)tm.innerHTML=t({en:C.topics.length+' topics · '+C.total+' lessons',zh:C.topics.length+' 个主题 · '+C.total+' 课'});
    var sb=document.querySelector('.startbtn');
    if(C&&sb&&C.lessons.length){sb.href=C.lessons[0].file;sb.innerHTML=t({en:'Start learning →',zh:'开始学习 →'})}

    /* journey: topic tabs + lesson cards */
    var jr=document.querySelector('.journey');
    if(C&&jr){
      var cur=0;for(var wi=0;wi<C.topics.length;wi++){if(C.topics[wi].items.some(function(x){return x.file})){cur=wi;break}}
      var draw=function(){
        var w=C.topics[cur],rd=w.items.filter(function(x){return x.file}).length;
        jr.innerHTML='<div class="wtabs">'+C.topics.map(function(x,i){return '<button class="wtab'+(i===cur?' on':'')+'" data-i="'+i+'">'+t(x.title)+'</button>'}).join('')+'</div>'+
          '<div class="wph"><div><div class="ey">'+t({en:'Topic '+w.n,zh:'主题 '+w.n})+'</div><h3>'+t(w.title)+'</h3></div><div class="meta">'+t({en:rd+' of '+w.items.length+' lessons available',zh:'已发布 '+rd+' / '+w.items.length+' 课'})+'</div></div>'+
          '<div class="lgrid">'+w.items.map(function(l){
            var no=('0'+l.g).slice(-2),chip='<span class="chip '+l.k+'">'+t(TYPE[l.k])+'</span>';
            if(l.file){var fin=d[C.id+'/'+l.file];return '<a class="lcard ready spot" href="'+l.file+'"><span class="n">'+no+'</span>'+chip+'<h4>'+t(l.title)+'</h4><span class="st">'+(fin?t({en:'✓ Completed',zh:'✓ 已完成'}):t({en:'Start →',zh:'开始 →'}))+'</span></a>'}
            return '<div class="lcard soon"><span class="n">'+no+'</span>'+chip+'<h4>'+t(l.title)+'</h4><span class="st">'+t({en:'Coming soon',zh:'即将发布'})+'</span></div>'}).join('')+'</div>';
        jr.querySelectorAll('.wtab').forEach(function(b){b.onclick=function(){cur=+b.dataset.i;draw()}});
      };
      draw();
    }

    /* hub: topic and lesson counts are never typed by hand. They come from each track's lessons.js
       (scripts/check-counts.mjs fails a PR that types one). */
    var hub=document.querySelector('.track-list'),sums=document.querySelectorAll('[data-sum]');
    function drawHub(){if(hub)hub.innerHTML=window.TRACKS.map(function(c){var n=count(c.id),ok=c.total>0;
      return '<a class="cc spot" href="'+c.href+'"><div class="orbi">'+c.icon+'</div><div><h3>'+t(c.title)+'</h3><div class="meta" style="margin-top:4px">'+t(c.desc)+'</div><div class="chips">'+(ok?'<span class="chip">'+t({en:c.topics+' topics',zh:c.topics+' 个主题'})+'</span><span class="chip">'+t({en:c.total+' lessons',zh:c.total+' 课'})+'</span>':'')+'<span class="chip">'+t({en:'Bilingual',zh:'双语'})+'</span></div><div class="mini"><i style="width:'+(ok?n/c.total*100:0)+'%"></i></div></div><div class="go">→</div></a>'}).join('')}
    if(window.TRACKS&&(hub||sums.length)){var q=window.TRACKS.slice();
      (function next(){var c=q.shift();
        if(!c){var tot={topics:0,lessons:0};window.TRACKS.forEach(function(x){tot.topics+=x.topics||0;tot.lessons+=x.total||0});
          sums.forEach(function(el){el.dataset.count=tot[el.dataset.sum];countUp(el)});drawHub();return}
        var sc=document.createElement('script');sc.src=c.href.replace(/[^\/]*$/,'')+'lessons.js';
        sc.onload=sc.onerror=function(){var T=window.TRACK;try{delete window.TRACK}catch(e){window.TRACK=undefined}
          if(T&&T.topics){c.topics=T.topics.length;c.total=0;T.topics.forEach(function(w){c.total+=w.items.length})}
          next()};
        document.body.appendChild(sc)})()}

    /* lesson: prev/next + done + dock */
    var db=document.querySelector('.mark-done'),idx=C?C.lessons.findIndex(function(l){return l.file===here}):-1;
    if(C&&idx>-1){
      var pg=document.querySelector('.pager'),p=C.lessons[idx-1],n=C.lessons[idx+1];
      if(pg)pg.innerHTML=(p?'<a href="'+p.file+'"><small>← '+t({en:'Previous',zh:'上一课'})+'</small>'+t(p.title)+'</a>':'')+(n?'<a class="next" href="'+n.file+'"><small>'+t({en:'Next',zh:'下一课'})+' →</small>'+t(n.title)+'</a>':'');
      if(db){var key=C.id+'/'+here;
        var lbl=function(){db.className='btn big mark-done'+(done()[key]?'':' pri');db.innerHTML=done()[key]?t({en:'✓ Completed — click to undo',zh:'✓ 已完成（点击撤销）'}):t({en:'Mark lesson as completed',zh:'标记本课已完成'})};
        db.onclick=function(e){var x=done();if(x[key])delete x[key];else{x[key]=1;burst(e.clientX,e.clientY)}set(DONE,JSON.stringify(x));lbl()};lbl()}
      var dock=document.createElement('div');dock.className='dock';var RR=18,LL=2*Math.PI*RR;
      dock.innerHTML='<button class="dk" data-a="m" title="Menu" aria-label="Open topics menu · 打开主题菜单">☰</button>'+(p?'<a class="dk" href="'+p.file+'" title="Previous" aria-label="Previous lesson · 上一课">‹</a>':'<span class="dk off" aria-hidden="true">‹</span>')+
        '<div class="dk ring"><svg width="44" height="44" viewBox="0 0 44 44"><circle class="bg" cx="22" cy="22" r="'+RR+'"/><circle class="fg" cx="22" cy="22" r="'+RR+'" stroke-dasharray="'+LL+'" stroke-dashoffset="'+LL+'"/></svg><b>0</b></div>'+
        (n?'<a class="dk" href="'+n.file+'" title="Next" aria-label="Next lesson · 下一课">›</a>':'<span class="dk off" aria-hidden="true">›</span>')+'<button class="dk" data-a="t" title="Top" aria-label="Back to top · 回到顶部">↑</button>';
      document.body.appendChild(dock);
      dock.querySelector('[data-a=m]').onclick=function(){window.TX.menu()};
      dock.querySelector('[data-a=t]').onclick=function(){window.scrollTo({top:0,behavior:calm?'auto':'smooth'})};
    }
    var fg=document.querySelector('.dock .fg'),rn=document.querySelector('.dock .ring b');
    function onScroll(){var h=document.documentElement,pr=h.scrollTop/(h.scrollHeight-h.clientHeight||1);bar.style.width=(pr*100)+'%';
      if(fg){fg.style.strokeDashoffset=2*Math.PI*18*(1-pr);rn.textContent=Math.round(pr*100)}}
    window.addEventListener('scroll',onScroll,{passive:true});onScroll();

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
       Enter or Space click it, so nothing is mouse-only (the UI check agent flags anything still missed). */
    var FOC='a[href],button,input,select,textarea,summary,[tabindex]';
    function kb(){[].forEach.call(document.querySelectorAll('main *,.side *'),function(el){
      if(el.hasAttribute('data-kb')||el.closest(FOC))return;
      var cs=getComputedStyle(el),pc=el.parentElement&&getComputedStyle(el.parentElement).cursor;
      if(typeof el.onclick!=='function'&&!(cs.cursor==='pointer'&&pc!=='pointer'))return;
      el.setAttribute('data-kb','');el.setAttribute('tabindex','0');if(!el.getAttribute('role'))el.setAttribute('role','button')})}
    document.addEventListener('keydown',function(e){var el=e.target;
      if((e.key==='Enter'||e.key===' ')&&el&&el.hasAttribute&&el.hasAttribute('data-kb')){e.preventDefault();el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))}});
    var kbt;function kbLater(){clearTimeout(kbt);kbt=setTimeout(kb,150)}
    if(window.MutationObserver)new MutationObserver(kbLater).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('load',kb);kbLater();

    /* effects: spotlight, tilt, count-up, reveal */
    document.addEventListener('mousemove',function(e){var s=e.target.closest&&e.target.closest('.spot');if(s){var r=s.getBoundingClientRect();s.style.setProperty('--mx',(e.clientX-r.left)+'px');s.style.setProperty('--my',(e.clientY-r.top)+'px')}
      var c=e.target.closest&&e.target.closest('.cc');if(c){var r2=c.getBoundingClientRect(),x=(e.clientX-r2.left)/r2.width-.5,y=(e.clientY-r2.top)/r2.height-.5;c.style.transform='perspective(900px) rotateX('+(-y*5)+'deg) rotateY('+(x*7)+'deg) translateY(-4px)'}});
    document.addEventListener('mouseout',function(e){var c=e.target.closest&&e.target.closest('.cc');if(c&&!c.contains(e.relatedTarget))c.style.transform=''});
    document.querySelectorAll('[data-count]').forEach(countUp);
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:0,rootMargin:'0px 0px -8% 0px'});
    document.querySelectorAll('main > h2,main > .card,main > .callout,main > .quiz,main > .stepper,main > .grid,main > .flow,main > .wfwrap,main > p,main > section,main > .track-list').forEach(function(e){e.classList.add('rv');io.observe(e)});
  });
})();
