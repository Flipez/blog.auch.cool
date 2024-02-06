---
title: "Advent of Code Day #5"
date: 2020-12-05T07:24:23+01:00
tags: ["aoc"]
---

Day five is all about the airplane seating.
One seat it represented by something like this: `FBFBBFFRLR`.
The first eight characters are for the row, the last three for the seat.

## Part 1

We need to find the highest seat id to solve the first part.

The seat id is calculated with: `row-id * 8 + column`.

For the rows you start with a range of `0` to `127`.

* `F` means use the first half
* `B` means use the last half

With this in mind you need to iterate over the first eight characters to get your seat.

I here missed completely that you could simply convert this into binary.
This would have been a much nicer solution.

I again used `#each_slice` here and splitted the range into halfes and continue with the first or last one.
For the seats it is the very same with a smaller range (`0 to 7`) and slightly different characters.

* `L` means use the first half
* `R` means use the last half

When we have all the ids we can simply select the highest one.

## Part 2

Luckily we store all the ids in one array.
We now know that some seats in the front and some in the back are always free.
We also know that one seat in this range is missing.

A nice trick to find this seat is to generate a full range from the first to the last seat,
sum them and compare them to the sum of our set with the missing seat.
With this we easily find the missing id.

{{< emgithub user="flipez" repo="advent-of-code" file="2020/day-5/complete.rb" metadata="true" >}}