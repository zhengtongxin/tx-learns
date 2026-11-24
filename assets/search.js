/* Learner search + "Related lessons". Loaded by site.js. Reads assets/search-index.json (built by scripts/search-index.mjs).
   Everything runs in the browser, nothing is sent anywhere. English words and 中文 pieces are matched together, and a
   small list of concept groups lets a query in one language find a lesson that names the idea in the other. */
(function(){
  var me=document.currentScript;if(!me)return;
  var ROOT=me.src.replace(/assets\/search\.js.*$/,''),IDX=me.src.replace(/search\.js.*$/,'search-index.json'),ix=null;
  var STOP={};'a an and are as at be but by can do does for from has have how i if in into is it its me my no not of on or our so than that the their then there these this to up use was we what when where which who why will with you your'.split(' ').forEach(function(w){STOP[w]=1});
  function terms(s){var o=[],t=String(s||'').toLowerCase(),m,re=/[a-z][a-z0-9_.+-]*[a-z0-9]|[a-z]/g,w;
    while((m=re.exec(t))){w=m[0];if(w.length<2||STOP[w])continue;var r=w.replace(/(ing|ed|es|s)$/,function(x){return w.length-x.length>=4?'':x});o.push(r)}
    (t.match(/[一-鿿]+/g)||[]).forEach(function(run){if(run.length===1)o.push(run);for(var i=0;i<run.length-1;i++)o.push(run.slice(i,i+2))});return o}
  function pre(j){var syn={};j.syn.forEach(function(g){var ws=g.split(' '),all=[];ws.forEach(function(w){all=all.concat(terms(w))});all.forEach(function(x){syn[x]=(syn[x]||[]).concat(all)})});
    var df={},N=j.docs.length||1,tot=0;j.docs.forEach(function(d){d.len=0;for(var k in d.tf){d.len+=d.tf[k];df[k]=(df[k]||0)+1}tot+=d.len});
    j.syn2=syn;j.df=df;j.avg=tot/N||1;j.byId={};j.docs.forEach(function(d){j.byId[d.id]=d});return j}
  function search(q,n){var j=ix,tq=terms(q),seen={},qx=[];tq.forEach(function(x){[x].concat(j.syn2[x]||[]).forEach(function(y){if(!seen[y]){seen[y]=1;qx.push(y)}})});
    var N=j.docs.length,k1=1.4,b=.75,rows=[];
    j.docs.forEach(function(d){var s=0;qx.forEach(function(x){var f=d.tf[x];if(!f)return;var n0=j.df[x]||0,idf=Math.log(1+(N-n0+.5)/(n0+.5));s+=(tq.indexOf(x)>-1?1:.5)*idf*(f*(k1+1))/(f+k1*(1-b+b*d.len/j.avg))});if(s>0)rows.push([d,s])});
    rows.sort(function(a,c){return c[1]-a[1]});return rows.slice(0,n||8).map(function(r){return r[0]})}
  function span(o){return '<span class="en">'+o.en+'</span><span class="zh">'+o.zh+'</span>'}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function row(d){return '<li><a href="'+ROOT+d.id+'">'+span({en:esc(d.t.en),zh:esc(d.t.zh)})+'</a><small>'+span({en:esc(d.tp.en),zh:esc(d.tp.zh)})+'</small></li>'}
  function css(){var s=document.createElement('style');s.textContent='.srch{margin:1.2em 0}.srch input{width:100%;box-sizing:border-box;padding:12px 16px;font:inherit;color:var(--fg);background:var(--glass);border:1px solid var(--line);border-radius:16px}.srch input:focus-visible{outline:2px solid var(--acc);outline-offset:2px}.srch ul,.rel ul{list-style:none;margin:.6em 0 0;padding:0}.srch li,.rel li{padding:7px 0;border-top:1px solid var(--line)}.srch li small,.rel li small{display:block;color:var(--mut)}.srch .none{color:var(--mut);margin:.6em 0 0}';document.head.appendChild(s)}
  function ready(f){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',f);else f()}
  function box(){
    var me2=location.pathname.split('/').slice(-2).join('/'),rel=ix.related[me2],pg=document.querySelector('main .pager');
    if(rel&&rel.length&&pg&&!document.querySelector('.rel')){var a=document.createElement('aside');a.className='card rel';a.setAttribute('aria-label','Related lessons · 相关的课');
      a.innerHTML='<b class="lbl">'+span({en:'Related lessons',zh:'相关的课'})+'</b><ul>'+rel.map(function(id){return ix.byId[id]?row(ix.byId[id]):''}).join('')+'</ul>';pg.parentNode.insertBefore(a,pg)}}
  ready(function(){if(!document.getElementById('topics')&&!document.querySelector('main .pager'))return;
    fetch(IDX).then(function(r){return r.ok?r.json():Promise.reject()}).then(function(j){ix=pre(j);css();box()}).catch(function(){})});
})();
