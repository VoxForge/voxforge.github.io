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
* Global variable declaration
*/
// required to be global because this is used in shadow DOM to keep track of 
// audio recordings
var wavesurfer = [];

/**
* Class definition
*/
function Audio (
    parms,
    pageVariables) 
{
    this.parms = parms.audio;
    this.alert_message = pageVariables.alert_message;

    this._setUpWorkers();    
    this._setDefaultProperties();
}

Audio.prototype._setUpWorkers = function() {
    var self = this;
    
    this.audioworker = new Worker('/assets/static/scripts/audio/AudioWorker.js');

    /**
    * if page reloaded kill background worker threads oldgain page reload
    * to prevent zombie worker threads in FireFox
    */
    $( window ).unload(function() {
       self.audioworker.terminate();
    });

}

Audio.prototype._setDefaultProperties = function() {
    this.audioCtx = new (window.AudioContext || webkitAudioContext)();
    this.microphone = null;
    this.processor = null;  
    this.mediaStreamOutput = null;
    this.analyser = null;

    this.stream = null;

    // rule is to collect speech audio that best reflects the user's environment,
    // therefore take whatever defaults user's device supports
    this.constraints = { audio: true };    
}

// ### Methods #################################################################

Audio.prototype.init = function () {
    /**
    * Older browsers might not implement mediaDevices at all, so we set an empty 
    * object first
    * see: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    */
    if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
    }

    if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia =
            this._polyfillPartiallyImplementedGetUserMediaOnOldBrowsers;
    }
    
    return this._setupGetUserMedia();
}


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

    // getUserMedia returns a Promise that resolves to a MediaStream object.
    return navigator.mediaDevices.getUserMedia(self.constraints)
        .then( self._setupAudioNodes.bind(self) )
        .then( self._setProfileAudioProperties.bind(self) )
        .catch(function(err) {
            window.alert(self.alert_message.getUserMedia_error + " " + err);
            console.error(self.alert_message.getUserMedia_error + " " + err);
        });
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
    this.stream = stream;
    
    this._createAudioNodes();
    this._setAllAudioNodesToMono();
    this._connectAudioNodes();   

    return("OK");
}

/*
 * TODO: In Chrome: ScriptProcessorNode is deprecated from the specification
 * and replaced with AudioWorklet.
 *
 * Why?: There are two problems in this design: the event handling is
 * asynchronous by design, and the code execution happens on the main thread
 *
 * Audio Worklet keeps the user-supplied JavaScript code all within the
 * audio processing thread — that is, it doesn’t have to jump over to the
 * main thread to process audio. This means the user-supplied script code
 * gets to run on the audio rendering thread (AudioWorkletGlobalScope) along
 * with other built-in AudioNodes, which ensures zero additional latency
 * and synchronous rendering.
 * 
 * see: https://developers.google.com/web/updates/2017/12/audio-worklet
 *
 * FireFox and Edge: https://github.com/GoogleChromeLabs/audioworklet-polyfill
 */
Audio.prototype._createAudioNodes = function() {
    this.microphone = this.audioCtx.createMediaStreamSource(this.stream);
    // TODO gainNode no longer being used
    this.gainNode = this.audioCtx.createGain();

    var numInputChannels = 1;
    var numOutputChannels = 1;    
    this.processor = this.audioCtx.createScriptProcessor(
        this.parms.audioNodebufferSize,
        numInputChannels,
        numOutputChannels);

    this.analyser = this.audioCtx.createAnalyser();
    this.mediaStreamOutput = this.audioCtx.destination;
}

Audio.prototype._setAllAudioNodesToMono = function() {
    this.microphone.channelCount = 1;
    // TODO gainNode no longer being used
    this.gainNode.channelCount = 1;
    this.processor.channelCount = 1;
    this.analyser.channelCount = 1;
    try{
        this.mediaStreamOutput.channelCount = 1;
    }
    catch (error){
        console.error(error);
    }
}

Audio.prototype._connectAudioNodes = function() {
    // TODO gainNode no longer being used    
    this.microphone.connect(this.gainNode);    
    this.gainNode.connect(this.processor);
    this.processor.connect(this.audioCtx.destination);
    this.gainNode.connect(this.analyser);    
}

Audio.prototype._setProfileAudioProperties = function () {
    this.autoGainSupported =
        navigator.mediaDevices.getSupportedConstraints().autoGainSupported;

    this._setAudioPropertiesAndContraints();
    var track = this.stream.getAudioTracks()[0];

    this.debugValues = new Audio.Debug(this.parms, track);
    this.debugValues.set();

    console.log('audioCtx.sampleRate: ' + this.audioCtx.sampleRate);
}

Audio.prototype._setAudioPropertiesAndContraints = function () {
    this.audioPropertiesAndContraints = {
        'sample_rate' : this.audioCtx.sampleRate,
        'bit_depth' : this.parms.bitDepth,
        'channels' : this.mediaStreamOutput.channelCount,
    };
}

Audio.prototype.getAudioPropertiesAndContraints = function () {
    return this.audioPropertiesAndContraints;
}

Audio.prototype.getDebugValues = function () {
    return this.debugValues;
}

/**
* tell worker to start recording audio
*/
Audio.prototype.record = function (
    prompt_id,
    vad_run,
    audio_visualizer_checked)
{
    var self = this;

    this._clearAndInitializeAudioBuffer(prompt_id, vad_run);
    if (audio_visualizer_checked) {
        this._enableVisualizer();
    }
    
    this.processor.onaudioprocess =
        this._sendAudioToWorkerForRecording.bind(this);
    return this._processResultsFromAudioWorkerWhenAvailable();
}

Audio.prototype._clearAndInitializeAudioBuffer = function (prompt_id, vad_run) {
    this.audioworker.postMessage({
        command: 'start',
        prompt_id: prompt_id,
        vad_run: vad_run,    
        vad_parms: this.parms.vad,
        sampleRate: this.audioCtx.sampleRate,
        bitDepth: this._getBitDepth(),
    });
}

Audio.prototype._getBitDepth = function () {
    var bitDepth = this.parms.bitDepth;

    // TODO create subclasses for 16 and 32 bit audio
    // to keep primitive conditionals at 'edge' of app
    if ( ! (bitDepth === 16 || bitDepth === "32bit-float") ) {
    console.warn("invalid bit depth: " +
        data.bitDepth +
        "; setting to 16 bit");
    bitDepth = 16;
    }

    return bitDepth;
}

Audio.prototype._enableVisualizer = function () {
    // TODO gainNode no longer being used
    this.gainNode.connect(this.analyser);
}

/*
 * event.inputBuffer.getChannelData(0) = left channel (mono)
 * event.inputBuffer.getChannelData(0) is a floatArray_time_domain
 * 
 *     // TODO is audioNodebufferSize always same device_event_buffer_size??
    // if so, then dont need this!!
 */
Audio.prototype._sendAudioToWorkerForRecording = function (event) {
    this.audioworker.postMessage({ 
        command: 'record', 
        event_buffer: event.inputBuffer.getChannelData(0),
    });

    if (typeof this.debugValues.device_event_buffer_size  == 'undefined') {
        this.debugValues.device_event_buffer_size =
            event.inputBuffer.getChannelData(0).length;
    }      
}

/**
* disconnect audio nodes; send message to audio worker to stop recording
*
* see: https://stackoverflow.com/questions/17648819/how-can-i-stop-a-web-audio-script-processor-and-clear-the-buffer
*
*
*     // disconnecting AudioNodes leaves audio data somewhere in audio chain
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
    *
    *     // need to cue user when recording has stopped and started.  Disconnecting
    // the analyser node and reconnecting on record does this...
*/
Audio.prototype.endRecording = function (audio_visualizer_checked, vad_run) {
    var self = this;

    this.audioworker.postMessage({ 
        command: 'finish',
    });

    // TODO this seems to create a bunch of zombie nodes that just sit in memory 
    // until garbage collected... there should be a better way
    this.processor.onaudioprocess = null;

    if (audio_visualizer_checked) {
        // TODO gainNode no longer being used
        self.gainNode.disconnect(self.analyser);
    }
}

/**
* reply from audio worker
* creates new function every time record is pressed
* why? needed a promise to resolve so could create promise chain in call
* to audio record
*
* after this process sends a request to the worker to 'finish' recording,
* worker sends back the recorded data as an audio blob in return object
*/
Audio.prototype._processResultsFromAudioWorkerWhenAvailable = function () {
    var self = this;

    return new Promise(function (resolve, reject) {

      self.audioworker.onmessage = function(returnObj) { 
        var obj = returnObj.data.obj;
        switch (returnObj.data.status) {
            case 'finished':
                resolve(obj);
            break;

            default:
                let m = 'message from audio worker: audio error: ' +
                    returnObj.status;
                console.error(m);
                reject(m);
        }
      };

    });
}

