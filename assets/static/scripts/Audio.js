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

var audioworker = new Worker('/assets/static/scripts/AudioWorker.js');

/**
* if page reloaded kill background worker threads oldgain page reload
* to prevent zombie worker threads in FireFox
*/
$( window ).unload(function() {
   audioworker.terminate();
});

/**
* Global variable declaration
*/
// required to be global because this is used in shadow DOM to keep track of 
// audio recordings
var wavesurfer = [];

/**
* Class definition
*/
function Audio (parms) 
{
    // 'self' used to save current context when calling function references
    var self = this;

    this.parms = parms;
    this.audioCtx = new (window.AudioContext || webkitAudioContext)();
    this.microphone = null;
    this.processor = undefined;  
    this.mediaStreamOutput = null;
    this.analyser = null;
    this.gain_minValue = -3.4; // most-negative-single-float	Approximately -3.4028235e38
    this.gain_maxValue = 3.4; // 	most-positive-single-float	Approximately 3.4028235e38

    //var constraints = { audio: true };
    this.constraints = { 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
    };
}

// ### Methods #################################################################

Audio.prototype.init = function () {
    var self = this;

    /**
    * set up audio nodes that are connected together in a graph so that the 
    * source microphone input can be captured, and volume node can be created 
    * (currently not used), an analyzer to create visually display the amplitude
    * of the captured audio, a processor to capture the raw audio, and 
    * a destination audiocontext to capture audio
    *
    */
    function setupAudioNodes(stream) {
      return new Promise(function (resolve, reject) {

        // using 'self' because setupAudioNodes is being called as a parameter to 
        // getUserMedia, which means it is a reference, and therefore loses 'this'
        // context...
        self.microphone = self.audioCtx.createMediaStreamSource(stream);


        self.gainNode = self.audioCtx.createGain();
        self.processor = self.audioCtx.createScriptProcessor(self.parms.audioNodebufferSize , 1, 1);
        self.analyser = self.audioCtx.createAnalyser();
        self.mediaStreamOutput = self.audioCtx.destination;

        self.gainNode.channelCount = 1;
        self.processor.channelCount = 1;
        self.microphone.channelCount = 1;
        self.analyser.channelCount = 1;
        self.mediaStreamOutput.channelCount = 1;

        resolve(stream);
      }); // promise
    }

    /**
    *
    */
    function setProfileAudioProperties(track) {
          self.audioPropertiesAndContraints = {
            'sample_rate' : self.audioCtx.sampleRate,
            'bit_depth' : self.parms.bitDepth,
            'channels' : self.mediaStreamOutput.channelCount,
          };

          var c = navigator.mediaDevices.getSupportedConstraints();
          let s = track.getSettings();

          self.debugValues = {
            'browser_supports_echoCancellation' : (typeof c.echoCancellation == 'undefined') ? 'undefined' : c.echoCancellation,
            'browser_supports_noiseSuppression' : (typeof c.noiseSuppression == 'undefined') ? 'undefined' : c.noiseSuppression,
            'browser_supports_autoGain' : (typeof c.autoGainSupported == 'undefined') ? 'undefined' : c.autoGainSupported,

            'autoGainControl' : (typeof s.autoGainControl == 'undefined') ? 'undefined' : s.autoGainControl,
            'echoCancellation' : (typeof s.echoCancellation == 'undefined') ? 'undefined' : s.echoCancellation,
            'noiseSuppression' : (typeof s.noiseSuppression == 'undefined') ? 'undefined' : s.noiseSuppression,

            'channelCount' : (typeof s.channelCount == 'undefined') ? 'undefined' : s.channelCount,
            'latency' : (typeof s.latency == 'undefined') ? 'undefined' : s.latency,
            'volume' : (typeof s.volume == 'undefined') ? 'undefined' : s.volume,

            'vad_maxsilence' :  self.parms.vad.maxsilence,
            'vad_minvoice' : self.parms.vad.minvoice,
            'vad_bufferSize' : self.parms.vad.buffersize,
            'audioNode_bufferSize' : self.parms.audioNodebufferSize || 'undefined',
            'device_event_buffer_size' : self.device_event_buffer_size || 'undefined',
          };

          console.log('audioCtx.sampleRate: ' + self.audioCtx.sampleRate);
    }

    // #########################################################################

    /**
    * Older browsers might not implement mediaDevices at all, so we set an empty 
    * object first
    * see: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    */
    if (navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {};
    }

    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function(constraints) {

        // First get ahold of the legacy getUserMedia, if present
        var getUserMedia = ( navigator.getUserMedia ||
                             navigator.webkitGetUserMedia ||
                             navigator.mozGetUserMedia ||
                             navigator.msGetUserMedia);
        // Some browsers just don't implement it - return a rejected promise with 
        // an error to keep a consistent interface
        if (!getUserMedia) {
          console.error('getUserMedia not supported on your browser!');
          //document.querySelector('.info-display').innerText = page_alert_message.notHtml5_error;
          windows.alert( page_alert_message.notHtml5_error );
          document.querySelector('.prompt_id').innerText = "";
          return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
        }

        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
        return new Promise(function(resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      }
    }
    
    return new Promise(function (resolve, reject) {
        /**
        * asks the user for permission to use a media input which produces a 
        * MediaStream with tracks containing the requested types of media - i.e. audio track
        *
        * see: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
        */
        navigator.mediaDevices.getUserMedia(self.constraints)
        .then(setupAudioNodes)
        .then(function(stream) {
          setProfileAudioProperties(stream.getAudioTracks()[0]);
          resolve("OK");
        })
        .catch(function(err) {
          // TODO should this be done in View class?
          window.alert( page_alert_message.getUserMedia_error + " " + err);
          console.error(page_alert_message.getUserMedia_error + " " + err);
          reject("Not ok");
        });

    }); // promise
}

/**
*
*/
Audio.prototype.getAudioPropertiesAndContraints = function () {
    return this.audioPropertiesAndContraints;
}

/**
*
*/
Audio.prototype.getDebugValues = function () {
    return this.debugValues;
}

/**
* connect nodes; tell worker to start recording audio 
*/
Audio.prototype.record = function (prompt_id) {
    var self = this; // save context when calling inner functions

    var got_buffer_size = false;

    this.microphone.connect(this.gainNode); 
    this.gainNode.connect(this.processor); 
    this.gainNode.connect(this.analyser); 
    this.processor.connect(this.audioCtx.destination);

    // clears out audio buffer 
    audioworker.postMessage({
      command: 'start',
      prompt_id: prompt_id,
      vad_parms: this.parms.vad,
      ssd_parms : self.parms.ssd,
      sampleRate: this.audioCtx.sampleRate,
      bitDepth: this.parms.bitDepth,
    });

    // start recording
    this.processor.onaudioprocess = function(event) {
      // only record left channel (mono)
      var floatArray_time_domain = event.inputBuffer.getChannelData(0);

      if ( ! got_buffer_size ) {
        self.debugValues.device_event_buffer_size = floatArray_time_domain.length;
      }

      audioworker.postMessage({ 
        command: 'record', 
        event_buffer: floatArray_time_domain,
     });
    };

    /**
    * app auto gain - changes gain for *next* recording

        // TODO save gain level for future recordings
        // TODO update Prompts.json with gain level for each submission, 
        // since adjustments are made dynamically

        // chainging gain also increases noise in what were silence portions
        // and this might mess up VAD

        // tells user that audio is too loud or soft, adjusts
        // gain (volume) up or down, then tells them to delete the 
        // prompt and re-record at new gain level

    */
    function adjustVolume(obj) {
        if (Math.abs(obj.gain) < 3.4 ) {
            var newgain;
            if (obj.clipping) {
              // reduce volume
              newgain = Math.max(self.gainNode.gain.value * 
                  self.parms.gain_decrement_factor, self.gain_minValue);
              self.gainNode.gain.setValueAtTime(newgain, self.audioCtx.currentTime + 1);
            } else if (obj.too_soft) {
              // increase volume
              newgain = Math.min(self.gainNode.gain.value * 
                  self.parms.gain_increment_factor, self.gain_maxValue);
              self.gainNode.gain.setValueAtTime(newgain, self.audioCtx.currentTime + 1);
            } else if (obj.no_speech) {
              // increase max volume
              newgain = Math.min(self.gainNode.gain.value * 
                  self.parms.gain_max_increment_factor, self.gain_maxValue);
              self.gainNode.gain.setValueAtTime(newgain, self.audioCtx.currentTime + 1);
            }

            if (obj.clipping || obj.too_soft || obj.no_speech) {
              console.log ("gain changed from: " + obj.gain + " to: " + newgain);
              self.debugValues.gainNode_gain_value = newgain;
            }
        }
    }

    return new Promise(function (resolve, reject) {
      /**
      * reply from audio worker
      * creates new function every time record is pressed
      * why? needed a promise to resolve so could create promise chain in call to audio record
      */
      audioworker.onmessage = function(returnObj) { 
          var obj = returnObj.data.obj;
          switch (returnObj.data.status) {
              /**
              * after this process sends a request to the worker to 'finish' recording,
              * worker sends back the recorded data as an audio blob
              */
              case 'finished':
                obj.gain = self.gainNode.gain.value;
                obj.app_auto_gain = self.parms.app_auto_gain;
                if (obj.app_auto_gain) {
                  adjustVolume(obj); 
                }

                resolve(obj);
              break;

              default:
                let m = 'message from audio worker: audio error: ' + returnObj.status;
                console.error(m);
                reject(m);
          }
      }; 

    }); // promise
}

/**
* disconnect audio nodes; send message to audio worker to stop recording
*/
Audio.prototype.endRecording = function () {
    // trying to clear buffer because second recording sometimes includes end 
    // of previous recording
    this.processor.onaudioprocess=null;
    this.processor.disconnect();

    this.microphone.disconnect();

    audioworker.postMessage({ 
      command: 'finish' 
    });
}

