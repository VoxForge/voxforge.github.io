---
layout: faq_entry
title: How to compile Julius from source 
date: 2010-01-01
categories: faq
lang: en
permalink: en/faqs/:title
redirect_from: /home/docs/faq/faq/how-to-compile-julius/julian-from-source
---
## Step 1 - Download Source Code

Create a new directory in your home directory called 'bin', it should have the 
following path (replace yourusername with the username you are using on your 
system):

*   /home/yourusename/bin 

[Get the tarball of the most current version of the Julius source files]

and save it to your new bin directory.

Extract the file using:

*   Nautilus (right click the tar/gzipped file and click extract here)
*   use tar from the command line:
    *   tar<span> <span></span> </span>-xvzf julius-4.3.1.tar.gz

this should create a julius-4.3.1 directory in your bin folder.

## Step 2 - Compile & Install Julius

After unpacking the sources, open a command line terminal and go to the 
/home/yourusername/bin/julius-4.3.1 directory where you downloaded your files. 

### configure 

The default location for binaries is "/usr/local" which will put the tools in 
"/usr/local/bin".  You need to change this default location using the 
"./configure" script to specify where you want the binaries installed:

#### To compile Julius: 

    $./configure --with-mictype=alsa --enable-setup=standard --prefix=~/bin/julius-4.3.1

(Note: ~/bin/julius-4.3.1 points to /home/yourusername/bin/julius-4.3.1)

This directs the make command to put all your binaries in the following folder:

    /home/yourusername/bin/julius-4.3.1/bin

#### To compile 32-bit Julius on a 64-bit computer: 

you will need the .686 version of alsa-lib as root:

    yum install alsa-lib-devel.i686

then add a flag before you run the Julius configure to tell your gcc compiler to compile 32-bit binaries:

    $ CFLAGS=-m32  ./configure --with-mictype=alsa --enable-setup=standard --prefix=~/bin/julius-4.3.1 --host=i686-generic-linux-gnu

### make 

To build the libraries and binaries, execute the following:

    $make all

Running the following command will install them: 

    $make install

### Step 3 Update your User Path

To update your user path, you need to add the '$HOME/bin/julius-4.3.1/bin' path
to your path variable.  To do this, edit your '.bash_profile' file in your home
directory (in Fedora you need to show 'hidden files' in Nautilus - so you can
display file names with a period in front of them) and add a colon (":") and
this path to the end of the PATH variable (leaving the rest of it unchanged):

    # User specific environment and startup programs
    PATH=$PATH:$HOME/bin/julius-4.3.1/bin

Log out and log back in to make your path change effective.

[See Chapter 2 of Julius Book](http://julius.osdn.jp/juliusbook/en/desc_install.html).


[Get the tarball of the most current version of the Julius source files]: http://julius.osdn.jp/en_index.php
