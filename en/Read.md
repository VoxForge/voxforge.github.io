---
layout: page
title: Contribute Speech to VoxForge
menu: Read
weight: 3
ref: read
lang: en
permalink: /en/read
redirect_from: /home/read
---
Read Prompts and Submit Recordings
----------------------------------

---

[Information on the Java Security Warning pop-up]

[Java Applet Troubleshooting Guide]

---

### Before you Begin Recording Prompts

Turn off any other audio programs on your PC (i.e. music players, audio
editors, etc.)

Position your mike so it does not pick up your breathing.  While
recording, try to minimize any non-speech noises (i.e. exhaling, taking
a breath, lip smacking, ...) or background noise. 

The black box near the bottom of your screen will display the audio
waveform of your recording. Please [record a test recording] to ensure
your microphone volume is not too loud or too soft.

The VoxForge applet works best with [Firefox] on Windows and Linux.

### Recording Prompts 

For each prompt line, please record your speech as follows:

1.  click the **Record** button,
2.  pause for half a second,
3.  **Read** the corresponding prompt sentence,
4.  pause for half a second, and then
5.  click the the **Stop** button.

If you make a mistake, click Record again to re-record your prompt.

Please [do not read the punctuation marks out loud].

Once you have completed recording all ten prompts the Upload button will
activate.  Click the **Upload** button to upload your entire submission
to the VoxForge repository as a single zip file.

**Repeat** the process (multiple submissions are encouraged!)
<div>
<applet mayscript="mayscript" style="border: 1px solid rgb(153,153,153);" name="VoxForge.org Speech Submission Application" code="speechrecorder/RecorderApplet.class" width="950" height="1050">
 <param value="http://read.voxforge1.org/speech/" name="codebase"> 
 <param value="speechrecorder.jar" name="archive">
 <param value="speechrecorder.jar" name="cache_archive">
 <param value="0.2.5" name="cache_version"> 
 <param value="application/x-java-applet;version=0.2.5" name="type"> 
 <param value="true" name="scriptable">
 <param value="http://read.voxforge1.org/speech/javaUploadServer.php" name="destination"> 
 <param value="http://www.voxforge.org/EN/endpage" name="endpage">
 <param value="" name="cookie">
 <param value="EN" name="language">

<br>
<p><b>Your browser does not support Java applets, you can use Java Webstart:</b> <a href="http://read.voxforge1.org/speech/SpeechSubmission.jnlp" onclick="return launchApplication('SpeechSubmission.jnlp');">click to launch this app as webstart</a></p>

<p>If your browser will not auto-start the SpeechSubmission application, <a href="https://www.java.com/en/download/installed.jsp"> make sure you have a current java installed</a>, and then download the jnlp file and run:</p>
<pre>
$ javaws SpeechSubmission.jnlp 
</pre>
<p>from command line.</p>
</applet>
</div>

  [Information on the Java Security Warning pop-up]: /home/read2/java-security-warning
  [Java Applet Troubleshooting Guide]: /home/read2/java
  [record a test recording]: http://www.voxforge.org/home/read/recording-how-to
  [Firefox]: http://www.mozilla.org/en-US/firefox/products/
  [Seamonkey]: http://www.seamonkey-project.org/
  [do not read the punctuation marks out loud]: http://www.voxforge.org/home/read2/comments/punctuation2


