---
layout: default
title: how-to script
ref: how-to-script
lang: en
permalink: /recipe/script
redirect_from: /home/dev/acousticmodels/linux/create/htkjulius/how-to/script
---

Run Acoustic Model Creation Script
----------------------------------

Note: you can download the files using the individual links below, or download the [VoxForge tutorial/howto zip file] and drag and drop the files to the correct folders.

Download the following Julia scripts to your 'voxforge/bin' folder.

-   [fixfulllist.jl]
-   [mkclscript.jl]
-   [mktrihed.jl]
-   [prompts2mlf.jl]
-   [prompts2wlist.jl]
-   [trainAM.jl]

Next, create a new "input\_files" folder inside your voxforge directory (so that you have 'voxforge/howto/input\_files' ), and download these files into it:

-   [config]
-   [mkphones0.led]
-   [mktri.led]
-   [sil.hed]
-   [wav_config]
-   [global.ded]
-   [maketriphones.ded]
-   [mkphones1.led]
-   [proto]
-   [tree1.hed]

 

Run the acoustic model training script:

<pre>
cd  voxforge/howt
julia ../bin/trainAM.jl
</pre>

This will create the following files (located in the howto/acoustic\_model folder) that make up your acoustic model:

-   [hmmdefs]
-   [tiedlist]

|                                                                                                                                                                                              |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Note: the hmmdefs file shown here was trained with my voice.  It will not work with your voice.  Your file will have a the same structure as this one, but the statistics will be different. |


  [VoxForge tutorial/howto zip file]: https://github.com/VoxForge/develop/archive/master.zip
  [fixfulllist.jl]: https://raw.githubusercontent.com/VoxForge/develop/master/bin/fixfulllist.jl
  [mkclscript.jl]: https://raw.githubusercontent.com/VoxForge/develop/master/bin/mkclscript.jl
  [mktrihed.jl]: https://raw.githubusercontent.com/VoxForge/develop/master/bin/mktrihed.jl
  [prompts2mlf.jl]: https://raw.githubusercontent.com/VoxForge/develop/master/bin/prompts2mlf.jl
  [prompts2wlist.jl]: https://raw.githubusercontent.com/VoxForge/develop/master/bin/prompts2wlist.jl
  [trainAM.jl]: https://raw.githubusercontent.com/VoxForge/develop/master/bin/trainAM.jl
  [config]: https://raw.githubusercontent.com/VoxForge/develop/master/howto/input_files/config
  [mkphones0.led]: https://raw.githubusercontent.com/VoxForge/develop/master/howto/input_files/mkphones0.led
  [mktri.led]: https://raw.githubusercontent.com/VoxForge/develop/master/howto/input_files/mktri.led
  [sil.hed]: https://raw.githubusercontent.com/VoxForge/develop/master/howto/input_files/sil.hed
  [wav_config]: https://raw.githubusercontent.com/VoxForge/develop/master/howto/input_files/wav_config
  [global.ded]: https://raw.githubusercontent.com/VoxForge/develop/master/howto/input_files/global.ded
  [maketriphones.ded]: https://raw.githubusercontent.com/VoxForge/develop/master/tutorial/maketriphones.ded
  [mkphones1.led]: https://raw.githubusercontent.com/VoxForge/develop/master/howto/input_files/mkphones1.led
  [proto]: https://raw.githubusercontent.com/VoxForge/develop/master/howto/input_files/proto
  [tree1.hed]: https://raw.githubusercontent.com/VoxForge/develop/master/howto/input_files/tree1.hed
  [hmmdefs]: https://github.com/VoxForge/develop/raw/master/howto/acoustic_model/hmmdefs
  [tiedlist]: https://github.com/VoxForge/develop/raw/master/howto/acoustic_model/tiedlist
