---
title: "Advent of Code Day #6"
date: 2020-12-06T07:24:23+01:00
tags: ["aoc"]
---

Day 6 is again pretty nice to solve with Ruby. Today it is all about customs declaration.

We again have different groups seperated by a newline containing multiple lines with characters.
Each line represents a person and each character represents a different question answered with "yes".

```
abc

a
b
c

ab
ac

a
a
a
a
```

In this example we do have four groups of people.
The first group only has one person which answered three questions.
The second group as three people which answered three (different) questions.
The third group has two people, they both answered question `a` and then two different questions.
In the fourth group every of the four people answered one (the same) question.

## Part 1

First we need to find the sum of all questions answered and need to remove duplicate answers within a group.

Since it does not matter who ansered within the group we can simply join every line together.
We can do this simply by use `.split("\n").join` which results in a single string per group.
Then we use `#char` to again split the line into an array with one character per element.
This prepares for unsing `#uniq` to sort out the duplicated and after that we `#count` them.

The solution for the first part it then only the sum of all these counts.

## Part 2

In the second part it comes in handy that we already used arrays.

Our tasks here is to only count the answers for questions that **every person** on the group has answered.

Therefore we again split the group into people and their line into an array with only characters in it.
Then we can use the `&` operator in Ruby with will return only intersections of the arrays.

> For example `['a', 'b'] & ['a', 'c']` will return `['a']`

After that we just count all the elements in all arrays which are left.
In the final solution we have one (pretty understandable) line per part left.

{{< emgithub user="flipez" repo="advent-of-code" file="2020/day-6/complete.rb" metadata="true" >}}