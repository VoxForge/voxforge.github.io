---
layout: faq_entry
title: Julius Confidence Scores
date: 2010-01-01
categories: faq
lang: en
permalink: en/faqs/:title
redirect_from: /home/docs/faq/faq/julius-confidence-scores
---

For a recognition result like this:

    ### read waveform input
    Stat: adin_file: input speechfile: seven.wav
    STAT: 12447 samples (1.56 sec.)
    STAT: ### speech analysis (waveform -> MFCC)
    ### Recognition: 1st pass (LR beam)
        ............................................................................pass1_best: <s> 5
    pass1_best_wordseq: 0 2
    pass1_best_phonemeseq: sil | f ay v
    pass1_best_score: -1867.966309
    ### Recognition: 2nd pass (RL heuristic best-first)
    STAT: 00 _default: 120 generated, 120 pushed, 14 nodes popped in 76
    sentence1: <s> 5 </s>
    wseq1: 0 2 1
    phseq1: sil | f ay v | sil**
    cmscore1: 1.000 0.316 1.000**
    **score1: -1944.799561**

tpavelka says: Julius outputs two types of scores:

    **The Viterbi score**, e.g.:

    score1: -1944.799561

This is the cummulative score of the most likeli HMM path. The Viterbi 
algorithm (decoder) is just a graph search which compares scores of all 
possible paths through the HMM and outputs the best one. The problem is, 
that a score of a path (sentence) depends on the sound files length but also 
on the sound file itself (see [this thread](../../../forums/message-boards/audio-discussions/missing-prompts) 
for more discussion). This means that Viterbi scores for different files are not 
comparable. I understand that you want some kind of measure, which can tell you 
something about whether the result found by Julius is believable or not. In 
that case, have a look at

    **The confidence score**, in your example:

    cmscore1: 1.000 0.316 1.000

Julius outputs a separate score for each word, so in your example the starting
silence has confidence score of 1.0 (i.e. 100%), the word "five" has the score
 0.316 (i.e. not that reliable) and the ending silence has again 1.0.


