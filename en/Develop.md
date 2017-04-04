---
layout: page
title: Develop
menu: Dev
weight: 8
ref: develop
lang: en
permalink: /en/dev
redirect_from: "/home/dev"
---
### Acoustic Model Creation Tutorials:

Create Acoustic Model by 'compiling' your speech audio files into a [Speaker Dependent Acoustic Model](/faq/what-is-a-speaker-dependent-or-independent-acoustic-model), or adapt the VoxForge [_Speaker Independent_ Acoustic Model](/faq/what-is-a-speaker-dependent-or-independent-acoustic-model) to better recognize your voice.

#### Linux

*   Create speaker dependant acoustic model from scratch & run simple dialog manager:
    *   [Recipe - using a script](/en/recipe)
    *   [Tutorial - step-by-step](/en/tutorial) (with explanations)[  
        ](http://www.voxforge.org/home/dev/acousticmodels/linux/create/htkjulius/tutorial)
*   To improve the recognition rates of the acoustic model you created in the how-to or tutorial, you need to train your acoustic model with many more hours of your speech.  A short-cut approach is to 'adapt' the VoxForge s_peaker independent a_coustic model to the characteristics of your voice:
    *   [Adapt Pre-existing Acoustic Model to Your Voice](http://www.voxforge.org/home/dev/acousticmodels/linux/adapt/htkjulius)
*   How to tell how much more speech is needed to improve an acoustic model?  You need to test it:[  
    ](http://www.voxforge.org/home/dev/acousticmodels/linux/test/htk--julius)
    *   [Testing Your Acoustic Model with HTK & Julius ](http://www.voxforge.org/home/dev/acousticmodels/linux/test/htk--julius)


## Other Dev Pages

*   <span class="verticalMenu">[Convert Audio to MP3 and Compare Results with Original Wav](dev/mp3-compare)</span>
*   <span class="verticalMenu">[How to Manually Segment an Audio Book (Draft)](dev/mansegaudio)</span>
*   <span class="verticalMenu">[Automated Audio Segmentation Using Forced Alignment (Draft)](dev/autoaudioseg)</span>
*   <span class="verticalMenu">[Documentation](docs)</span>




