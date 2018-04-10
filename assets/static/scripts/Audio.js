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

    /*
    * Audio processing notes:
    * 1. bit rate in Audacity does not match bit rate of file:
    * WavAudioEncoder.js converts audio from 32-bit float to  16-bit signed.
    * Audacity, depending on quality settings (in preferences), will 
    * show whatever the default quality settings are... so even if audio recorded 
    * in 16-bit, it will display default quality... which might be 32-bit float.
    * - use ffprobe (part of ffmpeg suit) to read wav header file and tell
    * you actual bit rate:
        $  ffprob en000048.wav
         ... 
         Input #0, wav, from 'en000048.wav':
         Duration: 00:00:02.37, bitrate: 705 kb/s
         Stream #0:0: Audio: pcm_s16le ([1][0][0][0] / 0x0001), 44100 Hz, 1 channels, s16, 705 kb/s
        $ ffmpeg -formats | grep PCM
         DE s16le           PCM signed 16-bit little-endian
    * see: https://trac.ffmpeg.org/wiki/audio%20types
    *
    * 2. Why not just use 32 bit float in audio (with no downsample)?
    * Wavesufer can only use 16-bit, therefore would need two sets of audio:
    * one for display and one for saving as part of submission, which could be 
    * done given that saving audio is done as a background Web Worker process
    *
    * 3. Sometimes get scratches and pops when recording with Smartphone.
    * This might be the result of truncation distortion when converting from 
    * 32-bit float to 16-bit... may need to apply dithering and noise shapping
    * to address this issue
    * Dither is low volume noise, introduced into digital audio when converting 
    * from a higher bit-resolution to a lower bit-resolution.
    * The process of reducing bit-resolution causes quantization errors, also
    * known as truncation distortion, which if not prevented, can sound very
    * unpleasant.
    * see: http://darkroommastering.com/blog/dithering-explained
    * or it could simply be that my low end smartphone does not have neough 
    * processing power and the result is scratches and pops...
    */


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
    function getBuffers(event) {
      var buffers = [];
      // TODO can we simplify this loop to only capture one channel?
      for (var ch = 0; ch < 2; ++ch)
        buffers[ch] = event.inputBuffer.getChannelData(ch);
      return buffers;
    }

    this.microphoneLevel.connect(this.analyser);
    this.microphoneLevel.connect(this.processor); 
    this.processor.connect(this.audioCtx.destination);

    visualize(this.analyser);

    // clears out audio buffer 
    audioworker.postMessage({
      command: 'start',
      sampleRate: this.audioCtx.sampleRate,
      numChannels: 1
    });

    // start recording
    this.processor.onaudioprocess = function(event) {
      audioworker.postMessage({ 
        command: 'record', 
        buffers: getBuffers(event) 
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
