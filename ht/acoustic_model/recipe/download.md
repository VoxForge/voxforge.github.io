---
layout: tutorial
title: Linux - Download Required Software
weight: 1
ref: htkjulius_howto
lang: en
permalink: /recipe/download
redirect_from: /home/dev/acousticmodels/linux/create/htkjulius/how-to/download
---

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

*   [HTK source code (tar+gzip archive)](http://htk.eng.cam.ac.uk/ftp/software/HTK-3.5.beta-2.tar.gz)

*   [htkbook.pdf](http://htk.eng.cam.ac.uk/ftp/software/htkbook-3.5.alpha-1.pdf)

*   [HDecode](http://htk.eng.cam.ac.uk/ftp/software/hdecode/HDecode-3.5.beta-1.tar.gz)

and save them to your new bin directory.

### Step 3 - Unpack your source files

Extract the files using:

*   Nautilus (right click each tar/gzipped file and click extract here);

    -or-

*   use tar from the command line for the following file:
    *   tar -xvzf HTK-3.5.beta-2.tar.gz

this should create the following directories in your bin folder:

        voxforge/bin/htk
        voxforge/bin/htk(2)

Copy the HTKLVRec sub-directory in /htk(2) to /htk, then delete the /htk(2) directory.

### Step 4 - Compile & Install HTK

#### Compile 

Review the README included with HTK-3.5. Then execute the following commands:

    cd HTKLib && make -f MakefileCPU all && cd ..
    cd HLMLib && make -f MakefileCPU all && cd ..
    cd HTKTools && make -f MakefileCPU all && cd ..
    cd HLMTools && make -f MakefileCPU all && cd ..

#### Install

To build the libraries and binaries, execute the following:

    cd HTKLib && make -f MakefileCPU install && cd ..
    cd HLMLib && make -f MakefileCPU install && cd ..
    cd HTKTools && make -f MakefileCPU install && cd ..
    cd HLMTools && make -f MakefileCPU install && cd ..

This install the HTK executables in the bin.cpu folder.

### Step 5 - testing

See testing in the 'Update Your User Path' section.

# Julius

Julius is a large vocabulary continuous speech recognition (LVCSR) engine.  Julius can be used for command and control and dictation applications.

[Julius](http://julius.sourceforge.jp/en_index.php?q=en/index.html) has no limitations on distribution.  It uses Acoustic Models in HTK format, and Grammar files in its own format.

### Step 1 - Download Julius

click the following link: 

*   get a current version from [Julius web site](https://github.com/julius-speech/julius/releases) 

and save it to your '/home/yourusename/voxforge/bin' directory.

([to compile Julius from source](/faq/how-to-compile-julius-from-source)) 

### Step 2 - Extract Source Files

Extract the file using:

*   Nautilus (right click the tar/gzipped file and click extract here)

-or-

*   use tar from the command line:

        tar -xvzf julius-4.3.1.tar.gz

this should create a julius-4.4.2.1 directory in your bin folder.

### Step 3 - Compile & Install

#### Install Pre-requisites 

Linux  (tested on Ubuntu-14.04)

  sudo apt-get install build-essential zlib1g-dev libsdl2-dev
  sudo apt-get libasound2-dev

#### Compile

  ./configure
  make

#### Install

  sudo make install

### Step 3 - testing

See testing in the 'Update Your User Path' section. 

# Update User Path

To update your user path (which tells your command line where to search for _executable files_)  you need to add the following directories your user path variable:

*   /home/**yourusename**/voxforge/bin/htk/bin.cpu
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

    $ sudo apt install julia

### Step 2 - testing

*   Type "julia -v" in terminal window to get the version number of your Julia binary

if your system displays version information for Julia , then it is installed properly;

# Audacity

Audacity is a free, easy-to-use, multi-track audio editor and recorder.

Use the following command to download and install Audacity (as superuser):

    $ sudo apt install audacity 

[Click here to download Audacity](http://audacity.sourceforge.net/) from its web site.



