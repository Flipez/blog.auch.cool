---
title: "Advent of Code Day #3"
date: 2020-12-03T07:24:23+01:00
tags: ["aoc"]
---

In day 3 you have a ever repeating map with trees and free spaces.
You move over this map and have to count how many trees (`#`) you will hit.

## Part 1

Given is a pattern in which you move right and down.
In part 1 we start in the top left corner and always move 3 right and one down until we reach the last line.

```
..##.........##.........##.........##.........##.........##.......  --->
#...#...#..#...#...#..#...#...#..#...#...#..#...#...#..#...#...#..
.#....#..#..#....#..#..#....#..#..#....#..#..#....#..#..#....#..#.
..#.#...#.#..#.#...#.#..#.#...#.#..#.#...#.#..#.#...#.#..#.#...#.#
.#...##..#..#...##..#..#...##..#..#...##..#..#...##..#..#...##..#.
..#.##.......#.##.......#.##.......#.##.......#.##.......#.##.....  --->
.#.#.#....#.#.#.#....#.#.#.#....#.#.#.#....#.#.#.#....#.#.#.#....#
.#........#.#........#.#........#.#........#.#........#.#........#
#.##...#...#.##...#...#.##...#...#.##...#...#.##...#...#.##...#...
#...##....##...##....##...##....##...##....##...##....##...##....#
.#..#...#.#.#..#...#.#.#..#...#.#.#..#...#.#.#..#...#.#.#..#...#.#  --->
```

Since the map is repeating we need to reset the `x` position if we reach the end of the line in the given example.
Theoretical you could achieve this with a simple modulo, but I did it without because I hadn't it in mind when I was in a hurry.
The rest of part 1 is very simple looping without any suprises.

{{< emgithub user="flipez" repo="advent-of-code" file="2020/day-3/part_1.rb" metadata="true" >}}

## Part 2

In part 2 we no longer have one given slope but different ones.
Therefore we need to move over the map with every given slope and to get the result we have to multiply the trees from every slope.

The variable amount of steps to the right is easy because we only need to add this number to the `current_pos`.
I found the party with the skipped lines a bit more tricky.
In order to solve this I divided the lines in multiple slices (using Ruby's `#each_slice`) which matched the given lines to be skipped and used the first line from each line I always land in the right spot.

To get the result we now only need to use - again - `#reduce` where you can perform a mathematical operation between every element in the array. 

{{< emgithub user="flipez" repo="advent-of-code" file="2020/day-3/part_2.rb" metadata="true" >}}