/*
Copyright 2018 VoxForge

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
// TODO figure out javascript & GPL licensing....
// see: https://opensource.stackexchange.com/questions/4360/what-are-the-implications-of-licensing-a-javascript-library-under-gpl
// TODO do we need a manifest file???
// http://diveintohtml5.info/offline.html

/*
https://www.acunetix.com/websitesecurity/cross-site-scripting/
XSS - How Cross-site Scripting works
In order to run malicious JavaScript code in a victim’s browser, 
an attacker must first find a way to inject a payload into a web page that 
the victim visits. 
In order for an XSS attack to take place the vulnerable website needs 
to ***directly include user input in its pages***. An attacker can then 
insert a string that will be used within the web page and treated as
code by the victim’s browser.
This app does not display other users' input in its pages, so no obvious XSS 
vulnerability...

TODO: CSRF - Cross site request forgery; XSS cross site scripting

// for testing with Chrome: requires https; can bypass this with:
// no longer works: google-chrome -user-data-dir=~/temp --ignore-certificate-errors --unsafely-treat-insecure-origin-as-secure=https://jekyll_voxforge.org

// see: https://stackoverflow.com/questions/32042187/chrome-error-you-are-using-an-unsupported-command-line-flag-ignore-certifcat
// Note: if you actually want to ignore invalid certificates there's an option 
// in chrome://flags you can enable: Allow invalid certificates for resources loaded from localhost
// just start the browser at https://127.0.0.1/en/read/ (note: not same as jekyll with port 4000...)


// need Google Chrome version > 58 for wavesurfer to work correctly
*/

'use strict';

// ### GLOBALS #################################################################

//debugging service workers: chrome://serviceworker-internals

var uploadURL = 'https://upload.voxforge1.org'; // prod
// !!!!!!
// Note: make sure jekyll_voxforge.org and jekyll2_voxforge.org defined in
// /etc/hosts or on local DNS server;
var uploadURL = 'https://jekyll_voxforge.org/index.php'; // test basic workings
//var uploadURL = 'https://jekyll2_voxforge.org/index.php'; // test CORS
// !!!!!!

//  TODO generate 
var view;  // needs to be global so can be accessible to index.html
// #############################################################################

(function () {

// see: http://diveintohtml5.info/everything.html
if( ! window.Worker )
{
  window.alert( page_browser_support.no_worker_message );           
}

if( ! window.indexedDB )
{
  window.alert( page_browser_support.no_indexedDB_message );          
}

// Edge webworkers do not support FormData, and their web worker debugging is not there yet...
if (platform.os.family === "Windows" && (platform.name === "Microsoft Edge" || platform.name === "IE" ) )
{
  window.alert( page_browser_support.no_edgeSupport_message );         
}

var max_numPrompts = 50;

// buffer size is in units of sample-frames. If specified, the bufferSize 
// must be one of the following values: 256, 512, 1024, 2048, 4096, 8192, 16384.

var scriptProcessor_bufferSize = undefined; // let device decide appropriate buffer size

var vad_parms = {
    run: true,
    // maxsilence: 1500; //  original value
    // minvoice: 250; //  original value
    // buffersize: 480, //  original value
    maxsilence: 250, // works well with linux; not so well on Android 4.4.2
    minvoice: 250, 
    buffersize: 480,
};
// Note: cannot change device sample rate from browser...
if (platform.os.family === "Android" ) {
  if (platform.os.version && parseFloat(platform.os.version) < 5) {
    vad_parms.run = false;
    console.warn("low powered device - disabling automatic silence detection (VAD)");

    max_numPrompts = 10;
  } else {
    // Android 4.4.2 has default buffer size of: 16384
    // Android's higher buffer value causing problems with WebRTC VAD.  Need to 
    // manually set.
    scriptProcessor_bufferSize = 8192;
    console.warn('resetting bufferSize to ' + scriptProcessor_bufferSize + 
                 ' sample-frames, for VAD support');

    vad_parms.maxsilence = 1000; // use more aggressive silence detection on Android
    vad_parms.minvoice = 125; // use shorter min voice on Android

    max_numPrompts = 25;
  }
}

// #############################################################################

const appversion = "0.2";
const recording_timeout = 20000; // 20 seconds - silence detection should remove leading and trailing silence
const recording_stop_delay = 1000; 

// upload uses shadow DOM entries as database of audio... if browser does not have
// enough time to process the last prompt, it will not be included in upload...
// need to at least wait for RECORDING_STOP_DELAY to complete before displaying
// upload message, because upload() reads from DOM and if not finished 
// recording, it will miss last recording.
const process_last_recording_delay = recording_stop_delay + 400; 

/**
* Instantiate classes
*/
var prompts = new Prompts();
view = new View(prompts, 
                max_numPrompts); 
var profile = new Profile(view.update, 
                          appversion);
var audio = new Audio(view, 
                      profile, 
                      scriptProcessor_bufferSize, 
                      vad_parms);
var controller = new Controller(prompts, 
                                view, 
                                profile, 
                                audio,
                                recording_timeout,
                                recording_stop_delay,
                                process_last_recording_delay,
                                appversion);
view.set_controller(controller);

})();

