---
layout: faq_entry
title:  What is an Acoustic Model? 
categories: faq
lang: en
date: 2010-01-01
redirect_from: "/home/docs/faq/faq/what-is-an-acoustic-model"
---
An acoustic model is a file that contains statistical representations of each of the distinct sounds that makes up a word.  Each of these statistical representations is assigned a label called a [phoneme](http://en.wikipedia.org/wiki/Phoneme). The English language has about 40 distinct sounds that are useful for speech recognition, and thus we have 40 different [phonemes](http://en.wikipedia.org/wiki/Phoneme).

An acoustic model is created by taking a large database of speech (called a [speech corpus](//aq/what-is-a-speech-corpus-or-speech-corpora)) and using special training algorithms to create statistical representations for each phoneme in a language.  These statistical representations are called Hidden Markov Models ("HMM"s).  Each [phoneme](http://en.wikipedia.org/wiki/Phoneme) has its own HMM.

For example, if the system is set up with a simple [grammar](/faq/what-is-a-grammar) file to recognize the word "house" (whose phonemes are: "hh aw s"), here are the (simplified) steps that the speech recognition engine might take:

*   The [speech decoder](/faq/what-is-a-speech-decoder) listens for the distinct sounds spoken by a user and then looks for a matching HMM in the Acoustic Model.  In our example, each of the phonemes in the word house has its own HMM:
    *   hh ![](hmm.jpg)
    *   aw![](hmm.jpg)
    *   s ![](hmm.jpg)

*   When it finds a matching HMM in the acoustic model, the decoder takes note of the phoneme. The decoder keeps track of the matching phonemes until it reaches a pause in the users speech.

*   When a pause is reached, the decoder looks up the matching series of phonemes it heard (i.e. "hh aw s") in its Pronunciation Dictionary to determine which word was spoken.  In our example, one of the entries in the pronunciation dictionary is HOUSE: 
    *   ...

    *   HOUSAND         [HOUSAND]       hh aw s ax n d
    *   HOUSDEN         [HOUSDEN]       hh aw s d ax n
    *   **HOUSE           [HOUSE]         hh aw s**
    *   HOUSE'S         [HOUSE'S]       hh aw s ix z
    *   HOUSEAL         [HOUSEAL]       hh aw s ax l
    *   HOUSEBOAT       [HOUSEBOAT]     hh aw s b ow t
    *   ...

*   The decoder then looks in the Grammar file for a matching word or phrase.  Since our grammar in this example only contains one word ("HOUSE"), it returns the word "HOUSE" to the calling program.

This get a little more complicated when you start using [Language Models](/faq/what-is-a-language-model) (which contain the probabilities of a large number of different word sequences), but the basic approach is the same.
