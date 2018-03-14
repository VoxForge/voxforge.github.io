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
    // 'self' used to save the current context when calling function references
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
    // TODO need to test this code... set navigator.mediaDevices.getUserMedia=null then run as test
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
          console.log('getUserMedia not supported on your browser!');
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

        // starts entire application... not very clear from here...
        //setUpFSM();

      })
      .catch(function(err) {
        window.alert("Could not get audio input - reason: " + err);
        console.log('The following error occured: ' + err);
      });

    /**
    * set up audio nodes that are connected together in a graph so that the 
    * source microphone input can be captured, and volume node can be created 
    * (currently not used), an analyzer to create visually display the amplitude
    * of the captured audio, a processor to capture the raw audio, and 
    * a destination audiocontext to capture audio
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
      // TODO need to validate this or at least get it from audio context somehow
      profile.sample_rate_format = "32 bit float";
      profile.channels = self.mediaStreamOutput.channelCount;

      console.log('channels: ' + self.mediaStreamOutput.channelCount);
      console.log('audioCtx.sampleRate: ' + self.audioCtx.sampleRate);
      console.log('microphoneLevel.gain.value: ' + self.microphoneLevel.gain.value);
    }

    /**
    * after this process sends a request to the worker to 'finish' recording,
    * worker sends back the recorded data as an audio blob
    */
    audioworker.onmessage = function(event) { 
      // TODO should this be a callback?
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
    * captures audio buffer data from processor worker
    */
    function getBuffers(event) {
      var buffers = [];
      for (var ch = 0; ch < 2; ++ch)
        buffers[ch] = event.inputBuffer.getChannelData(ch);
      return buffers;
    }

    this.microphoneLevel.connect(this.analyser);
    this.microphoneLevel.connect(this.processor); 
    this.processor.connect(this.audioCtx.destination);

    visualize(this.analyser);

    // clears out audio buffer 
    this.processor.onaudioprocess = function(event) {
      audioworker.postMessage({ 
        command: 'record', 
        buffers: getBuffers(event) 
      });
    };

    // start recording
    audioworker.postMessage({
      command: 'start',
      sampleRate: this.audioCtx.sampleRate,
      numChannels: 1
    });

    console.log('recording audioCtx.sampleRate: ' + this.audioCtx.sampleRate);
}

/**
* disconnect audio nodes; send message to audio worker to stop recording

TODO need a better way to clear buffer because a recording that gets cut off
sometimes gets partially included in next recording... some buffer is not
getting totally cleared...
*/
Audio.prototype.endRecording = function () {
    this.microphoneLevel.disconnect();
    this.processor.disconnect();

    audioworker.postMessage({ 
      command: 'finish' 
    });

    return "ok";
}
