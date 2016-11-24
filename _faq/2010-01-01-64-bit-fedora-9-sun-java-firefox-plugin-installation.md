---
layout: faq_entry
title:  "64-bit Fedora 9 Sun Java FireFox Plugin Installation"
categories: faq java
lang: es
date: 2010-01-01
---
Espagnol test

<div class="postSubject">
				64-bit Fedora 9 Sun Java FireFox Plugin Installation
			</div>
			<div class="postData">

				<div style="float: left; padding-right: 25px;">
					<b>User:</b> 
						
							kmaclean
						
						<br>
					<b>Date:</b> 1/1/2010 10:21 am<br>
				</div>	
				<div>
					<b>Views:</b> 24770<br>
					<b>Rating:</b> 29
						
						<br>
							
				</div>	
			</div>
			<div class="postMessage">
				<h4>DEPRECATED<br></h4>
<h4>(alternate title #1: How-to install Sun Java on 64-bit Fedora 9 so that signed applets will work)</h4>
<h4>(alternate
title #2: How-to install 32-bit FireFox on 64-bit Fedora 9 so that so
that Sun Java applet will run properly in FireFox)</h4>
<p>The information presented here was taken from these posts (many thanks to the authors: scott_glaser &amp; natousayni):</p>
<ul>
<li><a href="http://fedorasolved.org/browser-solutions/java-i386/">Sun Java Installation - i386</a> (FC8-9)<a href="http://fedorasolved.org/browser-solutions/java-i386/"><br></a></li>
<li><a href="http://fedoraforum.org/forum/showthread.php?t=194858">Sun Java Installation - x86_64</a></li>
</ul>
<h3>Problem:</h3>
<ul>
<li>64-bit
Fedora 9 contains OpenJDK, which cannot run signed applets and the the
VoxForge Speech Submission applet is a signed Java applet.</li>
</ul>
<blockquote>OpenJDK
is the free implementation of Sun's Java run-time environment.&nbsp; The
browser plugin used in Fedora 9, gcjwebplugin, does not yet support
signed plugins.&nbsp; From the <a href="http://fedoraproject.org/wiki/Docs/Beats/Java#Handling_Java_Applets">Fedora Project Wiki</a>: :<br></blockquote>
<blockquote>&nbsp;&nbsp;&nbsp; Handling Java Applets<br><br>Upstream OpenJDK does not provide a plugin. The Fedora OpenJDK packages include an adaptation of <a href="http://www.nongnu.org/gcjwebplugin/">gcjwebplugin</a>, that runs untrusted applets safely in a Web browser. The plugin is packaged as java-1.6.0-openjdk-plugin.<br></blockquote>
<blockquote>
<ul>
<li>&nbsp;...</li>
<li>The gcjwebplugin adaptation does not support <a href="https://bugzilla.redhat.com/show_bug.cgi?id=304031" title="https://bugzilla.redhat.com/show_bug.cgi?id=304031">signed applets</a>.
Signed applets will run in untrusted mode. Experimental support for
signed applets is present in the IcedTea repository, but it is not
ready for deployment in Fedora.</li>
<li>The gcjwebplugin security
policy may be too restrictive. To enable restricted applets, run the
firefox -g command in a terminal window to see what is being
restricted, and then grant the restricted permission in the
/usr/lib/jvm/java-1.6.0-openjdk-1.6.0.0/jre/lib/security/java.policy
file.</li>
</ul>
</blockquote>
<ul>
<li>Sun recommends 32-bit Java to run applets;</li>
</ul>
<ul>
<li>32-bit Java needs a 32-bit plugin to work in a browser; </li>
</ul>
<ul>
<li>The 64-bit Fedora 9 implementation of FireFox is 64-bit and will not work with a 32-bit Java plugin.</li>
</ul>
<h3>Solution:</h3>
<ul>
<li><strong>Install 32-bit FireFox</strong></li>
</ul>
<blockquote>
<p>&nbsp;&nbsp;&nbsp; <strong>* Add i386 Yum repository</strong><br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; * create a new Yum configuration file:<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; # gedit /etc/yum.repos.d/fedora-i386.repo<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; * copy these settings into the new configuration file:<br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [fedora-i386]<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; name=Fedora $releasever - i386<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; failovermethod=priority<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; baseurl=http://download.fedora.redhat.com/pub/fedora/linux/releases/$releasever/Everything/i386/os/<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; mirrorlist=http://mirrors.fedoraproject.org/mirrorlist?repo=fedora-$releasever&amp;arch=i386<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; enabled=1<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; gpgcheck=1<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; includepkgs=firefox<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-fedora<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; #<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [updates-i386]<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; name=Fedora $releasever - i386 - Updates<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; failovermethod=priority<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; baseurl=http://download.fedora.redhat.com/pub/fedora/linux/updates/$releasever/i386/<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; mirrorlist=http://mirrors.fedoraproject.org/mirrorlist?repo=updates-released-f$releasever&amp;arch=i386<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; enabled=1<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; gpgcheck=1<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; includepkgs=firefox<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-fedora</p>
<p>&nbsp;&nbsp;&nbsp;<strong> *&nbsp; Remove the default Firefox (64-bit) installation </strong><br><br>&nbsp;&nbsp;&nbsp; # yum -y erase firefox.x86_64<br><br><strong>&nbsp;&nbsp;&nbsp; *&nbsp; Install 32-bit Firefox </strong><br><br>&nbsp;&nbsp;&nbsp; # yum -y install firefox.i386 </p>
</blockquote>
<ul>
<li><strong>Add libXtst.i386 library</strong></li>
</ul>
<blockquote>&nbsp;&nbsp;&nbsp; # yum -y install libXtst.i386 <br></blockquote>
<ul>
<li><strong>Don't touch your default java installation</strong></li>
</ul>
<blockquote>Other
how-tos state that you need to remove openjdk.&nbsp; However, other programs
on Fedora 9, like Eclipse, need the default Java.&nbsp; You should not have
to remove your default Java installation (java-1.6.0-openjdk
java-1.0.6-openjdk-plugin) because you can use the <a href="http://linux.die.net/man/8/alternatives">alternatives</a>
command to select the version of Java you need (but you need to make
sure you don't use the rpm version of Sun's Java install, because it
changes the /usr/bin/java executable to not point to the "<a href="http://linux.die.net/man/8/alternatives">alternatives</a>" command symbolic links ).<br></blockquote>
<ul>
<li><strong>Create new Java directory</strong></li>
</ul>
<blockquote>&nbsp;&nbsp;&nbsp; # mkdir /usr/java<br><br>&nbsp;&nbsp;&nbsp; # cd /usr/java&nbsp;&nbsp;&nbsp; <br></blockquote>
<ul>
<li><strong>Download Sun's java your new Java directory</strong></li>
</ul>
<blockquote>&nbsp;&nbsp;&nbsp; www.java.com/en/download<br>&nbsp;&nbsp;&nbsp; (the .bin file NOT the rpm.bin - because the rpm changes the /usr/bin/java executable to not point to the "<a href="http://linux.die.net/man/8/alternatives">alternatives</a>" command symbolic links).<br></blockquote>
<ul>
<li><strong>Execute the bin</strong></li>
</ul>
<blockquote>
<p>&nbsp;&nbsp;&nbsp; # chmod +x jre*<br>&nbsp;&nbsp;&nbsp; # ./jre-6u7-linux-i586.bin</p>
</blockquote>
<ul>
<li><strong>Link FireFox plugins to the new Sun Java</strong>
<ul>
<li><strong>Manually&nbsp;</strong></li>
</ul>
</li>
</ul>
<blockquote>
<blockquote>* <strong>for a particular user</strong><br></blockquote>
<blockquote>&nbsp;&nbsp;&nbsp; # cd /home/yourusername/.mozilla/plugins</blockquote>
<blockquote>&nbsp;&nbsp;&nbsp; # ln-s /usr/java/jre-6u7-linux-i586/plugins/i386/ns7/libjavaplugin_oji.so&nbsp; <br></blockquote>
<blockquote>*<strong> for all users:</strong></blockquote>
<blockquote>&nbsp;&nbsp;&nbsp; # cd /usr/lib/mozilla/plugins</blockquote>
<blockquote>&nbsp;&nbsp;&nbsp; # ln-s /usr/java/jre-6u7-linux-i586/plugins/i386/ns7/libjavaplugin_oji.so&nbsp; </blockquote>
<blockquote><strong>- OR -</strong>&nbsp; <br></blockquote>
</blockquote>
<blockquote>
<ul>
<li><strong>Use <a href="http://linux.die.net/man/8/alternatives">alternatives</a> command (for all users)</strong> </li>
</ul>
<blockquote>(you can also use the <a href="http://linux.die.net/man/8/alternatives">alternatives</a>
command to set the plugin link - since FireFox is the only app that needs the
Sun Java and it uses<em> libjavaplugin.so</em> rather than the<em>
libjavaplugin.so.x86_64 </em>used by other programs (like Eclipse) on 64-bit
Fedora 9).</blockquote>
<blockquote>
<p>&nbsp;&nbsp;&nbsp;
# /usr/sbin/alternatives --install
/usr/lib/mozilla/plugins/libjavaplugin.so libjavaplugin.so
/usr/java/jdk1.6.0_07/jre/plugin/i386/ns7/usr/java/libjavaplugin.so 2</p>
<p>&nbsp;&nbsp;&nbsp; # /usr/sbin/alternatives --config libjavaplugin.so </p>
</blockquote>
<blockquote>
<blockquote>
<p>&nbsp; There is 1 program which provide 'libjavaplugin.so'.<br><br>&nbsp; Selection&nbsp;&nbsp;&nbsp; Command<br>-----------------------------------------------<br>*+ 1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; /usr/java/jre1.6.0_07/plugin/i386/ns7/libjavaplugin_oji.so<br><br>Enter to keep the current selection[+], or type selection number: <strong>1</strong></p>
</blockquote>
</blockquote>
</blockquote>
<blockquote>
<p>&nbsp;</p>
</blockquote>

<div style="clear: both;"></div>

			</div>

			
				<div class="postControls">
					
					
				</div>
			
		</div>
	</div>

	<div style="margin-left: 10px;">
		<div class="postBorder">
			<a name="id6d4WrHuAPEZ8Z8QyBxBUxA"></a>
			<div class="postSubject">
				Re: 64-bit Fedora 9 Sun Java FireFox Plugin Installation
			</div>
			<div class="postData">

				<div style="float: left; padding-right: 25px;">
					<b>User:</b> 
						
							kmaclean
						
						<br>
					<b>Date:</b> 1/1/2010  1:43 pm<br>
				</div>	
				<div>
					<b>Views:</b> 840<br>
					<b>Rating:</b> 38
						
						<br>
							
				</div>	
			</div>
			<div class="postMessage">
				<p>If you get something like the following message after installing <strong>firefox</strong>.i386:</p>
<p style="padding-left: 30px;"># <strong>firefox</strong><br>Could not find compatible GRE between version 1.9b5 and 1.9b5.</p>
<p>Then you need to find your GRE version number by running this command:</p>
<p style="padding-left: 30px;"># /usr/bin/xulrunner --gre-version<br>1.9.0.5</p>
<p>Then edit your <strong>firefox</strong> application.ini file as follows:</p>
<p style="padding-left: 30px;"># gedit /usr/lib/<strong>firefox</strong>-3.0b5/application.ini</p>
<p>And change this:</p>
<p style="padding-left: 30px;">[Gecko]<br>MinVersion=1.9b5<br>MaxVersion=1.9b5</p>
<p>to this (using the version GRE number from the xulrunner command executed above):</p>
<p style="padding-left: 30px;">[Gecko]<br>MinVersion=1.9.0.5<br>MaxVersion=1.9.0.5</p>

<div style="clear: both;"></div>

			</div>

			
				<div class="postControls">
					
					
				</div>
			
		</div>
	</div>

	<div style="margin-left: 20px;">
		<div class="postBorder">
			<a name="idf1hJhAfa4MsTHvO4N91QhQ"></a>
			<div class="postSubject">
				Re: 64-bit Fedora 9 Sun Java FireFox Plugin Installation
			</div>
			<div class="postData">

				<div style="float: left; padding-right: 25px;">
					<b>User:</b> 
						
							kmaclean
						
						<br>
					<b>Date:</b> 1/1/2010  1:44 pm<br>
				</div>	
				<div>
					<b>Views:</b> 899<br>
					<b>Rating:</b> 17
						
						<br>
							
				</div>	
			</div>
			<div class="postMessage">
				<p>from visitor:</p>
<p>Might also have something to do with this file:</p>
<p style="padding-left: 30px;">/etc/gre.d/1.9b4.system.conf</p>
<p>see this post: <a href="https://bugs.launchpad.net/ubuntu/+source/xulrunner-1.9/+bug/201938">Conflicts has not been updated for ~b4 (firefox cannot start after xulrunner upgrade)</a>&nbsp;where Linas says:</p>
<div class="bug-comment">
<p style="padding-left: 30px;">I found a fix for this. It was some sort of packaging problem, left over from earlier versions.</p>
<p style="padding-left: 30px;">The directory /etc/gre.d (gecko rendering engine) contained a config file that specified<br>earlier (and inappropriate) xulrunner versions. I discovered this while performing a<br>dpkg -P xulrunner xulrunner-1.9 firefox firefox-3.0 (-P is purge-remove, which removes<br>the config files as well as the binaries/libraries). dpkg reported an error, complaining that<br>/etc/gre.d was not empty. Upon removing this directory, and reinstalling firefox-3, the<br>troublesome error message went away, and firefox started working.</p>
<p style="padding-left: 30px;">I had to manually remove /etc/gre.d/1.9b4.system.conf -- it was this file that caused<br>all the problems for me.</p>
</div>

<div style="clear: both;"></div>

			</div>

			
				<div class="postControls">
					
					
				</div>
			
		</div>
	</div>

	<div style="margin-left: 30px;">
		<div class="postBorder">
			<a name="idiq4WkER7p17wkWdp-Cw45A"></a>
			<div class="postSubject">
				Re: 64-bit Fedora 9 Sun Java FireFox Plugin Installation
			</div>
			<div class="postData">

				<div style="float: left; padding-right: 25px;">
					<b>User:</b> 
						
							kmaclean
						
						<br>
					<b>Date:</b> 1/1/2010  1:44 pm<br>
				</div>	
				<div>
					<b>Views:</b> 944<br>
					<b>Rating:</b> 27
						
						<br>
							
				</div>	
			</div>
			<div class="postMessage">
				<p>from jg67:</p>
<p>Still no joy.&nbsp; I'm running <strong>fedora</strong> <strong>9</strong> x86_64, and <strong>java</strong> has never worked via <strong>firefox</strong> for me.&nbsp; So this post looked right on target.&nbsp; </p>
<p>I
did all the steps, and they all worked as stated (including the GRE
min/max vesion issue).&nbsp; But still <strong>java</strong> just doesn't work from <strong>firefox</strong>.&nbsp;
Where do I look for the errors (logs etc).&nbsp; Other suggestions?</p>

<div style="clear: both;"></div>

			</div>

			
				<div class="postControls">
					
					
				</div>
			
		</div>
	</div>

	<div style="margin-left: 40px;">
		<div class="postBorder">
			<a name="idIJqix8kC9YPdkPyehEJlgA"></a>
			<div class="postSubject">
				Re: 64-bit Fedora 9 Sun Java FireFox Plugin Installation
			</div>
			<div class="postData">

				<div style="float: left; padding-right: 25px;">
					<b>User:</b> 
						
							kmaclean
						
						<br>
					<b>Date:</b> 1/1/2010  1:45 pm<br>
				</div>	
				<div>
					<b>Views:</b> 818<br>
					<b>Rating:</b> -2
						
						<br>
							
				</div>	
			</div>
			<div class="postMessage">
				<p>Hi jg16,</p>
<p>&gt;But still <strong>java</strong> just doesn't work from <strong>firefox</strong>.&nbsp;
Where do I look for the </p>
<p>&gt;errors (logs etc).&nbsp; </p>
<p>Open your <strong>Java</strong> Control Panel (System&gt;Preferences&gt;<strong>Java</strong>).&nbsp; I had trouble with mine after a few <strong>Fedora</strong> updates, and can only get it to run properly by executing it from the command line with "usr/<strong>java</strong>/latest/bin/jcontrol".</p>
<p>Go to the Advanced tab, go to <strong>Java</strong> console, and select Show console, click Apply button.&nbsp; You may need to restart your browser.&nbsp; </p>
<p>When you go to a page with a <strong>Java</strong> applet (like the VoxForge <span class="horizontalMenu"><a href="../../../../../read">Read</a><span class="horizontalMenu"> page), the <strong>Java</strong> console should appear and should give you some hints on your problem.</span></span></p>
<p>Ken</p>

<div style="clear: both;"></div>

			</div>

			
				<div class="postControls">
					
					
				</div>
			
		</div>
	</div>

	<div style="margin-left: 50px;">
		<div class="postBorder">
			<a name="idn_sbCA9h6GxqYAni0Z5WUg"></a>
			<div class="postSubject">
				Re: 64-bit Fedora 9 Sun Java FireFox Plugin Installation
			</div>
			<div class="postData">

				<div style="float: left; padding-right: 25px;">
					<b>User:</b> 
						
							kmaclean
						
						<br>
					<b>Date:</b> 1/1/2010  1:45 pm<br>
				</div>	
				<div>
					<b>Views:</b> 906<br>
					<b>Rating:</b> 25
						
						<br>
							
				</div>	
			</div>
			<div class="postMessage">
				<p>from jg167:</p>
<p>I didn't get much info from the <strong>java</strong> console, and pretty much gave up on this. &nbsp;A day later I did a routine yum update (still have the 32 bit <strong>firefox</strong> and <strong>java</strong>
installed and yum correctly only looked for 32 bit updates for those
and did 64 for everything else), and now its working! &nbsp;I don't what
update fixed it but now all is well!</p>

<div style="clear: both;"></div>

			</div>

			
				<div class="postControls">
					
					
				</div>
			
		</div>
	</div>

	<div style="margin-left: 60px;">
		<div class="postBorder">
			<a name="idfbMBagikLmlkGr1Xz0oimw"></a>
			<div class="postSubject">
				Re: 64-bit Fedora 9 Sun Java FireFox Plugin Installation
			</div>
			<div class="postData">

				<div style="float: left; padding-right: 25px;">
					<b>User:</b> 
						
							kmaclean
						
						<br>
					<b>Date:</b> 1/1/2010  1:45 pm<br>
				</div>	
				<div>
					<b>Views:</b> 864<br>
					<b>Rating:</b> 22
						
						<br>
							
				</div>	
			</div>
			<div class="postMessage">
				<p><strong>Java</strong> SE 6 now comes in <a href="http://java.sun.com/javase/6/webnotes/install/system-configurations.html"><strong>64-bit</strong> mode</a>, however, it does not yet support <a href="http://java.sun.com/javase/6/webnotes/install/system-configurations.html#deployment-footnotes"><strong>64-bit</strong> browsers</a> on Linux yet.</p>

<div style="clear: both;"></div>

			</div>

			
				<div class="postControls">
					
					
				</div>
			
		</div>
	</div>

	<div style="margin-left: 30px;">
		<div class="postBorder">
			<a name="idHtKd4GAiPABo__wH4FY0dg"></a>
			<div class="postSubject">
				Re: 64-bit Fedora 9 Sun Java FireFox Plugin Installation
			</div>
			<div class="postData">

				<div style="float: left; padding-right: 25px;">
					<b>User:</b> 
						
							manuelmoto
						
						<br>
					<b>Date:</b> 8/31/2013 11:07 pm<br>
				</div>	
				<div>
					<b>Views:</b> 364<br>
					<b>Rating:</b> 20
						
						<br>
							
				</div>	
			</div>
			<div class="postMessage">
				<p>consulta tengo que tener internet por ley para instalar java</p>
