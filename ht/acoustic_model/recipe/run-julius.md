---
layout: default
title: how-to run-julius
ref: how-to-run-julius
lang: en
permalink: /recipe/run-julius
redirect_from: /home/dev/acousticmodels/linux/create/htkjulius/how-to/run-julius
---

Run Julius Live
---------------

1. First you need to create your Julius configuration file.  Copy this sample configuration file [sample.jconf] to you 'voxforge/howto' folder.  For details on the parameters contained in your sample.jconf file, see the [Juliusbook].  The main parameters are shown below:

<table>
<colgroup>
<col width="100%" />
</colgroup>
<tbody>
<tr class="odd">
<td align="left"><pre><code># VoxForge configurations:
-dfa sample.dfa     # finite state automaton grammar file
-v sample.dict      # pronunciation dictionary
-h acoustic_model/hmmdefs    # acoustic HMM (ascii or Julius binary)
-hlist acoustic_model/tiedlist     # HMMList to map logical phone to physical
-spmodel &quot;sp&quot;           # name of a short-pause silence model
-multipath          # force enable MULTI-PATH model handling
-gprune safe        # Gaussian pruning method
-iwcd1 max          # Inter-word triphone approximation method
-iwsppenalty -70.0  # transition penalty for the appended sp models
-smpFreq 16000        # sampling rate (Hz)
-iwsp                     # append a skippable sp model at all word ends
-penalty1 5.0           # word insertion penalty for grammar (pass1)
-penalty2 20.0      # word insertion penalty for grammar (pass2)
-b2 200             # beam width on 2nd pass (#words)
-sb 200.0               # score beam envelope threshold
-n 1                # num of sentences to find

# you may need to adjust your &quot;-lv&quot; value to prevent the recognizer inadvertently 
# recognizing non-speech sounds:
-lv 4000            # level threshold (0-32767)

# comment these out for debugging:
-logfile julius.log
-quiet </code></pre></td>
</tr>
</tbody>
</table>

2. Make sure your Microphone volume is at a setting that is similar to when you created your audio files.

3. Then run Julius with:

<table>
<colgroup>
<col width="100%" />
</colgroup>
<tbody>
<tr class="odd">
<td align="left"><p>$cd voxforge/howto<br />
$julius -input mic -C sample.jconf</p></td>
</tr>
</tbody>
</table>

 

<a href="" id="idK_XX1Th67lt0eDOo4LQVEA"></a>
4. The Julius will display its startup information on your screen.  You can begin speaking when you see:

<table>
<colgroup>
<col width="100%" />
</colgroup>
<tbody>
<tr class="odd">
<td align="left"><pre><code>

----------------------- System Information end -----------------------
 Notice for feature extraction (01),
     *************************************************************
     * Cepstral mean normalization for real-time decoding:       *
     * NOTICE: The first input may not be recognized, since      *
     *         no initial mean is available on startup.          *
     *************************************************************
 ------                                                                                                                          
 ### read waveform input
 Stat: capture audio at 16000Hz
 Stat: adin_alsa: latency set to 32 msec (chunk = 1536 bytes)
 Error: adin_alsa: unable to get pcm info from card control
 Warning: adin_alsa: skip output of detailed audio device info
 STAT: AD-in thread created
 &lt;&lt;&lt; please speak &gt;&gt;&gt;                                                                                          |
 </code></pre></td>
</tr>
</tbody>
</table>
The first 2-3 seconds of your speech will not be recognized as Julius adjusts its recognition levels.  You may need to adjust your volume to get better recognition results.

You should get fair recognition results.  To improve recognition, your Acoustic Model needs more audio training data.  You need to create new prompts, and record more speech audio files based on these prompts in order to create better Acoustic Models.  However, with an automated script, it is much easier to record additional audio data.

To add more speech audio to your Acoustic Model, keep the audio and prompts you have already created, and follow the steps in this how-to:

-   add your new prompts to the prompts file you created in Step 2,
-   record new audio files corresponding to the your prompts as shown in Step 3,  and
-   Update your codetrain.scp file to include your new audio files, and re-run the training script as shown in Step 4. 

As you add more audio data, you will begin to notice improvements in your recognition accuracy, and it will reach a point where you no longer need to add any additional training data.

The steps in this how-to are for the creation of a single user Acoustic Model.  To create a multi-user Acoustic Models, simply get other people to contribute audio as shown in the previous steps, and re-run your script.

  [sample.jconf]: https://raw.githubusercontent.com/VoxForge/develop/master/howto/sample.jconf
  [Juliusbook]: http://sourceforge.jp/projects/julius/downloads/47534/Juliusbook-4.1.5.pdf

