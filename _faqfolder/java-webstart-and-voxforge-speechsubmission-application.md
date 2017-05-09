---
layout: faq_entry
title: Java WebStart and VoxForge SpeechSubmission Application 
date: 2017-03-28
categories: faq
lang: en
redirect_from: /home/docs/faq/faq/java-webstart-and-voxforge-speechsubmission-application
---

**For Ubuntu (16.04):**
=======================

**Install Java and Java Webstart command**
------------------------------------------

$ sudo apt install default-jre icedtea-netx

(default-jre is the Java Run-Time Environment; icedtea-NetX is an implementation of the Java Network Launching Protocol (JNLP) and includes javaws - the command to launch a [Java Webstart] app)

Options:
--------

### A) From Firefox: launch a WebStart file directly from your browser

To do this, you need to update your FireFox preferences to associate the ".[jnlp][Java Webstart]" file suffix with Java Webstart Command

1.    Launch Mozilla Firefox;
2.    Select Preferences;
3.    Select Applications;
4.    Under Content Type, locate the entry for JNLP File.  Use can search for the "jnlp" entry;
5.    Enter full path to you javaws

      (use command: "whereis javaws" from terminal to find path)

The association is complete.  You can now launch the Voxforge SpeechSubmission app directly from Firefox.  Simply click on the WebStart link on the [VoxForge read page], and follow the instructions.

### B) From Command line:

You can run a remote .[jnlp][Java Webstart] file from the command line:

$ javaws http://read.voxforge1.org/speech/SpeechSubmission.jnlp

-or-

download the .[jnlp][Java Webstart] file to your computer first, and then run it locally:

$ javaws SpeechSubmission.jnlp

[Java Webstart]: https://en.wikipedia.org/wiki/Java_Web_Start
[VoxForge read page]: http://voxforge.org/home/read

