---
title: "Advent of Code Day #4"
date: 2020-12-04T07:24:23+01:00
tags: ["aoc"]
---

In day 4 we need to deal with passports (yay!) and check if they are valid for given criterias.
The passworts do have multiple fields (`key:value`) and are divided by a newline.

```
ecl:gry pid:860033327 eyr:2020 hcl:#fffffd
byr:1937 iyr:2017 cid:147 hgt:183cm

iyr:2013 ecl:amb cid:350 eyr:2023 pid:028048884
hcl:#cfa07d byr:1929

hcl:#ae17e1 iyr:2013
eyr:2024
ecl:brn pid:760753108 byr:1931
hgt:179cm
```

The fields are given and expected like so:

```
byr (Birth Year)
iyr (Issue Year)
eyr (Expiration Year)
hgt (Height)
hcl (Hair Color)
ecl (Eye Color)
pid (Passport ID)
cid (Country ID)
```

Splitting them into "passports" is as easy as it gets.

## Part 1

In part 1 our job is to check only if all the given fields are there for each passport ignoring their values.
Since it is christmas and the *North Pole Credentials* do not submit a Country ID for their documents we are allowed to *ignore cid*.

To solve this I made a list with the required fields and loop over them and check if at least one field in the password has it - otherwise it is invalid.

{{< emgithub user="flipez" repo="advent-of-code" file="2020/day-4/part_1.rb" metadata="true" >}}

## Part 2

Now it is a bit more complex. We have given criterias for our fields and additionally to the required fields check we need to check if the criterias match.

I converted the criterias into ruby ranges and regular expressions (see line 14 to 22). Then I looped over every field as in part 1 but now I split them into key/value pairs. After that, based on my criterias, I either matched them against the regex or the range.

{{< emgithub user="flipez" repo="advent-of-code" file="2020/day-4/part_2.rb" metadata="true" >}}