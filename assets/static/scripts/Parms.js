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

function Parms() {
    this.audio = {
      // this was used before we just set audioNodebufferSize to largest size 
      // possible, since latency is not a issue for this app...
      //audioNodebufferSize: undefined, // let device decide appropriate buffer size
      audioNodebufferSize: 16384, // debug
      bitDepth:  '32bit-float', // 16 or 32bit-float
      vad: { // Voice Activity Detection parameters
        // maxsilence: 1500, minvoice: 250, buffersize: 480,//  original values
        // TODO should vad values be user selectable?
        maxsilence: 350, 
        minvoice: 250, 
        buffersize: 480, // don't change; current 'chunking' of sending audio to VAD assumes this buffeersize
      },

      blockDisplayOfRecordButton: false, // on slower devices, allowing user to record while display is still working can cause dropout/scratches
      gain: {
        maxValue: 2.5,       
        increment_factor: 1.2, // speech detected, but volume too low, use this factor to increase volume
        max_increment_factor: 2.0, // no speech detected, assume volume set really low, double gain factor
        decrement_factor: 0.8, // if clipping, multiply gain by this factor to reduce volume
      }
    }

    /*
     * android442 = Android 4.4.2 and below
     * the more prompts to display, the more it cpu is uses on mobile 
     * devices causing problems with drop outs/crackles in recorded audio
     * 
     * android5 = Android 5 and above
     * numPrompts = number of prompts to put in stack; once all recorded it
     * triggers display of upload button
     */
    function getNumPromptsRange() {
        var desktop = {
            min: 10,
            max: 50,
            numPrompts: 10}; // 
        var android442 = {
            min: 10,
            max: 10,
            numPrompts: 10};          
        var android5 = {
            min: 10,
            max: 20,
            numPrompts: 10};
            
        if ( platform.os.family.includes("Android") ) {
            if (platform.os.version) {
              if (parseFloat(platform.os.version) < 5) { 
                return android442;
              } else { 
                return android5;
              }
            } else { // can't parse user agent... assume older version of Android/browser
                return android442;
            }
        } else {
            return desktop;
        }
    }

    this.view = {
        displayWaveform: true,
        // corresponds to the maximum number of prompts that a user can select from the 
        // drop-down menu selector;  This value changes based on type of device being used.
        increment: 5,
        numPromptsToRead: getNumPromptsRange(),
    }

    this.uploader = {
      maxMinutesSinceLastSubmission: 120,
    }

    this.controller = {
      recording_timeout: 20000, // 20 seconds - silence detection should remove leading and trailing silence
      recording_stop_delay: 500, // 0.5 seconds between when stop button is clicked and app actually stops recording
    }

    // FireFox on (all platforms) can record 32-bit float, but cannot play back 32-bit 
    // float; therefore only use 16bit bit depth on all versions of Firefox
    if ( platform.name.includes("Firefox") ) { 
      this.audio.bitDepth = 16;
    } 

    // ### ANDROID #############################################################
    if ( platform.os.family.includes("Android") ) {
        if (platform.os.version) {
            if (parseFloat(platform.os.version) < 5) {
                // TODO might need to make this user adjustable if have powerful, but older smartphone
                this.audio.vad.maxsilence = 650; // detect longer silence period on older Android devices
                this.audio.vad.minvoice = 75; // use shorter min voice threshold period on older Android devices
                this.audio.blockDisplayOfRecordButton = true;

                //this.controller.platform = 'smartphone';
                //this.view.platform = 'smartphone';           
                this.controller.recording_stop_delay = 750;
            }
        }
    }

    // ### DEBUGGING #############################################################
    if ( ! (window.location.origin === 'https://voxforge.github.io') ) {
        this.view.increment = 3;              
        this.view.numPromptsToRead = {
            min: 3,
            max: 12,
            numPrompts: 3};
        this.controller.platform = 'smartphone';
        this.view.platform = 'smartphone';       
        //this.controller.numPrompt2SubmittForRecordInfo = 1;
        //this.uploader.maxMinutesSinceLastSubmission = 1; // only relevant if recording information is included with submission
    }    
}
