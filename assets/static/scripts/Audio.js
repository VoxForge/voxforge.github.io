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
function Audio (parms,
                pageVariables) 
{
    // 'self' used to save current context when calling function references
    var self = this;

    this.parms = parms;
    this.audioCtx = new (window.AudioContext || webkitAudioContext)();
    this.microphone = null;
    this.processor = null;  
    this.mediaStreamOutput = null;
    this.analyser = null;
    this.gain_minValue = -3.4; // most-negative-single-float	Approximately -3.4028235e38
    this.gain_maxValue = 3.4; // most-positive-single-float	Approximately 3.4028235e38

    // rule is to collect speech audio that best reflects the user's environment, therefore
    // take whatever defaults user's device supports
    this.constraints = { audio: true };

    this.alert_message = pageVariables.alert_message;
}

// ### Methods #################################################################

Audio.prototype.init = function () {
    var self = this;

    // #########################################################################
    if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
    }

    if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia =
            this._polyfillPartiallyImplementedGetUserMediaOnOldBrowsers;
    }
    
    this.autoGainSupported =
        navigator.mediaDevices.getSupportedConstraints().autoGainSupported;

    return this._setupGetUserMedia();
}

/**
* Older browsers might not implement mediaDevices at all, so we set an empty 
* object first
* see: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
*/
Audio.prototype._polyfillPartiallyImplementedGetUserMediaOnOldBrowsers =
    function(constraints)
{
    // First get ahold of the legacy getUserMedia, if present
    var getUserMedia = ( navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia);
                         
    // Some browsers just don't implement it - return a rejected promise with 
    // an error to keep a consistent interface
    if (!getUserMedia) {
        console.error('getUserMedia not supported on your browser!');
        //document.querySelector('.info-display').innerText = self.alert_message.notHtml5_error;
        windows.alert( self.alert_message.notHtml5_error );
        document.querySelector('.prompt_id').innerText = "";
        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
    }

    // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
    return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
    });
}

/**
* asks the user for permission to use a media input which produces a 
* MediaStream with tracks containing the requested types of media - i.e. audio track
*
* see: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
*/
Audio.prototype._setupGetUserMedia = function() {
    var self = this;
    
    return new Promise(function (resolve, reject) {

        navigator.mediaDevices.getUserMedia(self.constraints)
        .then( self._setupAudioNodes.bind(self) )
        .then(function(stream) {
          self.stream = stream;
          self.setProfileAudioProperties(stream.getAudioTracks()[0]);

          resolve("OK");
        })
        .catch(function(err) {
          // TODO should this be done in View class?
          window.alert( self.alert_message.getUserMedia_error + " " + err);
          console.error(self.alert_message.getUserMedia_error + " " + err);
          reject("Not ok");
        });

    }); // promise
}
    

/**
* set up audio nodes that are connected together in a graph so that the 
* source microphone input can be captured, and volume node can be created,
* an analyzer to create visually display the amplitude
* of the captured audio, a processor to capture the raw audio, and 
* a destination audiocontext to capture audio
*
*/
Audio.prototype._setupAudioNodes = function(stream) {
    var self = this;
        
    self.microphone = self.audioCtx.createMediaStreamSource(stream);

    self.gainNode = self.audioCtx.createGain();
    // Create a ScriptProcessorNode with a bufferSize of audioNodebufferSize and a single input and output channel
    self.processor = self.audioCtx.createScriptProcessor(self.parms.audioNodebufferSize, 1, 1);
    self.analyser = self.audioCtx.createAnalyser();
    self.mediaStreamOutput = self.audioCtx.destination;

    self.microphone.channelCount = 1;
    self.gainNode.channelCount = 1;
    self.processor.channelCount = 1;
    self.analyser.channelCount = 1;
    self.mediaStreamOutput.channelCount = 1;

    self.microphone.connect(self.gainNode);    
    self.gainNode.connect(self.processor);
    self.processor.connect(self.audioCtx.destination);
    self.gainNode.connect(self.analyser);        

    return(stream);
}

Audio.prototype.setProfileAudioProperties = function (track) {
    this._setAudioPropertiesAndContraints();
    this._setDebugValues(track);

    console.log('audioCtx.sampleRate: ' + this.audioCtx.sampleRate);
}

Audio.prototype._setAudioPropertiesAndContraints = function () {
    this.audioPropertiesAndContraints = {
        'sample_rate' : this.audioCtx.sampleRate,
        'bit_depth' : this.parms.bitDepth,
        'channels' : this.mediaStreamOutput.channelCount,
    };
}

Audio.prototype._setDebugValues = function (track) {
      var c = navigator.mediaDevices.getSupportedConstraints();
      let s = track.getSettings();

      this.debugValues = {
        'browser_supports_echoCancellation' :
            (typeof c.echoCancellation == 'undefined') ? 'undefined' : c.echoCancellation,
        'browser_supports_noiseSuppression' :
            (typeof c.noiseSuppression == 'undefined') ? 'undefined' : c.noiseSuppression,
        'browser_supports_autoGain' :
            (typeof c.autoGainSupported == 'undefined') ? 'undefined' : c.autoGainSupported,

        'autoGainControl' :
            (typeof s.autoGainControl == 'undefined') ? 'undefined' : s.autoGainControl,
        'echoCancellation' :
            (typeof s.echoCancellation == 'undefined') ? 'undefined' : s.echoCancellation,
        'noiseSuppression' :
            (typeof s.noiseSuppression == 'undefined') ? 'undefined' : s.noiseSuppression,

        'channelCount' :
            (typeof s.channelCount == 'undefined') ? 'undefined' : s.channelCount,
        'latency' :
            (typeof s.latency == 'undefined') ? 'undefined' : s.latency,
        'volume' :
            (typeof s.volume == 'undefined') ? 'undefined' : s.volume,

        'vad_maxsilence' :  this.parms.vad.maxsilence,
        'vad_minvoice' : this.parms.vad.minvoice,
        'vad_bufferSize' : this.parms.vad.buffersize,
        'audioNode_bufferSize' : this.parms.audioNodebufferSize || 'undefined',
        'device_event_buffer_size' : this.device_event_buffer_size || 'undefined',
      };

}

Audio.prototype.getAudioPropertiesAndContraints = function () {
    return this.audioPropertiesAndContraints;
}

Audio.prototype.getDebugValues = function () {
    return this.debugValues;
}

/**
* connect nodes; tell worker to start recording audio 
*/
Audio.prototype.record = function (prompt_id, vad_run, audio_visualizer_checked) {
    var self = this; // save context when calling inner functions

    if ( ! vad_run ) {
       console.log('VAD disabled');
    }

    var bitDepth = self.parms.bitDepth;
    if ( ! (bitDepth === 16 || bitDepth === "32bit-float") ) {
      console.warn("invalid bit depth: " + data.bitDepth + "; setting to 16 bit");
      bitDepth = 16;
    }
      
    // clears out audio buffer 
    audioworker.postMessage({
      command: 'start',
      prompt_id: prompt_id,
      vad_parms: self.parms.vad,
      ssd_parms : self.parms.ssd,
      sampleRate: self.audioCtx.sampleRate,
      bitDepth: bitDepth,
    });

    if (audio_visualizer_checked) {
        self.gainNode.connect(self.analyser);
    }

    var command;
    if (vad_run) {
       audioworker.postMessage({ 
          command: 'init_vad',
       });
       command = 'record_vad';
    } else {
       audioworker.postMessage({ 
          command: 'kill_vad',
       });       
       command = 'record';
    }
    // start recording
    this.processor.onaudioprocess = function(event) {
      // event.inputBuffer.getChannelData(0) = left channel (mono)
      audioworker.postMessage({ 
        command: command, 
        event_buffer: event.inputBuffer.getChannelData(0),
      });

      if (typeof self.debugValues.device_event_buffer_size  == 'undefined') {
          // event.inputBuffer.getChannelData(0) is a floatArray_time_domain
          self.debugValues.device_event_buffer_size = event.inputBuffer.getChannelData(0).length;
      }      
    };

    /**
    * app auto gain - changes gain for *next* recording

        // TODO save gain level for future recordings
        // TODO update Prompts.json with gain level for each submission, 
        // since adjustments are made dynamically

        // changing gain also increases noise in what were silence portions
        // and this might mess up VAD

        // tells user that audio is too loud or soft, adjusts
        // gain (volume) up or down, then tells them to delete the 
        // prompt and re-record at new gain level

    */
    function adjustVolume(obj) {
        if (Math.abs(obj.gain) < self.gain_maxValue ) {
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

                // some phones have their own (hardware/software?) auto gain implemented.
                // Where device has own auto gain, do not use adjustVolume() function
                if (obj.app_auto_gain && ! this.autoGainSupported) {
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
*
* see: https://stackoverflow.com/questions/17648819/how-can-i-stop-a-web-audio-script-processor-and-clear-the-buffer
*/
Audio.prototype.endRecording = function (audio_visualizer_checked, vad_run) {
    var self = this;
    
    var command;
    if (vad_run) {
      command = 'finish_vad';
    } else {
      command = 'finish';
    }
    audioworker.postMessage({ 
      command: command,
    });

    // disconnecting AudioNodes leaves audio data somewhere in audio chain
    // (likely in microphone Audio node - MediaStreamSource buffer) that gets added
    // to next recording... therefore do not disconnect Audio Nodes
    //self.microphone.disconnect(); // all outgoing connections are disconnected.
    //self.gainNode.disconnect();
    //self.processor.disconnect();

    // but if don't disconnect, audio will be collected by Audio Nodes, and sent to AudioWorker.
    // Therefore remove function that sends audio to AudioWorker
    // TODO amazon just sets a 'record' flag that if true sends audio to web
    //   worker, and doesn't send anything if false
    //   see: https://aws.amazon.com/blogs/machine-learning/capturing-voice-input-in-a-browser/
    //   see also: https://github.com/mattdiamond/Recorderjs/blob/master/src/recorder.js    
    this.processor.onaudioprocess = null;

    // need to cue user when recording has stopped and started.  Disconnecting
    // the analyser node and reconnecting on record does this...
    if (audio_visualizer_checked) {
        self.gainNode.disconnect(self.analyser);
    }
}
