document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 predict($('p2'),{q:{en:'Why is the planner given structured output?',zh:'为什么给规划员用结构化输出？'},opts:[{k:'a',en:'So it can search the web',zh:'这样它才能联网搜索'},{k:'b',en:'So your code gets a list of searches it can loop over',zh:'这样代码拿到的是能逐项处理的搜索列表'},{k:'c',en:'To make it cheaper',zh:'为了更便宜'}],a:'b',ex:{en:'A typed list is data. A paragraph would have to be read like a human.',zh:'有类型的列表就是数据。一段话得像人一样去读。'},hint:{en:'What does the next step need to do with the plan?',zh:'下一步要拿这份计划做什么？'}});
 game($('g1'),[
  {en:'Thinks up 3 searches worth doing',zh:'想出值得做的 3 个搜索',a:'p',ex:{en:'Planning is its only job. It never searches.',zh:'规划是它唯一的工作，它从不搜索。'},hint:{en:'Who works before any search happens?',zh:'谁在任何搜索之前工作？'}},
  {en:'Looks up one search term on the web',zh:'在网上查一个搜索词',a:'s',ex:{en:'It holds the hosted web search tool.',zh:'托管的联网搜索工具在它手上。'},hint:{en:'Who has WebSearchTool?',zh:'谁带着 WebSearchTool？'}},
  {en:'Turns all the summaries into one report',zh:'把所有摘要写成一份报告',a:'w',ex:{en:'It gets the question plus every summary.',zh:'它拿到问题和全部摘要。'},hint:{en:'Who sees all the summaries together?',zh:'谁能同时看到所有摘要？'}},
  {en:'Makes a neat HTML email and sends it',zh:'做成整洁的 HTML 邮件并发送',a:'m',ex:{en:'It holds the send_report tool.',zh:'send_report 工具在它手上。'},hint:{en:'Who delivers the result?',zh:'谁负责送达结果？'}}],[{k:'p',en:'Planner',zh:'规划员'},{k:'s',en:'Searcher',zh:'搜索员'},{k:'w',en:'Writer',zh:'写作员'},{k:'m',en:'Mailroom',zh:'收发室'}],{en:'Job',zh:'工作'});
});
