# Curating and cleaning a dataset (my notes)

File name (fixed, do not change; other lessons are being written in parallel): ai-engineer/18-curating-and-cleaning-a-dataset.html. Do not touch any other lesson file. If lessons.js already lists a planned item for this concept, add file:'18-curating-and-cleaning-a-dataset.html' to that item only.

Topic: Predicting with data. Planned item: "Curating and cleaning a dataset". Concept lesson, ~20 min.

## The project in one line
Predict how much a second-hand gadget costs from its text description alone. I use a big pile of product listings scraped from a public store catalogue (title, description, features, details, price). Capstone-style: the next lessons all use the same data.

## Steps
1. Load a published dataset from the Hugging Face hub with `load_dataset`. First look at one record, the most expensive record, how many have a price at all. (Many don't.)
2. Keep items with a usable price (I kept between $1 and $1000) and enough text (a minimum number of characters). Throw away the rest. Cheap items and huge outliers distort learning.
3. Put the survivors in a small class, `Item`, with a clean `summary` text and a `price`. Clean text: strip junk characters, boilerplate like "Manufacturer / ASIN / Date first available" and long part numbers (any word with a long digit run adds nothing but noise); cut each description to a fixed length.
4. Plot distributions: text length, price. Prices are skewed: lots of cheap items, a long tail of expensive ones.
5. Balance: sample so that expensive and common categories both appear, otherwise the model just learns "the answer is about 30 dollars".
6. Split into train, validation and test sets (hundreds of thousands, then thousands, then ~2,000). Never peek at test until the end.
7. Push the finished dataset to the hub so later notebooks and cloud machines can load it in one line. Keep a "lite" version for quick runs.

## What I got wrong
Spent time on models before looking at the data. The first plot showed a few absurd prices I would otherwise have trained on.

## Try it yourself
1. Load any small public dataset and print its most extreme row.
2. Write a cleaning function and count how many rows it removes.
3. Plot a histogram of the target before and after filtering.

## Takeaways
Data work comes first and is most of the job. Filter, clean, balance, split, save. Keep a small version for fast tests.
