/* Lessons grouped by concept. Titles are our own; never copy a source's outline, project names or numbering. */
window.TRACK={id:'ai-production',title:{en:'AI Production',zh:'AI 上线实战'},topics:[
 {n:1,title:{en:"From laptop to live",zh:"从笔记本到上线"},items:[
  {k:'f',file:'01-what-production-means-ship-first.html',title:{en:"What production means: ship something first",zh:"“生产环境”是什么：先上线一个东西"}},
  {k:'c',file:'02-product-in-two-halves.html',title:{en:"A product in two halves: front end and API",zh:"产品的两半：前端和 API"}},
  {k:'c',file:'03-streaming-answers-to-the-browser.html',title:{en:"Streaming answers to the browser",zh:"把回答一点点流到浏览器"}}]},
 {n:2,title:{en:"Users, sign-in and money",zh:"用户、登录与收费"},items:[
  {k:'c',file:'04-sign-in-you-do-not-write.html',title:{en:"Sign-in you do not write yourself",zh:"不用自己写的登录"}},
  {k:'c',file:'05-subscriptions-and-feature-gates.html',title:{en:"Subscriptions and gating a feature",zh:"订阅与功能开关"}},
  {k:'p',file:'06-consultation-notes-assistant.html',title:{en:"Project: a consultation notes assistant",zh:"项目：问诊记录助手"}}]},
 {n:3,title:{en:"Containers and a safe cloud account",zh:"容器与安全的云账号"},items:[
  {k:'f',file:'07-safe-cloud-account.html',title:{en:"A safe cloud account: roots, users and budget alarms",zh:"安全的云账号：根用户、普通用户与预算警报"}},
  {k:'c',file:'08-containers-in-plain-words.html',title:{en:"Containers in plain words",zh:"容器的大白话"}},
  {k:'c',file:'09-serverless-pay-when-it-runs.html',title:{en:"Serverless: paying only when it runs",zh:"无服务器：用了才付钱"}},
  {k:'p',file:'10-product-in-a-container-on-serverless.html',title:{en:"Project: the product in a container on serverless",zh:"项目：把产品装进容器放到无服务器上"}}]},
 {n:4,title:{en:"An AI twin with memory",zh:"有记忆的 AI 分身"},items:[
  {k:'f',file:'11-models-forget-memory-is-your-job.html',title:{en:"Models forget: why memory is your job",zh:"模型会忘：记忆得你来管"}},
  {k:'c',file:'12-twin-personality-and-facts.html',title:{en:"Giving the twin a personality and facts",zh:"给分身性格和事实"}},
  {k:'c',file:'13-where-memory-lives-in-the-cloud.html',title:{en:"Where memory lives in the cloud",zh:"记忆在云里放哪"}},
  {k:'p',file:'14-digital-twin-live.html',title:{en:"Project: a digital twin live on the internet",zh:"项目：上线到互联网的数字分身"}}]},
 {n:5,title:{en:"Managed models in the cloud",zh:"云上的托管模型"},items:[
  {k:'c',title:{en:"A managed model service versus a vendor API",zh:"托管模型服务 vs 厂商 API"}},
  {k:'c',title:{en:"Picking a model by cost and speed, then watching it",zh:"按成本和速度选模型，然后盯着它"}}]},
 {n:6,title:{en:"Infrastructure as code",zh:"基础设施即代码"},items:[
  {k:'f',title:{en:"Why clicking in a console does not scale",zh:"为什么在控制台点点点不够用"}},
  {k:'c',title:{en:"State, workspaces and three environments",zh:"状态、工作区与三套环境"}},
  {k:'c',title:{en:"Deploy scripts and a clean teardown",zh:"部署脚本与干净的拆除"}}]},
 {n:7,title:{en:"Automatic deploys",zh:"自动部署"},items:[
  {k:'c',title:{en:"Shared state and stale locks",zh:"共享状态与过期的锁"}},
  {k:'c',title:{en:"Push to deploy with GitHub Actions",zh:"用 GitHub Actions 一推就部署"}},
  {k:'p',title:{en:"Project: dev, test and prod from one push",zh:"项目：一次推送，开发、测试、生产三套环境"}}]},
 {n:8,title:{en:"Agents as a managed service",zh:"托管的智能体服务"},items:[
  {k:'c',title:{en:"An agent runtime in minutes",zh:"几分钟上线一个智能体运行时"}},
  {k:'c',title:{en:"Tools and a planning loop",zh:"工具与规划循环"}},
  {k:'p',title:{en:"Project: a planning agent that checks itself",zh:"项目：会自我验证的规划智能体"}}]}
]};
