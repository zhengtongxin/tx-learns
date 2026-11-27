document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 predict($('p1'),{"q": {"en": "Which statement fits best?", "zh": "哪个说法最贴切？"}, "opts": [{"k": "a", "en": "Projects deliver change; service management keeps the service valuable afterwards", "zh": "项目交付变更，服务管理让服务在之后持续有价值"}, {"k": "b", "en": "They are rivals; use only one", "zh": "它们互相对立，只能用一个"}, {"k": "c", "en": "DevOps removes the need for any control", "zh": "DevOps 让任何控制都不再需要"}], "a": "a", "ex": {"en": "The frameworks complement one another.", "zh": "这些框架是互补的。"}, "hint": {"en": "Do they compete?", "zh": "它们互相竞争吗？"}});
});
