---
title: "Advent of Code Day #2"
date: 2020-12-02T07:24:23+01:00
tags: ["aoc"]
---

In day 2 you were given a set of rules to be parsed first. The looked like this:

```
1-3 a: abcde
1-3 b: cdefg
2-9 c: ccccccccc
```

Each line contains two numbers, a character and a password

## Part 1

In part 1 you have to check if the given character appears at least and at most times given by the numbers.
Each password that matches this behavior is considered valid.

{{< emgithub user="flipez" repo="advent-of-code" file="2020/day-2/part_1.rb" metadata="true" >}}

## Part 2

In part 2 you need to check if the given character is on *one* of the two given positions indicated by the numbers.
{{< emgithub user="flipez" repo="advent-of-code" file="2020/day-2/part_2.rb" metadata="true" >}}