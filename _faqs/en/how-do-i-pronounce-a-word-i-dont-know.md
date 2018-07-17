---
layout: faq_entry
title: How do I Pronounce a Word I Don't Know?
date: 2010-01-01
categories: faq
lang: en
permalink: en/faqs/:title
redirect_from: /home/docs/faq/faq/how-do-i-pronounce-a-word-i-dont-know
---
There are a couple of approaches 

**1\. Use the [VoxForge Dictionary]:**

If you are wondering about pronunciations, the [VoxForge Dictionary] might 
provide you with some indication as to the pronunciation.  For example, 
the word "etc" shows up as follows in the dictionary:

> <pre>ETC             [ETC]           eh t s eh dx er ax
> ETCETERA        [ETCETERA]      eh t s eh dx er ax</pre>

You really don't need to know how the phonemes are pronounced in this 
particular example, because you can see that 'ETC' and 'ETCETERA' contain 
the same phonemes, and therefore should be pronounced the same.

For other words you are not sure how to pronounce, you can look at their 
component phonemes and search for similar strings of phonemes until you find 
a word you know how to pronounce. 

For example, for the word "windward", you would look it up in the dictionary 
and find:

> <pre>WINDWARD        [WINDWARD]      w ih n d w er d</pre>

You would then search for the string  "w er d" and find the word "word"

> <pre>WORD            [WORD]          w er d </pre>

So now you know you would pronounce the word windward as "wind" + "word". 

Note that this is not clearcut in all instances, because some dialects 
pronounce the "ward" in the word "windward" like the "ward" in the word 
"award", see this dictionary entry:

> <pre>AWARD           [AWARD]         ax w ao r d</pre>

Therefore, it all depends on the target users of the speech recognition system
and what their own particular dialect is.  And if we are targeting an Acoustic
Model to this particular dialect, we might add an entry to the dictionary
like this:

> <pre>WINDWARD        [WINDWARD]      w ih n d w ao r d</pre>

But in the non-native speaker case, where you might not have any idea how to 
pronounce a word, the dictionary is a good start.

**2\. Listen to Someone Else's Audio**

Another approach might be to listen to the audio from someone else's submission 
to see how they pronounce it. 

**3\. Other Resources**

*   [LibriVox English Pronunciations Guide]

*   LibriVox discussion re: [Pronunciation Resources]( mentions the following resources:

*   [http://shtooka.net/audio-base/](http://shtooka.net/audio-base/)
*   [http://netministries.org/bbasics/bbwords.htm](http://netministries.org/bbasics/bbwords.htm)
*   [http://www.loc.gov/nls/other/sayhow.html](http://www.loc.gov/nls/other/sayhow.html)
*   [http://www.rong-chang.com/namesdict/index.html](http://www.rong-chang.com/namesdict/index.html)
*   [http://www.linguatec.net/onlineservices/voice_reader](http://www.linguatec.net/onlineservices/voice_reader)
*   [http://commons.wikimedia.org/wiki/Category:English_pronunciation](http://commons.wikimedia.org/wiki/Category:English_pronunciation)


[VoxForge Dictionary]: http://www.dev.voxforge.org/projects/SpeechCorpus/browser/Trunk/Lexicon/VoxForge/VoxForgeDict
[LibriVox English Pronunciations Guide]: http://wiki.librivox.org/index.php/English_Pronunciation_Guides
[Pronunciation Resources]: http://librivox.org/forum/viewtopic.php?t=8151
