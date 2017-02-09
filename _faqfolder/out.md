---
layout: faq_entry
title: test3
date: 2010-11-14
categories: faq
lang: en
redirect_from: git/test_voxforge
---
** User: ** gothrog   
** Date: ** 11/14/2010 3:10 pm   

** Views: ** 2562   
** Rating: ** 13 Rate [  ]   

## Expanding Dictionary

All,  

  

I wanted to expand the amount of words that I'm using. I currently have the
tutorial words being recognized to a certain degree.

  

What would be the best way to expand the vocabulary of my local repository? Do
I just create a new "prompts" file with more sentences and then get a
recording of those words? Is there .wavs or .mfcc files that I can just take
from?

  

I'm kind of confused in how to utilize the VoxForge Consortium properly. I can
see people recording the same lines over and over again with different
dialects and posting them. Do you need me to do this too? Is that recording
enough to extrapolate to a larger repository?

  

Mike  

\--- (Edited on 11/4/2010 3:10 pm [GMT-0500] by gothrog) ---



** User: ** kmaclean   
** Date: ** 11/4/2010 4:56 pm   

** Views: ** 111   
** Rating: ** 13 Rate [  ]   

---

## Re: Expanding Dictionary

&gt; What would be the best way to expand the vocabulary of my local
repository?

Depends what you want to do: [ speaker dependant vs speaker independent
](http://www.voxforge.org/home/docs/faq/faq/what-is-a-speaker-dependent-or-
independent-acoustic-model) speech recognition? [ This CMU SPhinx pag
](http://cmusphinx.sourceforge.net/wiki/tutorialam) e has lots of excellent
info that is applicable to all speech recognition engines:

** When you need to train **

You want to create an acoustic model for new language/dialect

OR you need specialized model for small vocabulary application

AND you have plenty of data to train on:

1 hour of recording for command and control for single speaker

5 hour of recordings of 200 speakers for command and control for many speakers

10 hours of recordings for single speaker dictation

50 hours of recordings of 200 speakers for many speakers dictation

AND you have knowledge on phonetic structure of the language

AND you have time to train the model and optimize parameters (1 month)

** When you don't need to train **

You need to improve accuracy - do acoustic model adaptation instead

You don't have enough data - do acoustic model adaptation instead

You don't have enough time

You don't have enough experience

&gt;Do I just create a new "prompts" file with more sentences and then get a

&gt;recording of those words?

Yes you can do this, but you need to make sure that you add any the
pronunciations for words that are not in you pronunciation dictionary

&gt; Is there .wavs or .mfcc files that I can just take from?

There's lots of audio here: [
http://www.repository.voxforge1.org/downloads/SpeechCorpus/Trunk/Audio/Main/16kHz_16bit/
](http://www.repository.voxforge1.org/downloads/SpeechCorpus/Trunk/Audio/Main/16kHz_16bit/)

&gt;I'm kind of confused in how to utilize the VoxForge Consortium properly.

VoxFOrge is just an Open Source project, not a consortium...

&gt;Do you need me to do this too?

Depends what you are trying to do... see above

\--- (Edited on 11/4/2010 5:56 pm [GMT-0400] by kmaclean) ---



** User: ** gothrog   
** Date: ** 11/5/2010 1:58 pm   

** Views: ** 1248   
** Rating: ** 13 Rate [  ]   

## Re: Expanding Dictionary

Thanks Ken.

Mike

\--- (Edited on 11/5/2010 1:58 pm [GMT-0500] by gothrog) ---

