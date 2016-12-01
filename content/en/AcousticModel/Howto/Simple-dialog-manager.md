---
layout: page
title: Simple Dialog Manager
weight: 8
ref: develop
lang: en
permalink: /how-to/simple-dialog-manager
redirect_from: /simple-dialog-manager2
---
You can now use the acoustic models you just created (either the tutorial or howto models) with a simple command and control dialog manager that uses the [Julius](http://julius.osdn.jp/en_index.php) speech recognition engine and the acoustic models you just created.

### Dependencies

#### Linux:

*   [Julius](http://julius.osdn.jp/en_index.php?q=index-en.html#download_julius) speech recognition engine (specifically, these executables: julius, mkfa and dfa_minimize)
*   [Julia](http://julialang.org/downloads/) scripting language for technical computing (if you're planning to create/modify grammars)

the Linux grammars assume the following packages are installed:

*   firefox (browser)

*   rhythmbox (music player)

*   inxi (command line system information script - for weather)
*   festival (text-to-speech system)

#### Windows:

*   [Julius](http://julius.osdn.jp/en_index.php?q=index-en.html#download_julius) speech recognition engine (you'll need: julius.exe, mkfa.exe and dfa_minimize.exe)
*   [Julia](http://julialang.org/downloads/) scripting language for technical computing (if you're planning to create/modify grammars)

the Windows grammars assume the following package is installed:

*   firefox (browser)

### Try it out

The simpleDM folder is included in the [tutorial/howto zip file on github](https://github.com/VoxForge/develop/archive/master.zip).  If you have not already done so, download and extract the the zip file.

Change directory to the simpleDM folder, and execute one of the following commands:

  **Linux**:

      $ cd simpleDM
      $ julius -input mic -C simpleDM.jconf -gramlist grammars_linux -plugindir plugin/linux

  **Windows**:

      C:> cd simpleDM
      C:> julius.exe -input mic -C simpleDM.jconf -gramlist grammars_windows.txt -plugindir plugin/windows

### How does it work?

The Julius speech recognition engine includes the ability to add plugins (i.e. c language call-backs) to add functionality to Julius.  By updating and compiling the result.c file in the plugin/linux folder, and telling Julius where to find the plugin (using the -plugindir parameter), Julius will return all recognition results to result_str variable in the result_best_str() function.

The VoxForge modifications to result.c simply parse the results from the Julius decoder and execute them in a child process using the Linux 'fork' and 'execvp' system calls (or 'spawn' for Windows).  This is similar to the approach used by an O/S command shell (e.g. Bash) when you execute a program from the command line. 

The advantage to this approach is that you can create a command in any language (e.g. Python, Ruby, shell, c, ...), and as long as you can call the program from the command line, you can set up a grammar that allows you to speak a keyword or phrase to get the command to execute in a child process.

### How does a spoken keyword run a given command?

A recognition Grammar essentially defines constraints on what the speech recognition engine (SRE) can expect as input.  It is a list of words and/or phrases that the SRE listens for.  When one of these predefined words or phrases is heard, the SRE returns the word or phrase.

Lets look at the grammar and voca for the Linux FireFox grammar;

**firefox.grammar**

    S: NS_B APPLICATION COMMAND NS_E

In this example, "S" is the initial sentence symbol.   NS_B and NS_E correspond to the silence that occurs just before the utterance you want to recognize and after.   "S", "NS_B" and "NS_E" are required in all Julius grammars.

"NS_B", "NS_E", "APPLICATION", and "COMMAND" represent Word Categories that must be defined in the ".voca" file.

**firefox.voca (modified Julius .voca file)**

    % NS_B
    <s>

    % NS_E
    </s>

    % APPLICATION
    VOXFORGE [APP]

    % COMMAND
    HOME [firefox -remote openurl(http://www.voxforge.org)]
    READ [firefox -remote openurl(http://www.voxforge.org/home/read)]
    LISTEN [firefox -remote openurl(http://www.voxforge.org/home/listen)]
    FORUMS [firefox -remote openurl(http://www.voxforge.org/home/forums)]
    DEVELOP [firefox -remote openurl(http://www.voxforge.org/home/dev)]
    DEVELOPER [firefox -remote openurl(http://www.voxforge.org/home/dev)]
    ABOUT [firefox -remote openurl(http://www.voxforge.org/home/about)]
    HOWTO [firefox -remote openurl(http://www.voxforge.org/home/dev/acousticmodels/linux/create/htkjulius/how-to/download)]
    TUTORIAL [firefox -remote openurl(http://www.voxforge.org/home/dev/acousticmodels/linux/create/htkjulius/tutorial/download)]

This .voca file is not the same as the standard Julius .voca file.  The format was changed so that it could accomodate command names and parameters directly in the grammar file.

In the ".voca" file, the "APPLICATION" word category (words starting with '%') corresponds to one keyword: "VOXFORGE", which will be replaced with its pronunciation (phone list) from the pronunciation dictionary ([VoxForgeDict.txt](https://github.com/VoxForge/develop/raw/master/lexicon/VoxForgeDict.txt)). 

The "COMMAND" word category corresponds to many words: HOME, READ, LISTEN... each with a corresponding command (in brackets) to be executed when the keyword is uttered in a microphone.  When run through the Julia [compile_grammar.jl](https://github.com/VoxForge/develop/raw/master/bin/compile_grammar.jl) script, these keywords will be replaced with the pronunciation from the pronunciation dictionary:

| julia ../bin/compile_grammar.jl grammar/linux/firefox/firefox |

The resulting **firefox.dict** file is in Julius format:

    0    [<s>] sil
    1    [</s>] sil
    2    [APP] v aa k s f ao r jh
    3    [firefox -remote openurl(http://www.voxforge.org)] hh ow m
    3    [firefox -remote openurl(http://www.voxforge.org/home/read)] r eh d
    3    [firefox -remote openurl(http://www.voxforge.org/home/listen)] l ih s ah n
    3    [firefox -remote openurl(http://www.voxforge.org/home/forums)] f ao r ah m z
    3    [firefox -remote openurl(http://www.voxforge.org/home/dev)] d ih v eh l ah p
    3    [firefox -remote openurl(http://www.voxforge.org/home/dev)] d ih v eh l ah p er
    3    [firefox -remote openurl(http://www.voxforge.org/home/about)] ah b aw t
    3    [firefox -remote openurl(http://www.voxforge.org/home/dev/acousticmodels/linux/create/htkjulius/how-to/download)] hh aw t uw
    3    [firefox -remote openurl(http://www.voxforge.org/home/dev/acousticmodels/linux/create/htkjulius/tutorial/download)] t uw t ao r iy ah l 

Julius just thinks that the text within the square brackets is the return word corresponding the the list of phones after the square brackets.  So instead of returning the word HOME when the phone series: "hh ow m" is recognized, it returns the command "firefox -remote openurl(http://www.voxforge.org)" to the result.c callback, which then runs the command in a child process.  These are the minimum changes required to essentially turn Julius and you operating system into a spoken dialog manager.

The command in brackets: [firefox -remote openurl(http://www.voxforge.org)] assumes that your version of firefox supports the -remote parameter.  Therefore, when the keyword 'HOME' is spoken and recognized by the speech recognition engine, then the given 'firefox -remote' command will be executed in a child shell.

### How to make my own spoken keyword/command combination?

Lets modify the grammar files to make things more generic and get firefox to open my favourite website. Note, at his point, you must use a word contained in ([VoxForgeDict.txt](https://github.com/VoxForge/develop/raw/master/lexicon/VoxForgeDict.txt)).

update the firefox.grammar as follows:

    S: NS_B COMMAND NS_E
    COMMAND: APP_VOXFORGE COM_VOXFORGE
    COMMAND: APP_BROWSER COM_BROWSER

"COMMAND" is a symbol that does not have any definition in the .voca file.  It does have a further definition in the .grammar file, where it is replaced by the word categories: "APP_VOXFORGE COM_VOXFORGE" or "APP_BROWSER COM_BROWSER", each of which must be defined in the .voca file.

Note: with Julius, only one **Substitution Rule** per line is permitted, with the colon ":" as the separator.   Alphanumeric ASCII characters and the underscore are permitted for **Symbol** names, and these are case sensitive.

Next, update the firefox.voca:

    % NS_B
    <s>

    % NS_E
    </s>

    % APP_VOXFORGE
    VOXFORGE [COM]

    % COM_VOXFORGE
    HOME [firefox -remote openurl(http://www.voxforge.org)]
    READ [firefox -remote openurl(http://www.voxforge.org/home/read)]
    LISTEN [firefox -remote openurl(http://www.voxforge.org/home/listen)]
    FORUMS [firefox -remote openurl(http://www.voxforge.org/home/forums)]
    DEVELOP [firefox -remote openurl(http://www.voxforge.org/home/dev)]
    DEVELOPER [firefox -remote openurl(http://www.voxforge.org/home/dev)]
    ABOUT [firefox -remote openurl(http://www.voxforge.org/home/about)]
    HOWTO [firefox -remote openurl(http://www.voxforge.org/home/dev/acousticmodels/linux/create/htkjulius/how-to/download)]
    TUTORIAL [firefox -remote openurl(http://www.voxforge.org/home/dev/acousticmodels/linux/create/htkjulius/tutorial/download)]

    % APP_BROWSER
    FIREFOX [COM]
    BROWSER [COM]

    % COM_BROWSER
    GOOGLE [firefox -remote openurl(http://www.google.com)]


Note: all category commands must start in position 1 of a line (i.e. no spaces or tabs before '% NS_B" or you might get an [undefined class "NS_B"] error)

Next, compile the grammar with the Julia [compile_grammar.jl](https://github.com/VoxForge/develop/raw/master/bin/compile_grammar.jl) script:

    julia ../bin/compile_grammar.jl grammar/linux/firefox/firefox

### How to run Julius with my updated grammar?

As shown above, execute one of the following commands to start Julius:

  **Linux**:

      $ cd simpleDM
      $ julius -input mic -C simpleDM.jconf -gramlist grammars_linux -plugindir plugin/linux

  **Windows**:

      C:> cd simpleDM
      C:> julius.exe -input mic -C simpleDM.jconf -gramlist grammars_windows.txt -plugindir plugin/windows
