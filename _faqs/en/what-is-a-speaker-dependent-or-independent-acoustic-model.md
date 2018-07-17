---
layout: faq_entry
title: What is a Speaker Dependent or Independent Acoustic Model? 
date: 2010-01-01
categories: faq
lang: en
permalink: en/faqs/:title
redirect_from: /home/docs/faq/faq/what-is-a-speaker-dependent-or-independent-acoustic-model
---
An **Acoustic** **Model** is a file used by a Speech Recognition Engine for 
Speech Recognition.  It contains a statistical representation of the distinct 
sounds that make up each word in the Language **Model** or Grammar ([more Info]).

A **Speaker** **Dependent** **Acoustic** **Model** is exactly what its name 
suggests - it is an **Acoustic** **Model** that has been tailored to recognize 
a particular person's speech.  Such **Acoustic** Models are usually trained 
using audio from a particular person's speech.  However you can also take a 
generic **Acoustic** **Model** and _adapt_ it to a particular person's speech 
to create a **Speaker** **Dependent** **Acoustic** **Model**.

A **Speaker** **Independent** **Acoustic** **Model** can recognize speech from 
a person who did not submit any speech audio that was used in the creation of 
the **Acoustic** **Model**.

The reason for the distinction is that it takes much more speech audio training 
data to create a **Speaker** **Independent** **Acoustic** **Model** than 
a **Speaker** **Dependent** **Acoustic** **Model**.


[more Info]: /home/docs/acoustic-model-creation
