---
layout: default
title: how-to step-3
ref: how-to-step-3
lang: en
permalink: /recipe/step-3
redirect_from: /home/dev/acousticmodels/linux/create/htkjulius/how-to/data-prep/step-3
---

Step 3 - Recording the Data
---------------------------

We will use the [Audacity] Sound Editor and Recorder to record your speech to audio files.  Create a new folder called 'voxforge/train/wav'.

The [prompts.txt] file you created in Step 2 will guide you on what to record.  The first column contains the name of the audio file, and the following columns contain the text transcriptions.

Recording Levels 
-----------------

Make sure you are in a quiet environment, your microphone is adjusted correctly, and the recording levels in Audacity are set properly.  See Step 3 of the Tutorial for details on how to do this.

Sampling Rate & Bits per Sample
-------------------------------

Check your Preferences in Audacity to make sure your sampling rate is set to **16Khz**, your sample rate format is set to **16-bits** per sample, and your channel is set to **mono**.   Also make sure that your default export 'File Format' is set to '**WAV (Microsoft 16-bit PCM)**'.  Step 3 of the Tutorial shows you how to do this.

Recording your first Audio File
-------------------------------

Record you first file by clicking the Record icon in Audacity and saying the words in the first line of your prompts file:

If the track sounds OK then click 'File' on the Audacity menu, then click 'Export As Wav' and save it as 'sample1' in the 'voxforge/train/wav' folder.

Repeat for all the remaining entries in your [prompts.txt] file.  

  [Audacity]: http://audacity.sourceforge.net/
  [prompts.txt]: https://github.com/VoxForge/develop/raw/master/howto/prompts.txt

