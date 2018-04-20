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
*/

/**
* FireFox (on Linux) can record in 32-bit float, but cannot replay what 
* it just recorded...
* see: https://stackoverflow.com/questions/26169678/why-certain-wav-files-cannot-be-decoded-in-firefox
* https://bugzilla.mozilla.org/show_bug.cgi?id=524109

*/

// TODO silence detection
// see: https://aws.amazon.com/blogs/machine-learning/capturing-voice-input-in-a-browser/



// recording Web Worker
var audioworker = new Worker('/assets/static/lib/EncoderWorker.js');

/**
* if page reloaded kill background worker threads before page reload
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
function Audio () {
    // 'self' used to save current context when calling function references
    var self = this;

    // object attributes
    this.audioCtx = new (window.AudioContext || webkitAudioContext)();
    this.microphoneLevel = null;
    this.processor = undefined;  
    this.analyser = null;
    this.mediaStreamOutput = null;
    
    // private variables
    var microphone = null;

    /**
    * Older browsers might not implement mediaDevices at all, so we set an empty 
    * object first
    * see: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    */
    if (navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {};
    }

    var constraints = { audio: true };
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
          document.querySelector('.info-display').innerText = 
            'Your device does not support the HTML5 API needed to record audio';  
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
      console.log('getUserMedia supported.');
      setupAudioNodes(stream);
    })
    .catch(function(err) {
      window.alert("Could not get audio input - reason: " + err);
      console.error('The following error occured: ' + err);
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
      microphone = self.audioCtx.createMediaStreamSource(stream);
      self.microphoneLevel = self.audioCtx.createGain();
      self.analyser = self.audioCtx.createAnalyser();
      self.vad_analyser = self.audioCtx.createAnalyser();
      self.processor = self.audioCtx.createScriptProcessor(undefined , 2, 2);
      self.mediaStreamOutput = self.audioCtx.destination;

      microphone.channelCount = 1;
      self.microphoneLevel.channelCount = 1;
      self.microphoneLevel.gain.setTargetAtTime(1.0, self.audioCtx.currentTime, 0.7);
      self.mediaStreamOutput.channelCount = 1;

      microphone.connect(self.microphoneLevel); 

      profile.sample_rate = self.audioCtx.sampleRate;
      profile.sample_rate_format = "16 bit";

      profile.channels = self.mediaStreamOutput.channelCount;

      console.info('channels: ' + self.mediaStreamOutput.channelCount);
      console.info('audioCtx.sampleRate: ' + self.audioCtx.sampleRate);
      console.info('microphoneLevel.gain.value: ' + self.microphoneLevel.gain.value);
    }

    /**
    * after this process sends a request to the worker to 'finish' recording,
    * worker sends back the recorded data as an audio blob
    */
    audioworker.onmessage = function(event) { 
      view.waveformdisplay(event.data.blob); 
    }; 
}

/**
* connect nodes; tell worker to start recording audio 
*
//see https://github.com/higuma/wav-audio-encoder-js 
*/
Audio.prototype.record = function () {
    /**
    * function used as a parameter to audioworker captures audio buffer data 
    * from processor worker
    *
    * TODO couldn't this be used inside EncoderWorker?
    * this seems like it is not a callback, but an anonymous function used within audioworker
    */
    var leading_silence_clipped = false;
    var energy_treshhold = 0.05;
    var lowest_energy_event;
    var lowest_energy = 1.0;

    this.microphoneLevel.connect(this.analyser);
    this.microphoneLevel.connect(this.vad_analyser);
    this.microphoneLevel.connect(this.processor); 
    this.processor.connect(this.audioCtx.destination);

    //see: https://github.com/happyworm/Playful-Demos/blob/728cef5bbde8c5ffe6e61bf01073b4a6ce6eaae6/proofs/vad/README.md
    var options = {
        source: this.vad_analyser,
        voice_stop: function() {
          audioworker.postMessage({ 
            command: 'voice_stop', 
          });
        }, 
        voice_start: function() {
          audioworker.postMessage({ 
            command: 'voice_start', 
          });
        }
    }; 
    var vad = new VAD(options);

    visualize(this.analyser);

    // clears out audio buffer 
    audioworker.postMessage({
      command: 'start',
      sampleRate: this.audioCtx.sampleRate,
//      numChannels: 1
    });

    // start recording
    this.processor.onaudioprocess = function(event) {
      audioworker.postMessage({ 
        command: 'record', 
        buffers: event.inputBuffer.getChannelData(0) 
      });

    };
}

/**
* disconnect audio nodes; send message to audio worker to stop recording
*/
Audio.prototype.endRecording = function () {
    this.microphoneLevel.disconnect();
    this.processor.disconnect();

    audioworker.postMessage({ 
      command: 'finish' 
    });

    // TODO is this needed?
    return "ok";
}





