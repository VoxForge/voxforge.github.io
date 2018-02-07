---
layout: default
title: Convert Audio to MP3 and Compare Results with Original Wav
lang: en
permalink: en/dev/mp3-compare
redirect_from: /home/dev/mp3-compare
---

Archived - because the LibriSpeech ASR Corpus uses MP3 audio.

Convert Audio to MP3
--------------------

This document outlines the results of a very preliminary test to see if compressed mp3 audio, converted to uncompressed wav audio, can be used to supplement or improve an uncompressed speech corpus.  There are many limitations to this test, but it at least provides enough information to warrant looking into this approach further.

The first conclusion is that the sample size (50 utterances) is too small.  Next the tests with Julius show (as expected) a bit of a degradation of performance by using mp3-based Acoustic Models.  The tests with HTK are a bit more confusing, since these show an improvement in performance in using mp3 based audio.  

Next steps:

-   further tests with more test utterances and a more complex grammar
-   look at adjusting recognition parameters to optimize performance (may need to use different ones for mp3-based Acoustic Models than for wav based Acoustic Models)

**1. Uncompressed Wav Files were taken from these directories in the [VoxForge Speech Corpus](http://www.voxforge1.org/downloads/SpeechCorpus/Trunk/Audio/Original/16kHz_16bit/):**

-   cmu_com_kal_ldom
-   cmu_us_awb_arctic
-   cmu_us_bdl_arctic
-   cmu_us_clb_arctic
-   cmu_us_jmk_arctic
-   cmu_us_ksp_arctic
-   cmu_us_slt_arctic
-   cmu_us_rms_arctic

If you would like to download this subset of the VoxForge Speech Corpus, please download this tarball from the VoxForge Repository:

[wav.tar.gz](http://www.repository.voxforge1.org/downloads/mp3_test/wav.tar.gz)              09-Mar-2007 00:28   811M   

**2. Converted to mp3 files: **

[mp3.tar.gz](http://www.repository.voxforge1.org/downloads/mp3_test/mp3.tar.gz)              09-Mar-2007 00:17   375M  

using this command (see the [Process_mp3.pm]({{ site.url }}/assets/Process_mp3.pm) script for details):

--- 

lame -h -b 128 /wav directory/*filename.wav* /mp3 directory/*filename.mp3 *

(the '-b' parameter specifies the bit rate, the '-h' specifies a high quality conversion) 

---

**3. Converted them back to wav files:**

[wav2.tar.gz](http://www.repository.voxforge1.org/downloads/mp3_test/wav2.tar.gz)              09-Mar-2007 00:28   794M  

Using this command:

---

sox /mp3 directory/*filename.mp3* /wav2 directory/*filename.wav *

(sox uses the file suffix and headers to determine the source and target conversion types) 

---

**4. Very preliminary test results**

DISCLAIMER: this is a _sanity test_ only</
* the speech files used for testing use a single person's voice;
 * there are only 50 audio samples in the test database (see appendix) - not enough for a good test;
 * this audio data used in this test is only a subset of the VoxForge Speech Corpus
* this test uses grammar based speech recognition - it does not use a statistical language model (see Appendix)
* The absolute performance numbers are not very helpful, what is helpful is the relative performance of the Acoustic Models (AMs) generated from mp3 audio converted to wav audio versus the AMs trained from the original wav audio

---

<pre>
**4.1 Tests on original wav files **

HTK 16kHz_16bit
---------------
  Parameters:
    word insertion penalty: 10.0
    grammar scale factor: 5.0
====================== Results Analysis =======================
  Date: Fri Mar  9 09:11:55 2007
  Ref : testref.mlf
  Rec : recout.mlf
------------------------ Overall Results --------------------------
SENT: %Correct=18.00 [H=9, S=41, N=50]
WORD: %Corr=82.01, Acc=12.17 [H=155, D=1, S=33, I=132, N=189]
===================================================================
Julian 16kHz_16bit
------------------
  Parameters:
    word insertion penalty
      first pass (-penalty1):50
      second pass (-penalty2):100.0
    transition penalty (-iwsppenalty):-55.0 (for short-term inter-word pauses between words)
====================== Results Analysis =======================
  Date: Fri Mar  9 09:11:58 2007
  Ref : testref.mlf
  Rec : julianProcessed
------------------------ Overall Results --------------------------
SENT: %Correct=36.00 [H=18, S=32, N=50]
WORD: %Corr=87.83, Acc=66.67 [H=166, D=1, S=22, I=40, N=189]
===================================================================

</pre>

Notes:
* the line starting with SENT gives the percentage of sentences that were recognized correctly, out of N sentences in total.
* the line starting with WORD gives the percentage of words that were recognized correctly, out of N words in total.  However, since HTK or Julius erroneously 'added' words that are not in the audio file (i.e. insertion errors) they usually get a lower percentage accuracy rating.
* Count definitions:
    * D - Deletion Error
    * S - Substitution Error
    * I - Insertion Error

**4.2 Tests on mp3 converted to wav files**

<pre>
HTK 16kHz_16bit
---------------
  Parameters:
    word insertion penalty: 10.0
    grammar scale factor: 5.0
====================== Results Analysis =======================
  Date: Fri Mar  9 09:13:28 2007
  Ref : testref.mlf
  Rec : recout.mlf
------------------------ Overall Results --------------------------
SENT: %Correct=42.00 [H=21, S=29, N=50]
WORD: %Corr=92.06, Acc=25.93 [H=174, D=0, S=15, I=125, N=189]
===================================================================
Julian 16kHz_16bit
------------------
  Parameters:
    word insertion penalty
      first pass (-penalty1):50
      second pass (-penalty2):100.0
    transition penalty (-iwsppenalty):-55.0 (for short-term inter-word pauses between words)
====================== Results Analysis =======================
  Date: Fri Mar  9 09:13:31 2007
  Ref : testref.mlf
  Rec : julianProcessed
------------------------ Overall Results --------------------------
SENT: %Correct=38.00 [H=19, S=31, N=50]
WORD: %Corr=83.07, Acc=57.14 [H=157, D=1, S=31, I=49, N=189]
===================================================================

</pre>

Notes:
* the line starting with SENT gives the percentage of sentences that were recognized correctly, out of N sentences in total.
* the line starting with WORD gives the percentage of words that were recognized correctly, out of N words in total
      However, since HTK or Julius erroneously 'added' words that are not in the audio file (i.e. insertion errors) they usually get a lower percentage accuracy rating.
* Count definitions:
          * D - Deletion Error
          * S - Substitution Error
          * I - Insertion Error
 

 

**Appendix**

**A. Grammars **

**A.1 HTK **

<pre>
$digit= ONE | TWO | THREE | FOUR | FIVE | SIX | SEVEN | EIGHT | NINE | OH | ZERO;
$name = [ STEVE ] YOUNG;
( &lt;s&gt; (DIAL&lt;$digit&gt; | (CALL) $name) &lt;/s&gt; )
</pre>

**A.2 Julius **

**A2.1 grammar file:**
<pre>
S : NS_B SENT NS_E
SENT: CALL_V F_NAME
SENT: CALL_V L_NAME
SENT: CALL_V F_NAME L_NAME
SENT: DIAL_V WORD_LOOP
WORD_LOOP: WORD_LOOP DIGIT
WORD_LOOP: DIGIT 
</pre>
**A2.2 voca file:**
<pre>
% NS_B
&lt;s&gt;        sil
% NS_E
&lt;/s&gt;        sil
% CALL_V
CALL        k ao l
% DIAL_V
DIAL        d ay ax l
% F_NAME
STEVE        s t iy v
% L_NAME
YOUNG        y ah ng
% DIGIT
FIVE        f ay v
FOUR       f ao r
NINE        n ay n
EIGHT        ey t
OH        ow
ONE        w ah n
SEVEN        s eh v ih n
SIX        s ih k s
THREE        th r iy
TWO        t uw
ZERO    z ih r ow
</pre>
**B. Prompts**
<pre>
test1 PHONE YOUNG
test2 CALL YOUNG
test3 CALL YOUNG
test4 DIAL ONE FIVE FOUR FOUR FOUR
test5 PHONE YOUNG
test6 CALL YOUNG
test7 PHONE STEVE YOUNG
test8 CALL YOUNG
test9 PHONE STEVE YOUNG
test10 DIAL NINE
test11 DIAL THREE SIX NINE ZERO THREE FIVE 
test12 DIAL NINE SEVEN SIX FOUR FOUR
test13 PHONE STEVE YOUNG
test14 DIAL EIGHT SIX FOUR SEVEN TWO FIVE FIVE
test15 DIAL OH NINE EIGHT FOUR EIGHT ZERO NINE NINE
test16 CALL YOUNG
test17 DIAL SEVEN ONE TWO EIGHT SIX FOUR THREE
test18 DIAL SIX
test19 DIAL NINE SEVEN SEVEN
test20 PHONE YOUNG
test21 PHONE STEVE YOUNG
test22 PHONE YOUNG
test23 CALL YOUNG
test24 PHONE STEVE YOUNG
test25 PHONE YOUNG
test26 PHONE YOUNG
test27 DIAL SIX TWO NINE ONE EIGHT FOUR EIGHT
test28 DIAL ZERO SEVEN ONE THREE SEVEN FIVE FOUR
test29 PHONE YOUNG
test30 DIAL SEVEN ZERO FIVE TWO NINE
test31 DIAL SIX OH ZERO SEVEN FOUR ONE ONE
test32 DIAL ONE
test33 PHONE YOUNG
test34 DIAL FIVE FOUR ONE FOUR THREE OH TWO
test35 CALL YOUNG
test36 CALL YOUNG
test37 DIAL SEVEN ONE
test38 CALL STEVE YOUNG
test39 CALL YOUNG
test40 PHONE YOUNG
test41 DIAL SEVEN FOUR TWO FIVE ONE NINE 
test42 PHONE STEVE YOUNG
test43 CALL STEVE YOUNG
test44 CALL YOUNG
test45 PHONE YOUNG
test46 CALL YOUNG
test47 DIAL SIX THREE SEVEN EIGHT ONE OH
test48 DIAL OH SEVEN FIVE
test49 CALL YOUNG
test50 DIAL ONE SIX NINE FIVE TWO TWO EIGHT
</pre> 


### Comments ###

### interesting

By yifan - 12/17/2010: Of course we need more test utterances to draw any reasonable conclusion, and probably longer utterances. Another way to measure the differences is to get the log-likelihood score of each utterance. Basically can give you an idea of which the model trained from these audio source fits better with test data. Normally we don't want any compression on our data, by heart, I would think the orignal wav will perform well. However, there is a possibility the compression helps to enhance the speech.

*Convert Audio to MP3 and Compare Results with Original Wav*

By: tpavelka - 4/7/2009:

While browsing the VoxForge site I have come across this experiment:

http://www.voxforge.org/home/dev/mp3-compare

The results were kind of surprising, because there is no difference in the files that I could hear, so I figured that it should be the same for MFCC parametrisation (which can be viewed as an extremelly lossy compression and thus should throw away any differences between wav and mp3).

To get some insight I have generated some spectrograms using HCopy's filterbank analysis (which can be viewed as part of the MFCC process) to see if there is any difference. Although they are some visible differences, the most important finding is that the mp3 copression (or maybe the encoding back into wavs, I do not know which one) throws away parts of the recordings, namely the end parts. This part may be up to half a second long and may affect not just the ending silence, but in some cases (com_4311.wav) even the speech. Could this be the reason for the difference in the test?

The spectrograms can be downloaded here, the included Perl scripts may not work under Unix(due to the use of some Windows only commands).



*Re: Convert Audio to MP3 and Compare Results with Original Wav *

By: kmaclean - 4/9/2009:

Hi tpavelka,

Thanks for this analysis!

I would be really great if we could use speech files recorded with lossy audio codecs (like MP3, OGG...) for the creation of acoustic models - Librivox has so much speech like this, it could keep us busy for years...

>Although they are some visible differences, the most important finding is
>that the mp3 copression (or maybe the encoding back into wavs, I do not
>know which one) throws away parts of the recordings, namely the end
>parts. This part may be up to half a second long and may affect not just
>the ending silence, but in some cases (com_4311.wav) even the
>speech. Could this be the reason for the difference in the test?

Could this be more a result of the lame tool cutting silence off at the end of the recording to save space in the resulting mp3?

Ken


*Re: Convert Audio to MP3 and Compare Results with Original Wav*

By: visitor - 4/9/2009:

Hi, it's either lame or sox or their respective settings. Unfortunatelly I do not heve either of these installed so I cannot easilly check. For the spectrograms I just downloaded your converted files. It might be the cutting off of silence but apparently it does not work very well, see the file com_4311.wav.

Tomas



  [Process_mp3.pm]: http://www.dev.voxforge.org/projects/Main/browser/Trunk/Scripts/Testing_scripts/mp3_testing/Process_mp3.pm
  [Convert Audio to MP3 and Compare Results with Original Wav]: /home/dev/mp3-compare/comments/convert-audio-to-mp3-and-compare-results-with-original-wav#HvVsC7eAkcTm_O-0rXqErg


[LibriSpeech ASR Corpus]: http://www.openslr.org/12/
