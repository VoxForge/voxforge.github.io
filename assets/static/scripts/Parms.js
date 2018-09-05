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

/**
* ### Contructor ##############################################
*/
function Parms() {
    this.prompt = {
      // corresponds to the maximum number of prompts that a user can select from the 
      // drop-down menu selector;  This value changes based on type of device being used.
      max_numPrompts_selector: 50,
      num_prompts_to_trigger_upload: 10, // user can upload anytime after recording 10 prompts
     }

    this.audio = {
      // this was used before we just set audioNodebufferSize to largest size 
      // possible, since latency is not a issue for this app...
      //audioNodebufferSize: undefined, // let device decide appropriate buffer size
      audioNodebufferSize: 16384, // debug
      bitDepth:  '32bit-float', // 16 or 32bit-float
      vad: { // Voice Activity Detection parameters
        // maxsilence: 1500, minvoice: 250, buffersize: 480,//  original values
        maxsilence: 350, 
        minvoice: 250, 
        buffersize: 480, // don't change; current 'chunking' of of sending audio to VAD assumes this buffeersize
      },

      // TODO not being used
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
    
    this.view = {
      displayWaveform: true,
      displayVisualizer: true,
    }

    this.uploader = {
      maxMinutesSinceLastSubmission: 120,
    }

    this.controller = {
      recording_timeout: 20000, // 20 seconds - silence detection should remove leading and trailing silence
      recording_stop_delay: 500, // time between when stop button is clicks and app actually stops recording
      numPrompt2SubmittForRecordInfo: 5,
    }

    // FireFox on (all platforms) can record 32-bit float, but cannot play back 32-bit 
    // float; therefore only us 16bit bitdepth on all version of Firefox
    if ( platform.name.includes("Firefox") ) { 
      this.audio.bitDepth = 16;
    } 

    // TODO debug
    if ( ! (window.location.origin === 'https://voxforge.github.io') ) { 
        this.prompt.num_prompts_to_trigger_upload = 3;
        // controller.numPrompt2SubmittForRecordInfo = 1;
    } 


    // ### ANDROID #############################################################

    if ( platform.os.family.includes("Android") ) {
        this.audio.vad.maxsilence = 650; // detect longer silence period on Android
        this.audio.vad.minvoice = 75; // use shorter min voice threshold period on Android
        this.audio.blockDisplayOfRecordButton = true;
        this.audio.app_auto_gain = true;
        this.controller.recording_stop_delay = 750;

        if (platform.os.version) {
          if (parseFloat(platform.os.version) < 5) { // Android 4.4.2 and below
            // the more prompts to display the more it cpu is uses on mobile 
            // devices causing problems with drop outs crackles in recorded audio
            this.prompt.max_numPrompts_selector = 10;
          } else { // Android 5 and above
            this.prompt.max_numPrompts_selector = 20;
          }
        } else { // can't parse user agent... assume older version of Android/browser
            this.prompt.max_numPrompts_selector = 10;
        }
    }
}

