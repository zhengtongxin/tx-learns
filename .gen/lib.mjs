import fs from 'fs';
export const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
// code: text between « and » is a changed line (.chg), the rest is dimmed
export function code(src){
  const re=/([«»])/g;let cur=false,last=0,m;const segs=[];
  while((m=re.exec(src))){segs.push([cur,src.slice(last,m.index)]);cur=m[1]==='«';last=m.index+1}
  segs.push([cur,src.slice(last)]);
  return '<div class="codebox">'+segs.filter(s=>s[1]).map(([c,t])=>`<span class="${c?'chg':'dim'}">${esc(t)}</span>`).join('')+'</div>';
}
const paras=(a,l)=>a.map((t,i)=>`<p class="${l}"style="margin:0${i<a.length-1?' 0 8px':''}">${t}</p>`).join('');
export function step(n,t,learn,src,id,extra=''){
  return `<h2><span class="en">Step ${n} · ${t.en}</span><span class="zh">第 ${n} 步 · ${t.zh}</span></h2>
<div class="teach"><b class="lbl"><span class="en">Learn</span><span class="zh">先学</span></b>${paras(learn.en,'en')}${paras(learn.zh,'zh')}</div>
${src?code(src):''}${extra}
${id?`<div class="try" id="${id}"></div>`:''}
`;
}
const j=o=>JSON.stringify(o);
export function pred(id,q,opts,a,ex,hint,out){
  return ` predict($('${id}'),{q:${j(q)},opts:${j(opts.map((o,i)=>({k:'abc'[i],en:o[0],zh:o[1]})))},a:'${a}'${out?',out:'+j(out):''},ex:${j(ex)},hint:${j(hint)}});`;
}
export function page(c){
  const url=`https://tx-learns.vercel.app/agentic-ai/${c.file}`;
  const t=`${c.title.en} | TX Learns`;
  const tag=c.project?{en:'Multi-agent teams · Project',zh:'多智能体团队 · 项目'}:{en:'Multi-agent teams · Lesson 1',zh:'多智能体团队 · 第 1 课'};
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t}</title>
<meta name="description" content="${c.hero.en}"><meta property="og:title" content="${t}"><meta property="og:description" content="${c.hero.en}"><meta property="og:type" content="website"><meta property="og:url" content="${url}"><meta property="og:image" content="https://tx-learns.vercel.app/assets/og.png"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#0b1020">
<meta name="updated" content="2026-11-23">
<link rel="icon" href="../assets/icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="../assets/apple-touch-icon.png"><link rel="stylesheet" href="../assets/site.css"><link rel="stylesheet" href="../assets/teach.css"></head><body>
<div class="wrap"><nav class="side"></nav><main>
<div class="hero"><span class="tag"><span class="en">${tag.en}</span><span class="zh">${tag.zh}</span></span><h1><span class="en">${c.title.en}</span><span class="zh">${c.title.zh}</span></h1><p class="meta"><span class="en">${c.hero.en} · ~${c.time} min · hands-on</span><span class="zh">${c.hero.zh} · 约 ${c.time} 分钟 · 动手实践</span></p></div>
<div class="story"><b class="lbl"><span class="en">The story</span><span class="zh">故事</span></b><p class="en"style="margin:0">${c.story.en}</p>
<p class="zh"style="margin:0">${c.story.zh}</p></div>

${c.body}
<div class="callout warn"><b class="lbl"><span class="en">What I got wrong</span><span class="zh">我犯过的错</span></b><span class="en">${c.wrong.en}</span><span class="zh">${c.wrong.zh}</span></div>

<h2><span class="en">Now make it yours</span><span class="zh">现在把它变成你的</span></h2>
<div class="cl">${c.cl.map(([e,z])=>`<label><input type="checkbox"><span><span class="en">${e}</span><span class="zh">${z}</span></span></label>`).join('')}</div>
<h2><span class="en">Takeaways</span><span class="zh">要点回顾</span></h2>
<div class="card"><p class="en" style="margin:0">${c.take.map(t=>'• '+t[0]).join('<br>')}</p><p class="zh" style="margin:0">${c.take.map(t=>'• '+t[1]).join('<br>')}</p></div>

<button class="btn mark-done" style="margin-top:20px"></button>
<div class="pager"><a href="index.html"><small>All lessons · 所有课</small>Agentic AI</a><a class="next" href="../index.html"><small>Home · 首页</small>TX Learns</a></div>
</main></div>
<script src="lessons.js"></script><script src="../assets/site.js"></script><script src="../assets/teach.js"></script>
<script>
document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
${c.js}
});
</script></body></html>
`;
}
export const w=(f,c)=>fs.writeFileSync(new URL('../agentic-ai/'+f,import.meta.url),page(c));
