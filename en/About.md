---
layout: page
title: About
weight: 10
menu: About
ref: about
lang: en
permalink: /en/about
redirect_from: /home/about
---

VoxForge was set up to collect transcribed speech for use in [Open Source](http://en.wikipedia.org/wiki/Open_source) [Speech Recognition Engines](http://en.wikipedia.org/wiki/Speech_Recognition) ("SRE"s) such as such as [](http://www.ece.msstate.edu/research/isip/projects/speech/index.html)[ISIP](http://www.ece.msstate.edu/research/isip/projects/speech/index.html), [HTK](http://htk.eng.cam.ac.uk/), [Julius](http://julius.sourceforge.jp/en_index.php?q=en/index.html) and [Sphinx](http://cmusphinx.sourceforge.net/html/cmusphinx.php).  We will categorize and make available all submitted audio files (also called a 'Speech Corpus") and Acoustic Models in [GPL](/home/docs/faq/faq/what-is-gpl) format. 


## Why do we need GPL Transcribed Speech?


In order to recognize speech, Speech Recognition Engines require two types of files: the first, called an Acoustic Model, is created by taking a very large number of transcribed speech recordings (called a Speech Corpus) and 'compiling' them into statistical representations of the sounds that make up each word. The second is a Grammar or Language Model.  A Grammar is a relatively small file containing sets of predefined combinations of words. A Language Model is a much larger file containing the probabilities of certain sequences of words.

## Problems with Current Approaches:

### Acoustic Models are Closed-Source 

Most Acoustic Models used by 'Open Source' Speech Recognition engines are 'closed source'.  They do not give you access to the speech audio (the 'source') used to create the Acoustic Model.  If they do give you access, there are usually licensing restrictions on the distribution of the 'source' (i.e. you can only use it for personal or research purposes). 

The reason for this is because there is no free Speech Corpus in a form that can readily be used, or that is large enough, to create good quality Acoustic Models for Speech Recognition Engines.   Although there are a few instances of small FOSS speech corpora that could be used to create acoustic models, the vast majority of corpora (especially large corpora best suited to building good acoustic models) must be purchased under restrictive licenses.

As a result, Open Source projects that want to distribute their code freely must purchase restrictively licensed Speech Copora that limit distribution of the 'source' speech audio, but allow them to distribute any Acoustic Models they create.

VoxForge will address this problem by providing all Acoustic Models and their 'source' (i.e. transcribed speech audio) in [GPL](/home/docs/faq/faq/what-is-gpl) licensing format - which requires that the distribution of derivative works include access to the source used to create that work.

### Restrictive Licensing Creates an Access Barrier to Potential Contributors

Every project that wants to build an acoustic model using a corpus with restrictive licensing must purchase their own copy.  This is difficult for FOSS projects, which usually have no revenue.  If a project does purchase such resources, the license restrictions will require them to keep the resources behind some kind of access barrier restricted to official project members.   This takes away freedom and flexibility from end users and shrinks the pool of potential contributors to the project. 

### Acoustic Models are not Interchangeable 

Most Open Source Speech Recognition Engines ("SRE"s) come with an Acoustic Model.  However, these Acoustic Models are not interchangeable with other open source Speech Recognition engines.  The way to address this problem is to provide the 'source code' for the Acoustic Models (i.e. the [Speech Corpora](/home/docs/faq/faq/what-is-a-speech-corpus-or-speech-corpora) used to create the Acoustic Models), and permit users to 'compile' it into Acoustic Models that can be used with the Open Source SRE of their choice.  

VoxForge hopes to address this problem by creating a repository of 'source' speech audio and transcriptions, and by creating Acoustic Models for each of the main Open Source Speech Recognition Engines (such as [Sphinx](http://cmusphinx.sourceforge.net/html/cmusphinx.php), [Julius](http://julius.sourceforge.jp/en_index.php?q=en/index.html), [HTK](http://htk.eng.cam.ac.uk/) and [ISIP](http://www.cavs.msstate.edu/hse/ies/projects/speech/)) .

### Open Source Acoustic Models Need to be Improved 

Current Acoustic Models used by Open Source Speech Recognition Engines are not at the level of quality of Commercial Speech Recognition Engines. 

VoxForge provides a central location that can collect [GPL](/home/docs/faq/faq/what-is-gpl) speech audio and transcriptions.  As more speech audio data is collected, better Acoustic Models can be created, to the point that someday they will be comparable to Commercial Speech Recognition.

### No Open Source Dictation Software

Most Open Source SREs are designed for command and control and IVR telephony type applications (e.g. [Sphinx](http://cmusphinx.sourceforge.net/html/cmusphinx.php), [HTK](http://htk.eng.cam.ac.uk/) and [ISIP](http://www.cavs.msstate.edu/hse/ies/projects/speech/)).  The [Julius](http://julius.sourceforge.jp/en_index.php?q=en/index.html) Speech Recognition Engine was designed for dictation applications, however the [Julius](http://julius.sourceforge.jp/en_index.php?q=en/index.html) distribution only includes _Japanese_ Acoustic Models.  But since it uses Acoustic Models trained using the [HTK](http://htk.eng.cam.ac.uk/) toolkit, it can also use Acoustic Models trained in other languages - like English.  We just need hundreds of hours of transcribed speech audio to create English dictation Acoustic Models.  This same audio data might also be used to permit the other open source Speech Recognition Engines to work in dictation applications.

Although the current focus of VoxForge is on Speech Recognition for IVR telephony applications or Command and Control applications on the desktop, when the amount of audio data collected reaches a certain threshold, this data can then be used in the creation of Acoustic Models for Open Source _Dictation_ Applications.

## Why GPL?

### Unrestricted Licenses for Speech Corpora will not be Effective

We believe that making [Speech Corpora](/home/docs/faq/faq/what-is-a-speech-corpus-or-speech-corpora) available using an unrestrictive, [BSD](http://www.opensource.org/licenses/bsd-license.php) style license will not help the Open Source Community in this particular case.  A [BSD](http://www.opensource.org/licenses/bsd-license.php) style license permits users to distribute derivative works without having to contribute the source of those modifications back to the community.  In our opinion, the Open Source Speech Recognition community does not have the required threshold of users to create a self-sustaining community using a [BSD](http://www.opensource.org/licenses/bsd-license.php) style license.  If there was a larger community, then there would be a greater likelihood that a self-sustaining group would give back to the community, even if not required to do so using a [BSD](http://www.opensource.org/licenses/bsd-license.php) style license.

[GPL](/home/docs/faq/faq/what-is-gpl) licensing ensures that any contributions made by the Open Source Community to VoxForge will benefit the community.  This is because the distribution of any derivative works based on the VoxForge [Speech Corpora](/home/docs/faq/faq/what-is-a-speech-corpus-or-speech-corpora) must make the source (i.e. the transcribed speech audio) available to the community.
