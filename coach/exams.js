/* Exam outlines the study coach can follow. Weights are the official content shares of each domain (PMI, checked 2026-11-27).
   kw = topic words (English and 中文) used to match a passage of the reader's material to a domain; tasks = topic hints shown to the model;
   lessons = {track, files}: this site's lessons on that domain, offered on the strength map when the domain is weak (scripts/check-counts.mjs checks they are published).
   To add an exam: push another entry with its own versions. */
window.COACH_EXAMS=[{
 id:'pmp',name:{en:'PMP',zh:'PMP'},
 versions:[
  {id:'2026',label:{en:'Exam from July 2026',zh:'2026 年 7 月起的考试'},domains:'D26'},
  {id:'2021',label:{en:'Exam before July 2026',zh:'2026 年 7 月前的考试'},domains:'D21'}
 ]}];
(function(){
 var people={id:'people',lessons:{track:'pmp',files:['04-leading-a-team.html','05-conflict-and-negotiation.html','06-stakeholders.html','07-agile-roles.html']},name:{en:'People',zh:'人员'},kw:'conflict team leadership leader stakeholder negotiat motivat emotional intelligence training mentor coaching ground rules virtual collaborat servant empower impediment blocker agreement 冲突 团队 领导 干系人 相关方 谈判 激励 情商 培训 辅导 虚拟团队 赋能 障碍 协议 基本规则',tasks:'manage conflict; lead a team; support team performance; empower team members and stakeholders; train the team; build a team; remove impediments and blockers; negotiate agreements; collaborate with stakeholders; build shared understanding; support virtual teams; define team ground rules; mentor stakeholders; use emotional intelligence'};
 var process={id:'process',lessons:{track:'pmp',files:['08-scope-and-requirements.html','09-schedule-and-dependencies.html','10-cost-and-earned-value.html','11-estimating.html','12-managing-risk.html','13-change-control.html','14-quality-and-procurement.html','15-communication-and-handover.html']},name:{en:'Process',zh:'过程'},kw:'risk schedule budget cost scope quality procurement communication change issue closure methodology agile predictive hybrid governance resource wbs critical path artifact knowledge transfer integrat contract sprint backlog 风险 进度 预算 成本 范围 质量 采购 沟通 变更 问题 收尾 敏捷 预测 混合 治理 资源 工作分解 关键路径 知识转移 整合 合同 迭代',tasks:'execute with urgency; manage communications; assess and manage risks; engage stakeholders; plan and manage budget and resources; plan and manage schedule; plan and manage quality; plan and manage scope; integrate planning; manage changes; plan and manage procurement; manage project artifacts; choose the methodology; set up governance; manage issues; transfer knowledge; close the project or phase'};
 var biz=function(w){return {id:'biz',lessons:{track:'pmp',files:['16-value-and-benefits.html','17-compliance-and-governance.html','18-organisational-change.html','19-closing-a-project.html']},name:{en:'Business Environment',zh:'商业环境'},weight:w,kw:'compliance benefit value strategy organizational change external environment business case market regulatory law policy sustainab benefits realization governance legal 合规 效益 价值 战略 组织变革 外部环境 商业论证 市场 法规 法律 政策 可持续 收益实现',tasks:'manage compliance; evaluate and deliver benefits and value; address changes in the external business environment; support organizational change'}};
 function mk(a,b,c){var p=Object.assign({},people,{weight:a}),q=Object.assign({},process,{weight:b});return [p,q,biz(c)]}
 window.COACH_DOMAINS={D26:mk(33,41,26),D21:mk(42,50,8)};
 window.COACH_EXAMS.forEach(function(e){e.versions.forEach(function(v){v.domains=window.COACH_DOMAINS[v.domains]})});
})();
