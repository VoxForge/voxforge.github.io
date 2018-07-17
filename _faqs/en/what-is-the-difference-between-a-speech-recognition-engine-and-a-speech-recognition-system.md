---
layout: faq_entry
title: What is the difference between a Speech Recognition Engine and a Speech Recognition System 
date: 2010-01-01
categories: faq
lang: en
permalink: en/faqs/:title
redirect_from: /home/docs/en/faqs/faq/what-is-the-difference-between-a-speech-recognition-engine-and-a-speech-recognition-system
---
**Speech Recognition Engines** ("SRE"s) are made up of the following components:

**Language Model** or **Grammar** - Language Models contain a
very large list of words
and their probability of occurrence in a given sequence.They are
used in dictation applications.  Grammars are a much smaller file
containing sets of predefined combinations of words.  Grammars are used in 
[IVR] or desktop [Command and Control] applications.   Each word in a Language 
Model or Grammar has an associated list of [phonemes] (which correspond to the 
distinct sounds that make up a word).

**Acoustic Model** - Contains a statistical
representation of the distinct sounds that make up each word in the Language
Model or Grammar.  Each distinct sound corresponds to a [phoneme].

**Decoder**-
Software program that takes the sounds spoken by a user and searches
the Acoustic Model for the equivalent sounds.  When a match is made, the Decoder 
determines the [phoneme] corresponding to the sound.  It keeps track of the
matching [phonemes] until it reaches a pause in the users speech.  It then
searches the Language Model or Grammar file for the equivalent series
of phonemes.  If a match is made it returns the text of
the corresponding word or phrase to the calling program.

A **Speech Recognition System**('SRS')  on a desktop computer does what a
typical user of speech recognition would expect it to do: you speak a
command into your microphone and the computer does something, or you
dictate something to the computer and it types it out the
corresponding text on your screen.

An SRS typically includes a Speech Recognition Engine and a [Dialog Manager] (and may or may not
include a Text to Speech Engine). 



[IVR]: /en/faqs/what-is-telephony-ivr
[Command and Control]: /en/faqs/what-is-a-desktop-command-and-control-application
[phonemes]: http://en.wikipedia.org/wiki/Phoneme
[phoneme]: http://en.wikipedia.org/wiki/Phoneme
[Dialog Manager]: /en/faqs/what-is-a-dialog-manager


