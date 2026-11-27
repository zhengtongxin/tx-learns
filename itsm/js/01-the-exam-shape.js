document.addEventListener('DOMContentLoaded',function(){
 var $=TX2.$,game=TX2.game,predict=TX2.predict;TX2.init();
 predict($('p1'),{"q": {"en": "How many marks do you need to pass a 40-question exam at 65%?", "zh": "40 题的考试，65% 及格线需要多少分？"}, "opts": [{"k": "a", "en": "26", "zh": "26"}, {"k": "b", "en": "28", "zh": "28"}, {"k": "c", "en": "24", "zh": "24"}], "a": "a", "ex": {"en": "65% of 40 is 26.", "zh": "40 的 65% 是 26。"}, "hint": {"en": "Multiply 40 by 0.65.", "zh": "用 40 乘以 0.65。"}});
 predict($('p2'),{"q": {"en": "Which section carries the most marks?", "zh": "哪一部分分值最高？"}, "opts": [{"k": "a", "en": "Key terms", "zh": "关键术语"}, {"k": "b", "en": "The value system", "zh": "价值系统"}, {"k": "c", "en": "Four dimensions", "zh": "四个维度"}], "a": "b", "ex": {"en": "The value system is about 40%, so the practices and principles deserve the most study time.", "zh": "价值系统约占 40%，实践和指导原则最值得花时间。"}, "hint": {"en": "Look at the weights above.", "zh": "看上面的占比表。"}});
});
