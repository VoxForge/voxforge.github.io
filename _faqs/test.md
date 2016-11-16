---
layout: post
title: " How can I execute HTK or Julius commands from my Windows console? "
categories: faq
lang: en
---

You may want to have Julius and HTK included in your path environment variable.  This way you can execute Julius and/or HTK commands from your Windows console (note that you will _not_ be able to execute bash or Perl scripting commands),

#### Step 1 - Update your path environment variable to include HTK and Julius

*   Login to Windows with your administrator account;

*   Go to Windows Start menu;
*   Right-click My Computer;
*   Click properties from the right-click menu; 
    *   this opens up your System Properties window;
*   Click the Advanced tab;
*   Click Environment Variables button;

![](../../../uploads/Lv/gx/LvgxBNMbC1AS-FQFHz5bYw/SystemProperties.jpg)

*   Go to the System variables window and roll down until you find the Path variable and click on it;
*   Click the System variables Edit button;

![SystemProperties_EnviroVariables.jpg](../../../uploads/wr/_T/wr_TDHwufR9r8oAhjTkL4g/SystemProperties_EnviroVariables.jpg)

*   In the Edit System Variable window, click the Variable Value entry field (this field contains is a long string of directory entries for your system)

![SystemProperties_EditSysVariables.jpg](../../../uploads/ir/pN/irpNA6faAWY5JQo3198a3g/SystemProperties_EditSysVariables.jpg)

*   hit your 'end' key to go to the end of the Variable Value string and then add the following entry (all one line, and include the semi-colon ";" at the beginning of the string) to the end of the Variable Value entry field:          

| 

;c:\cygwin\HTK\htk-3.3-windows-binary\htk;C:\Cygwin\Julius\julius-3.5-win32bin\bin

 |

| 

Warning: be very careful here, you can cause serious problems with your system if you make a mistake. Don't overwrite or delete anything already there.  You are just adding directory entries for HTK and Julius to the **_end_** of your current path.

If you think you may have made an error, click the cancel button and restart. 

 |

*   Click OK in the Edit System Variable window

*   Click OK in the Environment Variables window

*   Click OK in the System Properties window

#### Step 2 - Testing Your HTK/Julius Install

*   Open a Cygwin Console window:
    *   Click Start>All Programs>Cygwin>Cygwin Bash Shell;

*   Type in "HVite" in the Cygwin Console;

> > if your system lists all the options available to the hvite command, then HTK is installed properly.

*   Type in "julius" in the Cygwin Console;

> > if your system displays version information for Julius, then Julius is installed properly;

*   If you don't see the expected results, review your installation steps for Julius or HTK to determine where you might have made an error.
