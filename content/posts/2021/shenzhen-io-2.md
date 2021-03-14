---
title: "Shenzhen I/O #2 - Control Signal Amplifier"
date: 2021-03-14
tags: ["shenzhen-io"]
---

Today we're doing another Shenzhen I/O puzzle.

As this is the second task, the puzzle is again quite simple.
As a reminder, we do have the following command documentation:

![Docs](/images/shenzhen-io-0.png)

The task is to amplify a signal.
As we can see from the verification tab the output has to be higher than the input - twice as high, to be precise.

![Puzzle 2](/images/shenzhen-io-2.png)

This seems fairly easy, we just need to multiply the input signal with `2` and output the result.
If we take a closer look on our commands we can find a `mul` operator which can take one argument.
It is documented with the following:

> mul R/I
> Multiply the value of the first operand by the value of the acc register and store the result in the acc register.

So this makes things a bit more complicated. We can not simply take register `p0` and multiply it with integer `2`.
The argument for `mul` always gets multiplied with the register `acc`.
Therefore we need to do a little extra step and save `2` into `acc`.
After that we can multiply register `p0` with integer `2` saved in `acc` which automatically stores the result again in `acc`.
Now we need to move the result from `acc` to register `p1` - our output - and sleep for one second.

```nasm
  mov 2 acc
  mul p0
  mov acc p1
  slp 1
```

With these four lines we pass all the tests easily.

| Production Cost | Power Usage | Lines of Code |
|-----------------|-------------|---------------|
|3|240|4