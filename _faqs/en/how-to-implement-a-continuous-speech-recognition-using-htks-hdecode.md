---
layout: faq_entry
title: How to implement a continuous speech recognition using HTK's HDecode
categories: faq
lang: en
date: 2010-01-01
permalink: en/faqs/:title
redirect_from: /home/docs/faq/faq/how-to-implement-a-continuous-speech-recognition-using-htks-hdecode
---
From the [HTK mailing list archives](http://htk.eng.cam.ac.uk/pipermail/):

    Hi everyone,

    I am trying to implement a continuous speech recognition in Spanish 
    Language. I followed the indications to make the tri-gram language 
    model presented in the HTK book. I am using the HDecode tool. My 
    firsts results are very poor (WER >= 35%). So I tuned various 
    parameters in HDecode, but know I need to make tuning of the language 
    model parameter. Any user can help me in that? for example, what 
    parameter in the to language model generation are recommended to 
    continuous speech?

    Did you try to follow htk wsj1 reciept? It has almost everything
    required I think:

[http://www.inference.phy.cam.ac.uk/kv227/htk/]

[http://www.inference.phy.cam.ac.uk/kv227/lm_giga/]

    with all beams used and lm factors. Though for really large vocabulary lm factor should be smaller (around 6-8).

[http://www.inference.phy.cam.ac.uk/kv227/htk/]: http://www.inference.phy.cam.ac.uk/kv227/htk/
[http://www.inference.phy.cam.ac.uk/kv227/lm_giga/]: http://www.inference.phy.cam.ac.uk/kv227/lm_giga/
