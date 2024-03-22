---
title: "Advent of Code Day #1 - RocketLang Edition"
date: 2022-12-01T08:00:23+01:00
tags: ["aoc"]
---

This years Advent of Code is a little special because I use my own language [RocketLang](https://rocket-lang.org/) to solve the puzzles.
I'll probably explain this in a seperate post at some point so lets have a look at the first puzzle of the year:

## Problem

The task is to calculate the amount of calories they are carrying. For example:

```
1000
2000
3000

4000

5000
6000

7000
8000
9000

10000
```

This shows us 5 elves with different amount of items (with different calories each).

## Solution
### Part 1

Part 1 is to detect the elve  which carries the most calories. I did think a little bit ahead and though that maybe the number of the elve (eg. the second elve has XY calories) might be important in part 2 and created a more complicated approach using a map instead of an array which looks like this:

```js
input = IO.open("./input").lines()
 
count = 0
elves = {0: 0}
 
foreach item in input
  if (item == "")
    count = count + 1
    elves[count] = 0
  end
 
  elves[count] = elves[count] + item.plz_i()
end
 
puts("Part 1: %d".format(elves.values().sort()[-1]))
```

It iterates over each line, sums up the calories and bumps the count on each empty line.
At the end I only take the values of that map (as an array), sort it to get the maximum easily and return the last value which is the sum
of all calories the elve with the most calories is carrying.

### Part 2

Unfortunataly (or luckily?) part 2 does not require us to get any data from a specific elve - so we do not really use our map.

But instead we need to get the sum of the calories of the three elves with the most calories.
Luckily this quite simple as we already have our sorted array se we can just go ahead and sum up the last 3 values like so:

```js
sum = 0
foreach item in elves.values().sort()[-3:]
  sum = sum + item
end
 
puts("Part 2: %d".format(sum))
```

This solves part 2 and we're done for today.

## Conclusion

> I try to add a conclusion to every day with the thoughs about RocketLang I had whilst solving the puzzle.

For solving these kinds of puzzles it would be pretty neat to have a small helper method, similiar to Ruby, which allows summing up the values of an array directly. I already [opened an issue for that](https://github.com/Flipez/rocket-lang/issues/158)

## Code

{{< emgithub user="flipez" repo="advent-of-code" file="2022/day-1/complete.rl" metadata="true" >}}
