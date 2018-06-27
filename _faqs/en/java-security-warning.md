---
layout: faq_entry
title: Java Security Warning
date: 2010-01-01
categories: faq
lang: en
permalink: en/faqs/:title
redirect_from: /home/read2/java-security-warning
---

The VoxForge Speech Submission Application is a Java program.  It creates temporary files on your PC to hold your audio as you record each prompt line and then moves them to a zip file to be uploaded to the VoxForge server. 

Because of this, the Java Run-time Environment on your PC displays a Security Warning pop-up like this:

![My helpful screenshot]({{ site.url }}/images/java_security_warning.jpg)

It is up to you to decide whether you want to permit the VoxForge Speech Submission Application to run on your PC. 

Please be aware that by clicking the "run" button you are permitting this application to run without the security restrictions normally provided by Java.

However, the intent of this application is only to create temporary files to permit you to record your speech and upload the result to the VoxForge server.  We don't collect any information from your PC (though there will be a log entry on the web server when you upload your file, and we use a browser cookie to make multiple submissions easier).  Once your close your browser, and your Java Run-time Environment terminates, the audio files will be removed from your PC. 

The good thing about Open Source software is that the [source code] for this application is available for review, and anyone can confirm this.

#### Why read.voxforge1.org rather than www.voxforge.org? 

Because the front-end server for "voxforge.org" is on  a PC connected to a low-bandwidth Internet connection.  Whereas "voxforge1.org" is located on a webhoster's server and has a much higher bandwidth connection.  This is the same server that currently houses the [VoxForge Speech Corpus].

  [Java Applet]: /home/docs/faq/faq/what-is-a-java-applet
  [source code]: http://www.dev.voxforge.org/projects/Main/browser/Trunk/SpeechSubmission/VFSpeechSubmission/java/src/speechrecorder
  [VoxForge Speech Corpus]: http://www.repository.voxforge1.org/downloads/SpeechCorpus/Trunk/

