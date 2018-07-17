---
layout: faq_entry
title: How to create tree.hed "questions"
categories: faq
lang: en
date: 2010-01-01
permalink: en/faqs/:title
redirect_from: /home/docs/faq/faq/how-to-create-tree.hed-questions
---
Step 10 of the Voxforge Tutorial and Howto use a tree.hed script that contain 
"questions" are specific to the English language, and therefore will not work 
with other languages.

For more information see here: [how to create a tree.hed file for a new language].

*   [nsh's overview of how to create clustered triphone "questions" for Sphinx and HTK]
for new languages
*   [Ticket #153 - htk error on step 10], and a [related thread] in the forums
*   my post on this Thread on "[Error when compiling model] where I discuss 
creating clustered triphone "questions"

See also the [HTK manual](http://htk.eng.cam.ac.uk/prot-docs/htk_book.shtml). 

Theoretically, you should be able to automatically create questions using 
the [CMU Robust Group Sphinx Tutorial]. These would be in Sphinx format, but 
could be used as a starting point for the creation of HTK questions for a 
tree.hed script.


[how to create a tree.hed file for a new language]: http://www.voxforge.org/home/docs/dev/acousticmodels/linux/create/htkjulius/tutorial/triphones/step-10
[nsh's overview of how to create clustered triphone "questions" for Sphinx and HTK]: http://www.dev.voxforge.org/projects/Main/wiki/AcousticTreeQuestions
[Ticket #153 - htk error on step 10]: http://www.dev.voxforge.org/projects/Main/ticket/153
[related thread]: http://www.voxforge.org/home/docs/forums/message-boards/acoustic-model-discussions/htk-error-in-step-10/2
[Error when compiling model]: http://www.voxforge.org/home/forums/message-boards/acoustic-model-discussions/error-when-compiling-model---newmacro-macro-or-model-name-st_o_2_1-already-exists?pn=2
[CMU Robust Group Sphinx Tutorial]: https://cmusphinx.github.io/wiki/tutorial
