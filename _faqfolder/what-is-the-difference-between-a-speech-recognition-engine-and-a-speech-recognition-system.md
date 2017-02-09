---
layout: faq_entry
title: What is the difference between a Speech Recognition Engine and a Speech Recognition System 
date: 2010-01-01
categories: faq
lang: en
redirect_from: /home/docs/faq/faq/what-is-the-difference-between-a-speech-recognition-engine-and-a-speech-recognition-system
---
<p><strong>Speech Recognition Engines</strong> ("SRE"s) are made up of the following components:<br>
</p>
<ul>
<li><strong>Language Model</strong> or <strong>Grammar </strong>- Language Models contain a
very large list of words
and their probability of occurrence in a given sequence.&nbsp; They are
used in dictation applications.&nbsp; Grammars are a much smaller file
containing sets of predefined
combinations of words.&nbsp; Grammars<strong> </strong>are used in <a href="/faq/what-is-telephony-ivr">IVR</a> or desktop <a href="/faq/what-is-a-desktop-command-and-control-application">Command and Control</a>
applications.&nbsp;&nbsp; Each word in a Language
Model or Grammar has an associated list of <a href="http://en.wikipedia.org/wiki/Phoneme">phonemes</a> (which correspond to the distinct sounds that make up a word).</li>
<li><strong>Acoustic Model</strong> - Contains a statistical
representation of the distinct sounds that make up each word in the Language
Model or Grammar.&nbsp; Each distinct sound corresponds to a <a href="http://en.wikipedia.org/wiki/Phoneme">phoneme</a>.<a href="http://en.wikipedia.org/wiki/Phoneme"><br>
    </a></li>
<li><strong>Decoder </strong>-
Software program that takes the sounds spoken by a user and searches
the
Acoustic Model for the equivalent sounds.&nbsp; When a match is made, the Decoder determines the <a href="http://en.wikipedia.org/wiki/Phoneme">phoneme</a> corresponding to the sound.&nbsp; It keeps track of the
matching <a href="http://en.wikipedia.org/wiki/Phoneme">phonemes</a>
until it reaches a pause in the users speech.&nbsp; It then
searches the Language Model or Grammar file for the equivalent series
of phonemes.&nbsp; If a match is made it returns the text of
the corresponding word or phrase to the calling program.&nbsp; </li>
</ul>
<p>A <strong>Speech Recognition System </strong>('SRS')  on a desktop computer does what a
typical user of speech recognition would expect it to do: you speak a
command into your microphone and the computer does something, or you
dictate something to the computer and it types it out the
corresponding text on your screen.&nbsp; </p>
<p>An SRS typically includes a
Speech Recognition Engine and a <a href="/faq/what-is-a-dialog-manager">Dialog
Manager</a> (and may or may not
include a Text to Speech Engine). 
</p>
