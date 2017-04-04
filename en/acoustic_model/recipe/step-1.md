---
layout: default
title: how-to step-1
ref: how-to-step-1
lang: en
permalink: /recipe/step-1
redirect_from: /home/dev/acousticmodels/linux/create/htkjulius/how-to/data-prep/step-1

---

Step 1 - Task Grammar
---------------------

Create a new folder in your home directory and call it 'voxforge'.  Create another directory within this folder and call it 'howto'.

Create a file called [sample.grammar] in your 'voxforge/howto' folder, and add the following:

<pre>
S : NS_B SENT NS_E
SENT: CALL_V NAME_N
SENT: DIAL_V DIGIT
</pre>

Still in your 'voxforge/howto' folder, create a file called [sample.voca], and add the following:

<pre>
 % NS_B
 &lt;s&gt;        sil
 % NS_E
 &lt;/s&gt;        sil
 % CALL_V
 PHONE        f ow n
 CALL        k ao l
 % DIAL_V
 DIAL        d ay ah l
 % NAME_N
 STEVE        s t iy v
 YOUNG        y ah ng
 % DIGIT
 FIVE        f ay v
 FOUR        f ao r
 NINE        n ay n
 EIGHT        ey t
 OH        ow
 ONE        w ah n
 SEVEN        s eh v ah n
 SIX        s ih k s
 THREE        th r iy
 TWO        t uw
 ZERO        z iy r ow
</pre>

For details on the file formats, see Step 1 - Task Grammar, in the Tutorial.

Compiling your Grammar
----------------------

Download Julia [mkdfa.jl] grammar compiler script to your 'voxforge/bin' folder to compile your grammar files (sample.grammar and sample.voca) as follows:

<span style="font-size: x-small;"> (note you only need to execute the "cd" command if you are not already in the "auto" directory)</span>

<pre>
$ cd voxforge/auto 
$ julia ../bin/mkdfa.jl sample
sample.grammar has 3 rules
sample.voca    has 6 categories and 18 words
---
Now parsing grammar file
Now modifying grammar to minimize states[-1]
Now parsing vocabulary file
Now making nondeterministic finite automaton[6/6]
Now making deterministic finite automaton[6/6]
Now making triplet list[6/6]
---
generated: sample.dfa sample.term sample.dict

</pre>

This creates 3 files: [sample.dfa], [sample.term] and [sample.dict] .

  [sample.grammar]: https://github.com/VoxForge/develop/raw/master/howto/sample.grammar
  [sample.voca]: https://github.com/VoxForge/develop/raw/master/howto/sample.voca
  [mkdfa.jl]: https://raw.githubusercontent.com/VoxForge/develop/master/bin/mkdfa.jl
  [sample.dfa]: https://raw.githubusercontent.com/VoxForge/develop/master/howto/sample.dfa
  [sample.term]: https://raw.githubusercontent.com/VoxForge/develop/master/howto/sample.term
  [sample.dict]: https://raw.githubusercontent.com/VoxForge/develop/master/howto/sample.dict

