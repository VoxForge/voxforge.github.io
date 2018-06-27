---
layout: faq_entry
title: What is the difference between a phone and a phoneme?
date: 2010-01-01
categories: faq
lang: en
permalink: en/faqs/:title
redirect_from: /home/docs/faq/faq/what-is-the-difference-between-a-phone-and-a-phoneme
---
A [**phoneme**](http://en.wikipedia.org/wiki/Phoneme) is the smallest structural unit that distinguishes meaning in a language.  Phonemes are not the physical segments themselves, but are cognitive abstractions or categorizations of them.

On the other hand, [**phones**](http://en.wikipedia.org/wiki/Phone_(phonetics)) refer to the instances of phonemes in the actual utterances - i.e. the physical segments.

For example (from this [article](http://www.halcode.com/archives/2008/05/24/articulatory-speech-synthesis/)):

> the words "madder" and "matter" obviously are composed of distinct _phonemes_; however, in american english, both words are pronounced almost identically, which means that their _phones_ are the same, or at least very close in the acoustic domain.

---------------------------------

**User:** kmaclean
**Date:** 1/1/2010 11:58 am

From [SPEECH and LANGUAGE PROCESSING](http://www.cs.colorado.edu/%7Emartin/slp2.html) **By  [Daniel Jurafsky](http://www.stanford.edu/%7Ejurafsky):**

re: phones:

> The study of the pronunciation of words is part of the field of phonetics, the study of the speech sounds used in the languages of the world. We model the pronunciation of a word as a string of symbols which represent _**phones**_ or segments. A phone is a speech sound; phones are represented with phonetic symbols that bear some resemblance to a letter in an alphabetic language like English.

re: phonemes:

> If each word was pronounced with a fixed string of phones, each of which was pronounced the same in all contexts and by all speakers, the speech recognition and speech synthesis tasks would be really easy. Alas, the realization of words and phones varies massively depending on many factors. [...]
> 
> How can we model and predict this extensive variation? One useful tool is the assumption that what is mentally represented in the speaker's mind are _abstract categories_ rather than phones in all their gory phonetic detail.  For example consider the different pronunciations of [t] in the words tunafish and starfish. The [t] of tunafish is aspirated. [...] a [t] following an initial [s] is unaspirated; [...] There are other contextual variants of [t]. For example, when [t] occurs between two vowels, particularly when the first is stressed, it is often pronounced as a tap. [like the "t" in the word "buttercup"...]
> 
> In both linguistics and in speech processing, we use abstract classes to capture the similarity among all these [t]s. The simplest abstract class is called the _**phoneme**_, and its different surface realizations in different contexts are called _**allophones**_. [...]


