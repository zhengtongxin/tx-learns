/* "Related lessons" card at the end of a lesson. Loaded by site.js with its own ?v= version.
   Reads assets/related.json (built by scripts/search-index.mjs, a few KB), and only when the reader
   scrolls near the end of the lesson, so it is never on the first-paint path. Nothing is sent anywhere. */
(function(){
  var me=document.currentScript;if(!me)return;
  var ROOT=me.src.replace(/assets\/search\.js.*$/,''),URL_=me.src.replace(/search\.js.*$/,'related.json');
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function span(en,zh){return '<span class="en">'+esc(en)+'</span><span class="zh">'+esc(zh)+'</span>'}
  function row(r){return '<li><a href="'+ROOT+r[0]+'">'+span(r[1],r[2])+'</a><small>'+span(r[3],r[4])+'</small></li>'}
  function css(){var s=document.createElement('style');s.textContent='.rel ul{list-style:none;margin:.6em 0 0;padding:0}.rel li{padding:7px 0;border-top:1px solid var(--line)}.rel li small{display:block;color:var(--mut)}';document.head.appendChild(s)}
  function load(pg){
    fetch(URL_).then(function(r){return r.ok?r.json():Promise.reject()}).then(function(j){
      var rel=j[location.pathname.split('/').slice(-2).join('/')];
      if(!rel||!rel.length||document.querySelector('.rel'))return;
      var a=document.createElement('aside');a.className='card rel';a.setAttribute('aria-label','Related lessons · 相关的课');
      a.innerHTML='<b class="lbl">'+span('Related lessons','相关的课')+'</b><ul>'+rel.map(row).join('')+'</ul>';
      css();pg.parentNode.insertBefore(a,pg)}).catch(function(){})}
  function ready(f){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',f);else f()}
  ready(function(){var pg=document.querySelector('main .pager');if(!pg)return;
    if(!('IntersectionObserver' in window))return load(pg);
    var io=new IntersectionObserver(function(e){if(e[0].isIntersecting){io.disconnect();load(pg)}},{rootMargin:'600px 0px'});io.observe(pg)});
})();
