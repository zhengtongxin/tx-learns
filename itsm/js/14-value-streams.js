document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 predict($('p1'),{"q": {"en": "In the example, where is most of the delay?", "zh": "在上面的例子里，延误主要在哪里？"}, "opts": [{"k": "a", "en": "Waiting for approval", "zh": "等待审批"}, {"k": "b", "en": "Doing the setup", "zh": "做设置"}, {"k": "c", "en": "Triage work", "zh": "分诊工作"}], "a": "a", "ex": {"en": "Two days of waiting dwarf 27 minutes of work.", "zh": "两天等待远超 27 分钟工作量。"}, "hint": {"en": "Compare waiting with working.", "zh": "比较等待和工作的时间。"}});
});
