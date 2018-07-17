---
layout: faq_entry
title: What is a Language Model?
date: 2010-01-01
categories: faq
lang: en
permalink: en/faqs/:title
redirect_from: /home/docs/faq/faq/what-is-a-language-model
---
A **Statistical** **Language** **Model** is a file used by a Speech Recognition 
Engine to recognize speech.  It contains a large list of words and their 
probability of occurrence.   It is used in dictation applications.

---------------------------------

**User:** Rudnicky
**Date:** 1/7/2010 10:15 am

Language models are used to constrain search in a decoder by limiting the 
number of possible words that need to be considered at any one point in the 
search. The consequence is faster execution and higher accuracy.

Language models constrain search either absolutely (by enumerating some small 
subset of possible expansions) or probabilistically (by computing a likelihood 
for each possible successor word). The former will usually have an associated 
grammar this is compiled down into a graph, the latter will be trained from a
corpus. 

Statistical language models (SLMs) are good for free-form input, such as 
dictation or spontaneous speech, where it's not practical or possible to a
priori specify all possible legal word sequences.

Trigram SLMs are probably the most common ones used in ASR and represent a
good balance between complexity and robust estimation. A trigram model encodes 
the probability of a word (w3) given its immediate two-word history, 
ie p(w3 ! w1 w2). In practice trigam models can be "backed-off" to bigram 
and unigram models, allowing the decoder to emit any possible word sequence 
(provided that the acoustic and lexical evidence is there).

