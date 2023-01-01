---
title: "Advent of Code Day #3 - RocketLang Edition"
date: 2022-12-03T08:00:23+01:00
tags: ["aoc"]
---

The riddle on day three was a bit difficult for RocketLang as a few features were missing.

Each elve has a backpack with multiple items and the first task was to split the backpack in two halves and identify which char is duplicated.

The given backpacks like like so (each line is one backpack):

```
vJrwpWtwJgWrhcsFMMfFFhFp
jqHRNqRjqzjGDLGLrsFMfFZSrLrFZsSL
PmmdzqPrVvPwwTWBwg
wMqvLMZHhHMvwLHjbvcjnnSBnvTQFn
ttgJtRGJQctTZtZT
CrZsJsPPZsGzwwsLwLmpwMDw
```

Splitting the backpacks was rather simple as RocketLang does support ranged indices.

```js
fh = rucksack[:rucksack.size()/2]
sh = rucksack[rucksack.size()/2:]
```

As RocketLang did not support any `.include?` for strings I ended up using a nested loop:

``js

```