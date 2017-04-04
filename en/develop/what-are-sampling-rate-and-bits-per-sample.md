---
layout: default
title: What are Sampling Rate and Bits per Sample?
permalink: en/what-are-sampling-rate-and-bits-per-sample
redirect_from: /home/docs/faq/faq/what-are-sampling-rate-and-bits-per-sample
---

**What are Sampling Rate and Bits per Sample?**

From the Audacity [Digital Audio Tutorial]:

The main device used in digital recording is a Analog-to-Digital Converter (ADC). The ADC captures a snapshot of the electric voltage on an audio line and represents it as a digital number that can be sent to a computer. By capturing the voltage thousands of times per second, you can get a very good approximation to the original audio signal:

<img src="http://manual.audacityteam.org/m/images/e/e2/waveform_digital.png" alt="http://manual.audacityteam.org/m/images/e/e2/waveform_digital.png" class="transparent" />


Each dot in the figure above represents one audio *sample*. There are two factors that determine the quality of a digital recording:

-   **Sample rate**: The rate at which the samples are captured or played back, measured in Hertz (Hz), or samples per second. An audio CD has a sample rate of 44,100 Hz, often written as 44 KHz for short. This is also the default sample rate that Audacity uses, because audio CDs are so prevalent.

-   **Sample format** or **sample size**: Essentially this is the number of digits in the digital representation of each sample. Think of the sample rate as the horizontal precision of the digital waveform, and the sample format as the vertical precision. An audio CD has a precision of 16 bits, which corresponds to about 5 decimal digits.

Higher sampling rates allow a digital recording to accurately record higher frequencies of sound. The sampling rate should be at least twice the highest frequency you want to represent. Humans can't hear frequencies above about 20,000 Hz, so 44,100 Hz was chosen as the rate for audio CDs to just include all human frequencies. Sample rates of 96 and 192 KHz are starting to become more common, particularly in DVD-Audio, but many people honestly can't hear the difference.

Higher sample sizes allow for more dynamic range - louder louds and softer softs. If you are familiar with the decibel (dB) scale, the dynamic range on an audio CD is theoretically about 90 dB, but realistically signals that are -24 dB or more in volume are greatly reduced in quality. Audacity supports two additional sample sizes: 24-bit, which is commonly used in digital recording, and 32-bit *float*, which has almost infinite dynamic range, and only takes up twice as much storage as 16-bit samples.

Here are some additional articles that provide more information on sampling rate and bit depth (i.e. bits per sample):

-   [Discussion of the mysteries behind bit-depth, sample rates and sound quality]
-   [Sample rate and bit depth - an introduction to sampling][][
    ][Sample rate and bit depth - an introduction to sampling]

  [Digital Audio Tutorial]: http://manual.audacityteam.org/man/digital_audio.html
  [Discussion of the mysteries behind bit-depth, sample rates and sound quality]: http://tweakheadz.com/16_vs_24_bit_audio.htm
  [Sample rate and bit depth - an introduction to sampling]: http://www.musiciansfriend.com/document?doc_id=88273&src=3SOSWXXA

