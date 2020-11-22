---
title: "Emgithub shortcode"
date: 2020-11-22T17:50:46+01:00
tags: ["hugo", "hugo-shortcode"]
---
During the upcoming AoC I want to post some small posts about each little puzzle.
In preparation of this I was looking for a way in hugo to include and highlight source code from GitHub without
copying it to each article.

I discovered [emgithub](https://emgithub.com) and wrote a little shortcode for it and you can find it [here](https://github.com/flipez/hugo-shortcodes/blob/master/emgithub.html).

{{< emgithub user="flipez" repo="hugo-shortcodes" file="README.md" metadata=true >}}