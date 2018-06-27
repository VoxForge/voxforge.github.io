---
layout: faq_entry
title: What is a Dialog Manager? 
date: 2010-01-01
categories: faq
lang: en
permalink: en/faqs/:title
redirect_from: /home/docs/faq/faq/what-is-a-dialog-manager
---
A [Dialog Manager](http://en.wikipedia.org/wiki/Dialog_manager) is one component of a [Speech Recognition System](http://www.zim.org/home/docs/faq/faq/what-is-the-difference-between-a-speech-recognition-engine-and-a-speech-recognition-system).

**Telephony and Command & Control Dialog Managers**

A Dialog Manager used in Telephony applications (IVR - Interactive Voice Response), and in some desktop Command and Control Application, assigns meaning to the words recognized by the Speech Recognition Engine, determines how the utterance fits into the dialog spoken so far,and decides what to do next.  It might need to retrieve information from an external source.  If a response to the user is required, it will choose the words and phrases to be used in its response to the user, and transmit these to the Text-to-Speech System to speak the response to the user.

**Dictation Dialog Manager **

A Dictation Dialog Manager will typically take the words recognized by the Speech Recognition Engine and type out the corresponding text on your computer screen.  It may also have some Command and Control elements, but these are usually limited to the types of commands typically used in a word processing program.  It usually responds to the user using text (i.e. it might not use Text to Speech to respond to the user).

**Examples **

Examples of Telephony Dialog Managers include: 

*   [Ravenclaw](http://www.ravenclaw-olympus.org/),
*   [jvoicexml](http://jvoicexml.sourceforge.net/),
*   [ariadne](http://www.opendialog.org/),
*   [jaspis](http://www.cs.uta.fi/hci/spi/Jaspis/). 

Examples of Command & Control Dialog Managers:

*   [Gnome-Voice-Control](http://live.gnome.org/GnomeVoiceControl)<span class="icon"> </span> <span class="icon">(uses PocketSphinx)</span>
*   [SpeechLion](http://home.comcast.net/%7Ebrewer123/projects/speechlion/) (uses Sphinx4)
*   [Vedics](http://vedics.sourceforge.net/) (uses Sphinx4)
*   [PerlBox](http://www.perlbox.org/) (uses Sphinx2)
*   [Simon](http://simon-listens.org/) (uses Julius)
*   [OpenEars](http://www.politepix.com/openears/) (uses PocketSphinx on iPad/iPhone)
*   [Kiku](http://www.workinprogress.ca/kiku/) (uses Julius)
*   [ruby-pocketsphinx-server](https://github.com/alumae/ruby-pocketsphinx-server) (for Android)[
    ](https://github.com/alumae/ruby-pocketsphinx-server)
*   [Jaivox](http://www.jaivox.com/speechcommand.html) (uses Sphinx4)
*   [pocketVox](https://github.com/benoitfragit/pocketVox) (uses <span class="icon">PocketSphinx</span>)

**[<span></span>](https://github.com/alumae/ruby-pocketsphinx-server)**

Examples of Dictation Dialog Managers, with Command & Control elements, would be:

*   [xVoice](http://xvoice.sourceforge.net/) (needs IBM's ViaVoice engine for Linux - no longer available)
*   [Evaldictator](http://www.speech.cs.cmu.edu/sphinx/dictator/) <span class="icon">(uses Sphinx4)</span>
*   [<span>speechoo</span>](http://code.google.com/p/speechoo/) (uses Julius) a <span>dictation pad for LibreOffice</span>
*   [<span>freespeech-vr</span>](http://code.google.com/p/freespeech-vr/)<span></span> <span>Free streaming voice recognition with dynamic language learning</span>

You can also write a domain specific application to perform Dialog Manager-like tasks using a traditional programming language (C, C++, Java, etc.) or a scripting Language (Perl, Python, Ruby, etc.). For example:

*   Sphinx
    *   using Perl: [Cepstral's](http://www.cepstral.com/source/) <span class="subject">[Speech and audio POE components](http://www.cepstral.com/source/) ([announcement](http://www.mail-archive.com/poe@perl.org/msg00088.html));</span>
    *   <span class="subject"></span>Perl: [Speech-Recognizer-SPX-0.09](http://search.cpan.org/~djhd/Speech-Recognizer-SPX-0.09/) (CPAN)
    *   <span class="subject">Perl and PHP: [Sphinx and Asterisk](http://www.voip-info.org/wiki/view/Sphinx) integration (as a starting point for creating your own script-based dialog manager)</span>
    *   <span class="subject">Python: [voximp](http://code.google.com/p/voximp/)
        </span>
    *   Java & C++ API: [Voce](http://voce.sourceforge.net/)
    *   Python: [Blather](http://gitorious.org/blather)
    *   Javascript: [JuliusJS](https://github.com/zzmp/juliusjs)

*   Julius:

    *   PHP: [Querying a database using open source voice control software](http://www.linux.com/archive/feature/134671)
    *   Python:
        *   [Writing a command and control application with voice recognition](http://bloc.eurion.net/archives/2008/writing-a-command-and-control-application-with-voice-recognition/)
        *   [Robot Arm with Voice Control](http://www.aonsquared.co.uk/robot_arm_tutorial_2)
        *   [E.V.E.](https://github.com/thomasweng15/E.V.E.)

    *   Bash: [http://bitbucket.org/ptg/vox/src](http://bitbucket.org/ptg/vox/src)
        *   see also [waryishe's post](http://www.voxforge.org/home/forums/message-boards/dialog-managers/command-line-dialog-manager/8)

    *   Java: [voice-remote-android](http://code.google.com/p/voice-remote-android/)
    *   Lua: [PEIS Julius](http://www.oru.se/PageFiles/14880/Oru-Te-DT3017-D107_08-1.pdf)
    *   Javascript: [PocketSphinx.js](http://syl22-00.github.io/pocketsphinx.js/)

*   HTK
    *   [using Java](http://www.voxforge.org/home/forums/message-boards/speech-recognition-engines/htk-files-from-java-problem)


-------------------------------------------------
**User:** kmaclean
**Date:** 3/9/2010 9:14 am

Here is [video](http://www.pcgenius.com/computer-accessories/linux/linux-remote-controll-with-a-voice-speech-recognition/) that describes an approach ([Linux – remote controll with a voice](http://www.pcgenius.com/computer-accessories/linux/linux-remote-controll-with-a-voice-speech-recognition/)) that uses [Voximp](http://code.google.com/p/voximp/) as the dialog manager (which uses pocketsphinx), [xbindkeys](http://www.nongnu.org/xbindkeys/xbindkeys.html) to bind program to a key and [zenity](http://freshmeat.net/projects/zenity) to display notifications.

From the [Voximp](http://code.google.com/p/voximp/) home page:

Voximp is an application which allows simple voice commands to be bound to spawn programs or simulate key/mouse presses. It's written in python and uses pocketsphinx for voice-recognition.

From the [xbindkeys](http://www.nongnu.org/xbindkeys/xbindkeys.html) web page:

[xbindkeys](http://www.nongnu.org/xbindkeys/xbindkeys.html) is a program that allows you to launch shell commands with your keyboard or your mouse under X Window. It links commands to keys or mouse buttons, using a configuration file. It's independant of the window manager and can capture all keyboard keys (ex: Power, Wake...).

From the [zenity](http://freshmeat.net/projects/zenity) web page

Zenity is a tool that allows you to display Gtk+ dialog boxes from the command line and through shell scripts. It is similar to gdialog, but is intended to be saner. It comes from the same family as dialog, Xdialog, and cdialog, but it surpasses those projects by having a cooler name.

-------------------------------
**User:** kmaclean
**Date:** 10/2/2010 10:47 am


Here is an article (Google translated from Russian) that gives another [example of using Julius with Python](http://translate.google.ca/translate?js=n&prev=_t&hl=en&ie=UTF-8&layout=2&eotf=1&sl=auto&tl=en&u=http%3A%2F%2Fwww.xakep.ru%2Fmagazine%2Fxa%2F133%2F082%2F1.asp):

$ vi sample.voca

    % NS_B
    <s> sil

    % NS_E
    </s> sil

    % ID
    DO d uw

    % COMMAND
    PLAY pl ey
    NEXT n eh kst
    PREV pr iy v
    SILENCE s ay l ax ns

$ vi sample.<span>grammar</span>

    S: NS_B ID COMMAND NS_E

Create your grammar:

$ mkdfa sample

$ julius -input mic -C julian.jconf

$ vi command.py

    def parse(line):
       params = [param.lower() for param in line.split() if param]
       commands = {
       'play': 'audacious2 -p',
       'silence': 'audacious2 -u',
       'next': 'audacious2 -f',
       'prev': 'audacious2 -r',
       }
       if params[1] in commands: os.popen(commands[params[1]])

$ julius -quiet -input mic -C julian.jconf 2>/dev/null | ./command.py
