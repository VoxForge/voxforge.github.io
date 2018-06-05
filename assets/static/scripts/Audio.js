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

/*
* Audio processing notes:
* 1. bit rate in Audacity does not match bit rate of file:
* WavAudioEncoder.js converts audio from 32-bit float to  16-bit signed.
* Audacity, depending on quality settings (in preferences), will 
* show whatever the default quality settings are... so even if audio recorded 
* in 16-bit, it will display default quality... which might be 32-bit float.
* - use ffprobe (part of ffmpeg suit) to read wav header file and tell
* you actual bit rate:
    $  ffprobe en000048.wav
     ... 
     Input #0, wav, from 'en000463.wav':
      Duration: 00:00:02.51, bitrate: 1411 kb/s
        Stream #0:0: Audio: pcm_s32le ([1][0][0][0] / 0x0001), 44100 Hz, 1 channels, s32, 1411 kb/s
    $ ffmpeg -formats | grep PCM
     DE s32le           PCM signed 32-bit little-endian
* use: quelcom tool: qwavheaderdump
* see: https://www.hecticgeek.com/2012/06/fix-wav-header-errors-ubuntu-linux/
    $ qwavheaderdump -F en000463.wav
    en000463.wav (442412 bytes):
        riff: 'RIFF'
        riff length: 442404
        wave: 'WAVE'
        fmt: 'fmt '
        fmt length: 16
        format: 3
	        format field should 1 (pcm tag)
	        fixed
        channels: 1
        sample rate: 44100
        bytes/second: 176400
        bytes/sample: 4
        bits/sample: 32
        data: 'data'
        data length: 442368

* see: https://trac.ffmpeg.org/wiki/audio%20types
*
* 2. Why not just use 32 bit float in audio (with no downsample)?
* Chrome support recording and playback with 32-bit float wav format.
* Firefox HTML5 implementation can only play uncmopressed PCM audio at
* 8 or 16 bits per sample
  (https://support.mozilla.org/en-US/kb/html5-audio-and-video-firefox
  see also: see also https://bugzilla.mozilla.org/show_bug.cgi?id=524109)
* even thought it can record at 32-bit float... 
  (The buffer contains data in the following format:  non-interleaved IEEE754 
  32-bit linear PCM with a nominal range between -1 and +1, that is, 
  32bits floating point buffer, with each samples between -1.0 and 1.0.
  see: https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer)
* Wavesurfer was originally thought to be the problem but it is a actually Firefox...
*
* therefore would need two sets of audio:
* one for display and one for saving as part of submission, which could be 
* done given that saving audio is done as a background Web Worker process
*
* 3. Sometimes get scratches and pops when recording with Smartphone (Android 442 Samsung Galaxy)
* set recording to 32-bit float and still get scratches and pops in Firefox...
* Chrome seems to work better
*
* This might be the result of truncation distortion when converting from 
* 32-bit float to 16-bit... may need to apply dithering and noise shapping
* to address this issue
* Dither is low volume noise, introduced into digital audio when converting 
* from a higher bit-resolution to a lower bit-resolution.
* The process of reducing bit-resolution causes quantization errors, also
* known as truncation distortion, which if not prevented, can sound very
* unpleasant.
* see: http://darkroommastering.com/blog/dithering-explained
* and:  http://wiki.audacityteam.org/wiki/Dither
* or it could simply be that my low end smartphone does not have neough 
* processing power and the result is scratches and pops...


* volume slider demo
* view-source:https://robwu.nl/s/mediasource-change-volume.html
*/

/**
* FireFox (on Linux) can record in 32-bit float, but cannot replay what 
* it just recorded...
* see: https://stackoverflow.com/questions/26169678/why-certain-wav-files-cannot-be-decoded-in-firefox
* https://bugzilla.mozilla.org/show_bug.cgi?id=524109

*/

'use strict';

// recording Web Worker
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

    /**
    * Older browsers might not implement mediaDevices at all, so we set an empty 
    * object first
    * see: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    */
    if (navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {};
    }

    // Note: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext
    // BaseAudioContext.sampleRate Read only
    //    Returns a float representing the sample rate (in samples per second) 
    //    used by all nodes in this context. The sample-rate of an
    //    AudioContext _cannot_ be changed.
    // see: https://stackoverflow.com/questions/37326846/disabling-auto-gain-conctrol-with-webrtc-app
    // turning these off does not seem to work in Firefox android 442.

    //var constraints = { audio: true };
    var constraints = { 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
    };

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

    /**
    * asks the user for permission to use a media input which produces a 
    * MediaStream with tracks containing the requested types of media - i.e. audio track
    *
    * see: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    */
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      setupAudioNodes(stream);
    })
    .catch(function(err) {
      window.alert( page_alert_message.getUserMedia_error + " " + err);
      console.error(page_alert_message.getUserMedia_error + " " + err);
    });

    /**
    * set up audio nodes that are connected together in a graph so that the 
    * source microphone input can be captured, and volume node can be created 
    * (currently not used), an analyzer to create visually display the amplitude
    * of the captured audio, a processor to capture the raw audio, and 
    * a destination audiocontext to capture audio
    *
    */
    function setupAudioNodes(stream) {
      // using 'self' because setupAudioNodes is being called as a parameter to 
      // getUserMedia, which means it is a reference, and therefore loses 'this'
      // context...
      self.microphone = self.audioCtx.createMediaStreamSource(stream);

      // see: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createScriptProcessor
/*    The buffer size in units of sample-frames. If specified, the bufferSize 
      must be one of the following values: 256, 512, 1024, 2048, 4096, 8192, 16384. 
      This value controls how frequently the audioprocess event is dispatched
      and how many sample-frames need to be processed each call. 

      *** Lower values for bufferSize will result in a lower (better) latency. 
      Higher values will be necessary to avoid audio breakup and glitches. ***

      It is recommended 
      for authors to not specify this buffer size and allow the implementation 
      to pick a good buffer size to balance between latency and audio quality.
            -but-
      But VAD does not work well enough with Android 4.4.2 default buffer size of
      16384, so chunk up audio oldgain sending to VAD

      auto gain adjust:
      see: https://robwu.nl/s/mediasource-change-volume.html
*/
      self.gainNode = self.audioCtx.createGain();
      self.processor = self.audioCtx.createScriptProcessor(self.parms.audioNodebufferSize , 1, 1);
      self.analyser = self.audioCtx.createAnalyser();
      self.mediaStreamOutput = self.audioCtx.destination;

      self.gainNode.channelCount = 1;
      self.processor.channelCount = 1;
      self.microphone.channelCount = 1;
      self.analyser.channelCount = 1;
      self.mediaStreamOutput.channelCount = 1;

      setProfileAudioProperties(stream.getAudioTracks()[0]);
    }

    /*
      see: https://developer.mozilla.org/en-US/docs/Web/API/Media_Streams_API/Constraints#Applying_constraints
      constraints vs settings: Constraints are a way to specify 
      what values you need, want, and are willing to accept for the various 
      constrainable properties (as described in the documentation for 
      MediaTrackConstraints), while settings are the actual values of each 
      constrainable property at the current time.
      https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/applyConstraints
      https://rawgit.com/w3c/mediacapture-main/master/getusermedia.html#def-constraint-autoGainControl
    */
    function setProfileAudioProperties(track) {
      self.audioPropertiesAndContraints = {
        'sample_rate' : self.audioCtx.sampleRate,
        'bit_depth' : self.parms.bitDepth,
        'channels' : self.mediaStreamOutput.channelCount,
      };

      //https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getSupportedConstraints
      var c = navigator.mediaDevices.getSupportedConstraints();
      //https://blog.mozilla.org/webrtc/fiddle-of-the-week-audio-constraints/
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
*
//see https://github.com/higuma/wav-audio-encoder-js 

*/
Audio.prototype.record = function (prompt_id, last_one) {
    var self = this; // save context when calling inner functions

    var got_buffer_size = false;

    // script processor node introduces a large amount of audio 
    // latency, at least 2048 samples in your example (because he 
    // used:  audioCtx.createScriptProcessor(2048, 1, 1);_+ script execution time
    // but this is only relevant if you are trying to display realtime wavform
    // in a vuew meter or something lie that.
    // see: https://stackoverflow.com/questions/47380352/webaudio-analyser-not-returning-any-data
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
      // debugging - see if this helps with drops outs and scratches on low powered Android
      // var floatArray_time_domain = event.inputBuffer.getChannelData(0).slice();

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

    return new Promise(function (resolve, reject) {
      // reply from audio worker
      // creates new function every time record is pressed
      // why? needed a promise to resolve so could create promise chain in call to audio record
      audioworker.onmessage = function(returnObj) { 
          var obj = returnObj.data.obj;
          switch (returnObj.data.status) {
              /**
              * after this process sends a request to the worker to 'finish' recording,
              * worker sends back the recorded data as an audio blob
              */
              case 'finished':
                // TODO save gain level for future recordings
                // TODO update Prompts.json with gain level for each submission, 
                // since adjustments are made dynamically

                // chainging gain also increases noise in what were silence portions
                // and this messes up VAD

                // tells user that audio is too loud or soft, adjusts
                // gain (volume) up or down, then tells them to delete the 
                // prompt and re-record at new gain level
                var oldgain = self.gainNode.gain.value;
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
                  console.log ("gain changed from: " + oldgain + " to: " + newgain);
                  self.debugValues.gainNode_gain_value = newgain;
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

