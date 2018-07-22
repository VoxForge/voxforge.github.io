---
layout: default
title: Acoustic Model Creation
redirect_from: /home/docs/acoustic-model-creation
---

Acoustic Model Creation
=======================

Speech Recognition Engine Files 
--------------------------------

Speech Recognition engines require two types of files to recognize speech.  They require an **Acoustic Model**, which is created by taking audio recordings of speech, and their transcriptions, and 'compiling' them into a statistical representations of the sounds that make up each word.  They also require a **Language Model** or **Grammar** file.  A Language Model is a file containing the probabilities of sequences of words.  A Grammar is a much smaller file containing sets of predefined combinations of words.  Language Models are used for dictation applications, whereas Grammars are used in [Desktop Command and Control] or [Telephony IVR] type applications.

Acoustic Models 
----------------

Audio can be encoded at different [Sampling Rates] (i.e. samples per second - the most common being: 8kHz, 16kHz, 32kHz, 44.1kHz, 48kHz and 96kHz), and different [Bits per Sample][Sampling Rates] (the most common being: 8-bits, 16-bits or 32-bits).   Speech Recognition engines work best if the Acoustic Model they use was trained with speech audio which was recorded at the same Sampling Rate/Bits per Sample as the speech being recognized. 

### Telephony 

For Telephony, the limiting factor is the bandwidth at which speech can be transmitted.  For example, your standard land-line telephone only has a bandwidth of 64kbps at a sampling rate of 8kHz and 8-bits per sample (8000 samples per second \* 8-bits per sample = 64000bps = 64kpbs).  Therefore, for Telephony based speech recognition, you need Acoustic Models trained with 8kHz/8-bit speech audio files. 

For Voice over IP ("VoIP"), the [codec] used usually determines the sampling rate/bits per sample of speech transmission.  If you use a codec with a higher sampling rate/bits per sample for speech transmission (to improve the sound quality), then your Acoustic Model must be trained with audio data that matches that sampling rate/bits per sample.  In the specific case of the Asterisk PBX system, audio is upsampled internally to 8kHz/16-bits regardless of the codec sampling/bits per sample.  Therefore, Asterisk needs an Acoustic Model trained with 8kHz/16-bit audio data.

### Desktop 

For speech recognition on your PC, the limiting factor is your sound card.  Most sound cards today can record  at sampling rates of between 16kHz-48khz of audio, with bit rates of 8 to 16-bits per sample, and playback at up to 98kHz.

As a general rule, a Speech Recognition Engine works better with Acoustic Models trained with speech audio data recorded at higher sampling rates/bits per sample.  But using audio with too high a sampling rate/bits per sample can slow your recognition engine down.  You need a balance. Thus for desktop speech recognition, the current standard is Acoustic Models trained with speech audio data recorded at sampling rates of 16kHz/16bits per sample.

You can still use Acoutic Models trained at 8 kHz for desktop applications, but you generally need at least twice (and usually more ...) the audio data to get comparable recognition results of Acoustic Models trained at 16kHz. 

Additional information can be found at the following link:

[How Speech Recognition Works ]

 


Unless otherwise indicated, © 2006-2017 VoxForge; Legal: [Terms and Conditions]

  [Desktop Command and Control]: /home/docs/faq/faq/what-is-a-desktop-command-and-control-application
  [Telephony IVR]: /home/docs/faq/faq/what-is-telephony-ivr
  [Sampling Rates]: /home/docs/faq/faq/what-are-sampling-rate-and-bits-per-sample
  [codec]: /home/docs/faq/faq/what-is-a-codec
  [How Speech Recognition Works ]: http://project.uet.itgo.com/speech.htm
  [Sampling rate and Nyquist frequency]: /home/docs/acoustic-model-creation/comments/sampling-rate-and-nyquist-frequency#uLlmNV_c82azVazrg_CdUw
  [SPEECH and LANGUAGE PROCESSING]: http://www.cs.colorado.edu/%7Emartin/slp2.html
  [Daniel Jurafsky]: http://www.stanford.edu/%7Ejurafsky
  [James H. Marti]: http://www.cs.colorado.edu/%7Emartin/
  [Terms and Conditions]: http://www.voxforge.org/home/about/legal
