# Baselines: average, linear, forest (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-engineer/19-baselines-average-linear-forest.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'19-baselines-average-linear-forest.html' to that item only.

Topic: Predicting with data. Planned item: "Baselines: average, linear, forest". Concept lesson, ~20 min.

## Why baselines
Before using any fancy model, find out how bad a silly one is. If a fancy model can't beat "guess the average", it isn't helping.

## A shared test harness
One function `evaluate(pricer_fn, test_items)`: run every test item, compute the error in dollars, the average error, and a colour-coded scatter plot of guess vs truth (the line y=x is perfect). Also a score like R squared. All models plug into it as a function from item to number.

## The ladder I climbed
1. Random guess between 1 and 1000: terrible, a useful floor.
2. Constant: always say the training average. Better than random; this is the bar to beat.
3. Linear regression on a few hand-made features (weight, "weight unknown" flag, text length). Barely better: the information isn't in those numbers.
4. Bag of words: count the most frequent 1000-2000 words (dropping common "stop words"), feed the counts to linear regression. Now words like "stainless" or "professional" carry price signal. Big improvement.
5. Random forest on the same features (many decision trees, average their votes): better again on non-linear patterns, slower.
6. Gradient boosting (XGBoost-style) as an alternative: another strong traditional option.

## Lessons
- Each step is judged by the same metric, so progress is visible.
- Traditional ML on good features is a serious opponent for fancy models.
- Overall, errors are dominated by expensive items: a few big misses hurt the average a lot.

## What I got wrong
Compared models on different subsets of data by accident, then fixed it with one shared test set.

## Try it yourself
1. Write the evaluate function with a scatter plot.
2. Beat the constant baseline with bag-of-words plus linear regression.
3. Swap in a random forest and compare error and run time.

## Takeaways
Build the harness, then the baselines. The average is the bar. Words beat hand-made numbers. Always compare on the same test set.
