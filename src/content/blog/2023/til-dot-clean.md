---
title: "TIL: 'dot_clean' to remove macOS specific files"
date: 2023-04-07T09:00:23+01:00
image: https://picsum.photos/seed/picsum/1400/500
tags: ["til", "macos"]
---
When switching between multiple systems including macOS you may have notices thoses strange looking files starting with `._`.

They regularely break Switch firmware upgrades and might be in the way during other filesystem operations as well.

There are multiple solutions out there in the wild including removing them or moving them away using `rsync`. The most convinient way on macOS is using the `dot_clean` command which is shipped with macOS by default.

It merges the metadata with the normal files and removes all the dotfiles. After that you can just copy you stuff around as usual. See the [man page](https://www.unix.com/man-page/osx/1/dot_clean/) for more details.