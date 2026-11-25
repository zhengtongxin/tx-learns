// Local, free search over the lessons. No dependencies, no network, no model download.
// Used by the agents (scripts/rag.mjs: "what do our lessons already say?").
//   Language: a lesson holds both EN and 中文, so one index serves both. English words are lowercased, stop words
//   dropped and lightly stemmed; 中文 is split into overlapping two-character pieces. A small list of concept
//   groups (SYN) lets a query in one language find a lesson that names the idea in the other.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadTracks } from './lib.mjs';

const STOP = new Set('a an and are as at be but by can do does for from has have how i if in into is it its me my no not of on or our so than that the their then there these this to up use was we what when where which who why will with you your'.split(' '));

// Concept groups: any word in a group also counts as every other word in it (EN and 中文 together).
export const SYN = [
  'rag retrieval retrieve retriever embedding embeddings vector chunk chunks 检索 向量 嵌入 分块',
  'eval evals evaluation evaluate judge benchmark scoring metric metrics 评估 评测 评委 基准 指标',
  'trace tracing observability logging log 追踪 日志 可观测',
  'tool tools function calling 工具 函数调用',
  'memory remember state 记忆 状态',
  'agent agents agentic 智能体',
  'guardrail guardrails safety policy 护栏 安全 策略',
  'fine-tune finetune finetuning lora quantisation quantization 微调 量化',
  'deploy deployment production serverless container docker terraform 部署 上线 容器',
  'mcp protocol server 协议',
  'cost price pricing token tokens 成本 价格',
  'prompt prompts 提示词',
  'workflow graph langgraph 工作流 图',
  'multi-agent crew crews swarm handoff 多智能体 交接',
];

export function terms(text) {
  const out = [];
  const t = String(text || '').toLowerCase();
  for (const w of t.match(/[a-z][a-z0-9_.+-]*[a-z0-9]|[a-z]/g) || []) {
    if (w.length < 2 || STOP.has(w)) continue;
    out.push(w.replace(/(ing|ed|es|s)$/, m => (w.length - m.length >= 4 ? '' : m)));
  }
  for (const run of t.match(/[一-鿿]+/g) || []) {
    if (run.length === 1) out.push(run);
    for (let i = 0; i < run.length - 1; i++) out.push(run.slice(i, i + 2));
  }
  return out;
}

const synOf = (() => {
  const m = new Map();
  for (const g of SYN) {
    const ws = g.split(' ');
    for (const w of ws) for (const x of terms(w)) m.set(x, [...new Set([...(m.get(x) || []), ...ws.flatMap(terms)])]);
  }
  return m;
})();
export const expand = ts => [...new Set(ts.flatMap(x => [x, ...(synOf.get(x) || [])]))];

// The visible text of a lesson page: no scripts, styles or tags.
export function pageText(html) {
  return html.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

// Every published lesson: { id: 'track/file', track, file, topic, title: {en,zh}, text, tf: {term: count} }
export function lessonDocs(root) {
  const docs = [];
  for (const t of loadTracks(root)) for (const w of t.T.topics) for (const it of w.items) {
    if (!it.file) continue;
    let html = '';
    try { html = readFileSync(join(root, t.dir, it.file), 'utf8'); } catch { continue; }
    const text = pageText(html);
    const tf = {};
    for (const x of terms(`${it.title.en} ${it.title.en} ${it.title.zh} ${it.title.zh} ${w.title.en} ${w.title.zh} ${text}`)) tf[x] = (tf[x] || 0) + 1;
    // Concept features: how much each concept group (SYN) is talked about, so lessons on one idea sit together whatever their story.
    SYN.forEach((g, i) => { const n = g.split(' ').flatMap(terms).reduce((a, x) => a + (tf[x] || 0), 0); if (n) tf['@' + i] = n * 4; });
    docs.push({ id: `${t.dir}/${it.file}`, track: t.dir, file: it.file, topic: w.title, title: it.title, text, tf });
  }
  return docs;
}

// BM25 over an array of { id, tf }.
export function makeSearcher(docs) {
  const N = docs.length || 1, df = {};
  let total = 0;
  for (const d of docs) { d.len = Object.values(d.tf).reduce((a, b) => a + b, 0); total += d.len; for (const k of Object.keys(d.tf)) df[k] = (df[k] || 0) + 1; }
  const avg = total / N || 1, k1 = 1.4, b = 0.75;
  const idf = x => Math.log(1 + (N - (df[x] || 0) + 0.5) / ((df[x] || 0) + 0.5));
  return {
    idf, search(query, k = 5) {
      const q = terms(query), qx = expand(q);
      const rows = docs.map(d => {
        let s = 0;
        for (const x of qx) { const f = d.tf[x]; if (f) s += (q.includes(x) ? 1 : 0.5) * idf(x) * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.len / avg)); }
        return { d, s };
      }).filter(r => r.s > 0).sort((a, b) => b.s - a.s);
      return rows.slice(0, k);
    },
  };
}

// Related lessons: cosine of tf-idf vectors, same-language-neutral.
export function related(docs, n = 3) {
  const s = makeSearcher(docs);
  const vec = d => { const v = {}; let norm = 0; for (const [k, f] of Object.entries(d.tf)) { const w = (1 + Math.log(f)) * s.idf(k); v[k] = w; norm += w * w; } return { v, norm: Math.sqrt(norm) || 1 }; };
  const V = docs.map(vec);
  return Object.fromEntries(docs.map((d, i) => {
    const sc = docs.map((o, j) => {
      if (i === j) return [j, -1];
      let dot = 0; for (const [k, w] of Object.entries(V[i].v)) if (V[j].v[k]) dot += w * V[j].v[k];
      return [j, dot / (V[i].norm * V[j].norm) + (o.track === d.track ? 0.01 : 0)];
    }).sort((a, b) => b[1] - a[1]).filter(x => x[1] > 0.05);
    // Top matches, but the last slot goes to the best lesson from another track, so a reader can see the same idea told in a different setting.
    const pick = sc.slice(0, n - 1), other = sc.slice(n - 1).find(x => docs[x[0]].track !== d.track) || sc[n - 1];
    if (other) pick.push(other);
    return [d.id, pick.map(x => docs[x[0]].id)];
  }));
}
