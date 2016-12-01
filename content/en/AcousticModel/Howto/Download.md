---
layout: page
title: Linux - Download Required Software
weight: 8
ref: develop
lang: en
permalink: /how-to/download
redirect_from: /home/dev/acousticmodels/linux/create/htkjulius/how-to/download
---
[Click here for the Windows version of this How-to ](/home/dev/acousticmodels/windows/create/htkjulius/how-to/download) |

# VoxForge directory

### Create VoxForge directory

Open a Linux terminal, create voxforge directory in your home directory

  *   from the command line, type:

          $mkdir voxforge

  *   go into your voxforge directory

          $cd voxforge

  *   within voxforge, create another folder called 'bin' (bin is a Unix standard name given to the folder containing executable programs)

          $mkdir bin

this creates the following folder path:

        /home/username/voxforge/bin

# HTK

The Hidden Markov Model Toolkit (HTK) is a portable toolkit for building and manipulating hidden Markov models.  HTK is primarily used for speech recognition.

HTK's [licence](http://htk.eng.cam.ac.uk/docs/license.shtml) requires you to [register](http://htk.eng.cam.ac.uk/register.shtml) before you can download the toolkit.   The source of the software is available but there are limitations on the distribution of the HTK Toolkit itself.  However, there is no limitation on the distribution of the acoustic models models you create with the toolkit.

### Step 1 - [Register](http://htk.eng.cam.ac.uk/register.shtml) with HTK 

### Step 2 - Download HTK Toolkit and Samples

Create a new directory in your voxforge directory called 'bin', it should have the following path (replace 'username' with the user name you are using on your system):

*   /home/**usename**/voxforge/bin 

click the following links:

*   [HTK source code (tar+gzip archive)](http://htk.eng.cam.ac.uk/ftp/software/HTK-3.4.1.tar.gz)

*   [htkbook.pdf  
    ](http://htk.eng.cam.ac.uk/ftp/software/HTK-samples-3.4.1.tar.gz)

and save them to your new bin directory.

### Step 3 - Unpack you source files

Extract the files using:

*   Nautilus (right click each tar/gzipped file and click extract here);

    -or-

*   use tar from the command line for the following file:
    *   tar -xvzf HTK-3.4.1.tar.gz

this should create the following directory in your bin folder:

        voxforge/bin/htk

### Step 4 - Compile & Install HTK

### Compiler version

If you have a newer version of the gcc compiler (version 4 or above), you will need to install gcc version 3.4 compatibility modules so that HTK will compile properly. Use gcc's version command to see which version is installed on your system:

    $ gcc -v

    Using built-in specs.

    ...

    Thread model: posix
    **gcc version 4.8.3** 20140911 (Red Hat 4.8.3-7) (GCC)

If you have version 4.0 or above (I have version 4.8.3) use yum to install the required files to your system:

    $su

    #yum install compat-gcc-34-c++ compat-gcc-34

(you may also need x11 development libraries:  yum install libx11-devel)

### 32-bit Systems


After unpacking the sources, open a command line terminal and go to the /home/username/voxforge/bin/htk directory where you downloaded your files. 
 
#### configure 
 
The default location for binaries is "/usr/local", which will put the tools in "/usr/local/bin".  You need to change this default location using the "./configure" script to specify where you want the binaries installed:
 
    $./configure --prefix=/home/**username**/voxforge/bin/htk
 
This directs the make command to put all your binaries in the following folder:
 
    /home/**username**/voxforge/bin/htk/bin.linux


### 64-bit System

#### configure 

The default location for binaries is "/usr/local" which will put the tools in "/usr/local/bin".  You need to change this default location using the "./configure" script to specify where you want the binaries installed:
 
   $ linux32 bash
 
   $./configure CC=gcc34 --prefix=/home/**username**/voxforge/bin/htk

This directs the make command to put all your binaries in the following folder:
 
   /home/**username**/voxforge/bin/htk/bin.linux

### make 

To build the libraries and binaries, execute the following:

    $make


Rnning the following command will install them: 

    $make install

If you get the following error

    make[1]: Entering directory `/home/username/voxforge/bin/htk/HLMTools'
    Makefile:77: *** missing separator (did you mean TAB instead of 8 spaces?).  Stop.
    make[1]: Leaving directory `/home/username/voxforge/bin/htk/HLMTools'

you need to fix a minor bug in an HTK Makefile

$ gedit /home/username/voxforge/bin/htk/HLMTools/Makefile

    mkinstalldir:
        if [ ! -d $(bindir) -a X_ = X_yes ] ; then mkdir -p $(bindir) ; fi

find line 77 and replace the leading spaces with a tab (make sure your editor acutally puts in a tab character), and re-run make.

### Step 5 - testing

See testing in the 'Update Your User Path' section.

# Julius

Julius is a large vocabulary continuous speech recognition (LVCSR) engine.  Julius can be used for command and control and dictation applications.

[Julius](http://julius.sourceforge.jp/en_index.php?q=en/index.html) has no limitations on distribution.  It uses Acoustic Models in HTK format, and Grammar files in its own format.

### Step 1 - Download Julius

click the following link: 

*   get current binaries from [Julius web site](https://github.com/julius-speech/julius/releases) (32-bit binaries compiled with: --with-mictype=oss)

-or-

*   [Julius 64-bit binaries](/content/en/AcousticModel/julius-standard-alsa-4.3.1.tar.gz) from VoxForge (compiled with: --with-mictype=alsa)
*   [Julius 32-bit binaries](/content/en/AcousticModel/julius-standard-alsa-4.3.1.i686.zip) from VoxForge (compiled with: --with-mictype=alsa)

and save it to your '/home/yourusename/voxforge/bin' directory.

([to compile Julius from source](/faq/how-to-compile-julius-from-source)) 

If you get the following error when you run julius:

    ### read waveform input
    Stat: adin_oss: device name = /dev/dsp (application default)
    Error: adin_oss: failed to open /dev/dsp
    failed to begin input stream

use the VoxForge version of Julius compiled with alsa.

### Step 2 - Extract Julius 

Extract the file using:

*   Nautilus (right click the tar/gzipped file and click extract here)

-or-

*   use tar from the command line:

        tar -xvzf julius-4.3.1.tar.gz

this should create a julius-4.3.1 directory in your bin folder.

### Step 3 - testing

See testing in the 'Update Your User Path' section. 

# Update User Path

To update your user path (which tells your command line where to search for _executable files_)  you need to add the following directories your user path variable:

*   /home/**yourusename**/voxforge/bin/htk/bin
*   /home/**yourusename**/voxforge/bin/julius-4.3.1-linuxbin/bin

To do this, edit your '.bash_profile' file in your home directory (in Fedora you need to show 'hidden files' in Nautilus - so you can display file names with a period in front of them). You do this by adding the listed paths, separated by a colon (":") to the end of the PATH variable as follows (all one line, no spaces):

    $ gedit ~/ .bash_profile

    # User specific environment and startup programs
    PATH=$PATH:$HOME/voxforge/bin/htk/bin:
    $HOME/voxforge/bin/julius-4.3.1-linuxbin/bin


Log out and log back in to make your path change effective (use echo $PATH to confirm that your updates worked correctly).

### Testing Your HTK/Julius Install

*   Type in "HVite -V" in a Command Console Window;

if your system lists all the options available to the hvite command, then HTK is installed properly.

*   Type in "julius" in a Command Console Window;

if your system displays version information for Julius, then Julius is installed properly;

*   If you don't see the expected results, review your installation steps for Julius or HTK to determine where you might have made an error.

(using the "$echo $PATH" command can help find errors)


# Julia

Julia is a high-level, high-performance scripting language for technical computing.

The VoxForge acoustic model creation toolkit is written in Julia.

### Step 1 - Download Linux version of Julia

    #yum install julia

### Step 2 - testing

*   Type "julia -v" in terminal window to get the version number of your Julia binary

if your system displays version information for Julia , then it is installed properly;

# Audacity

Audacity is a free, easy-to-use, multi-track audio editor and recorder.

Use the following command to download and install Audacity (as superuser):

    #yum install audacity 

[Click here to download Audacity](http://audacity.sourceforge.net/) from its web site.



