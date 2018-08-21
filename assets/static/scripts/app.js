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

'use strict';

// ### GLOBALS #################################################################

var uploadURL;
if (window.location.origin === 'https://voxforge.github.io') { // prod
    uploadURL = 'https://upload.voxforge1.org'; 
} else { // testing
  // NOTE: need to update _config.yaml var for local apache2 ssl to work
  // correctly:
  //    # add trailing slash to permalinks for debugging with Apache2 and self signed SSL certificate
  //    permalink: /:lang/:ref/ # debugging
  //    #permalink: /:lang/:ref
  uploadURL = 'https://jekyll_voxforge.org/index.php'; // test basic workings
  //var uploadURL = 'https://jekyll2_voxforge.org/index.php'; // test CORS
}
if (window.location.origin === 'http://localhost:4000') { 
   window.alert( "upload to jekyll server localhost may not work - need SSL certificate" );        
}

var view;  // needs to be global so can be accessible to index.html

// #############################################################################

(function () { // function context
    // ### Get Jekyll variables#################################################

    // references inline Javascript in record.html - so that Jekyll will localize variables properly
    var pageVariables = new PageVariables(); 

    // ### Confirm app can run on browser ######################################

    if( ! window.Worker )
    {
      window.alert( pageVariables.browser_support.no_worker_message );           
    }

    if( ! window.indexedDB )
    {
      window.alert( pageVariables.browser_support.no_indexedDB_message );          
    }

    // Edge webworkers do not support FormData, and their web worker debugging is not there yet...
    if (platform.os.family === "Windows" && (platform.name === "Microsoft Edge" || platform.name === "IE" ) )
    {
      window.alert( pageVariables.browser_support.no_edgeSupport_message );         
    }

    // ### PARMS ###############################################################
  
    var prompt_parms = {
      // corresponds to the maximum number of prompts that a user can select from the 
      // drop-down menu selector;  This value changes based on type of device being used.
      max_numPrompts_selector: 50,
      num_prompts_to_trigger_upload: 10, // user can upload anytime after recording 10 prompts
      //num_prompts_to_trigger_upload: 3, // debug
    }

    var audio_parms = {
      // this was used before we just set audioNodebufferSize to largest size 
      // possible, since latency is not a issue for this app...
      //audioNodebufferSize: undefined, // let device decide appropriate buffer size
      audioNodebufferSize: 16384, // debug
      bitDepth:  '32bit-float', // 16 or 32bit-float
      vad: { // Voice Activity Detection parameters
        run: true,
        // maxsilence: 1500, minvoice: 250, buffersize: 480,//  original values
        maxsilence: 350, 
        minvoice: 250, 
        buffersize: 480, // don't change; current 'chunking' of of sending audio to VAD assumes this buffeersize
      },
      ssd: { // simple silence detection parameters
        duration: 1000, // duration threshhold for silence detection (in milliseconds)
        amplitude: 0.02, // amplitude threshold for silence detection
      },
      blockDisplayOfRecordButton: false, // on slower devices, allowing user to record while display is still working can cause dropout/scratches
      app_auto_gain: false, // only needed for smartphones where you cannot adjust volume
      gain_increment_factor: 1.25, // speech detected, but volume too low, use this factor to increase volume
      gain_max_increment_factor: 2.0, // no speech detected, assume volume set really low, double volume
      gain_decrement_factor: 0.75, // if clipping, reduce volume
    }

    var view_parms = {
      displayWaveform: true,
      displayVisualizer: true,
    }

    var controller_parms = {
      recording_timeout: 20000, // 20 seconds - silence detection should remove leading and trailing silence
      recording_stop_delay: 500, // time between when stop button is clicks and app actually stops recording
      numPrompt2SubmittForRecordInfo: 5,
    }

    // FF on (all platforms) can record 32-bit float, but cannot play back 32-bit 
    // float; therefore only us 16bit bitdepth on all version of Firefox
    if ( platform.name.includes("Firefox") ) { 
      audio_parms.bitDepth = 16;
    } 

    // TODO debug
    if ( ! (window.location.origin === 'https://voxforge.github.io') ) { 
        prompt_parms.num_prompts_to_trigger_upload = 3;
        controller_parms.numPrompt2SubmittForRecordInfo = 0;
    } 

    // ### ANDROID #############################################################

    if ( platform.os.family.includes("Android") ) {
        audio_parms.vad.maxsilence = 650; // detect longer silence period on Android
        audio_parms.vad.minvoice = 75; // use shorter min voice threshold period on Android
        audio_parms.blockDisplayOfRecordButton = true;
        audio_parms.app_auto_gain = true;
        controller_parms.recording_stop_delay = 750;

        if (platform.os.version) {
          if (parseFloat(platform.os.version) < 5) { // Android 4.4.2 and below
            // the more prompts to display the more it cpu is uses on mobile 
            // devices causing problems with drop outs crackles in recorded audio
            prompt_parms.max_numPrompts_selector = 10;
          } else { // Android 5 and above
            prompt_parms.max_numPrompts_selector = 20;
          }
        } else { // can't parse user agent... assume older version of Android/browser
            prompt_parms.max_numPrompts_selector = 10;
        }
    }

    // #############################################################################
    const appversion = "0.2";

    var prompts = new Prompts(prompt_parms, pageVariables); 
    var profile = new Profile(appversion, pageVariables);
    // 'view' needs to be global so can be accessed by index.html
    view = new View(view_parms,
                    prompts,
                    profile,
                    pageVariables); 
    var audio = new Audio(audio_parms,
                          pageVariables);
    var uploader = new Uploader(pageVariables.alert_message);
    var controller =  new Controller(prompts, 
                                     profile, 
                                     view, 
                                     audio,
                                     uploader,
                                     controller_parms,
                                     appversion,
                                     pageVariables);

    prompts.init();
    view.init();
    audio.init();
    uploader.init();
    controller.start();

})(); // function context

// see: https://developers.google.com/web/fundamentals/app-install-banners/#criteria
window.addEventListener('appinstalled', (evt) => {
  console.log('a2hs installed');
});

if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('display-mode is standalone');
}



