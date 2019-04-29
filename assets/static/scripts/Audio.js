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

var audioworker = new Worker('/assets/static/scripts/audio/AudioWorker.js');

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
    this.parms = parms;
    this.alert_message = pageVariables.alert_message;
    
    this._setDefaultProperties();
}

Audio.prototype._setDefaultProperties = function() {
    this.audioCtx = new (window.AudioContext || webkitAudioContext)();
    this.microphone = null;
    this.processor = null;  
    this.mediaStreamOutput = null;
    this.analyser = null;

    // rule is to collect speech audio that best reflects the user's environment, therefore
    // take whatever defaults user's device supports
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
    this._createAudioNodes(stream);
    this._setAllAudioNodesToMono(stream);
    this._connectAudioNodes(stream);   

    return(stream);
}

Audio.prototype._createAudioNodes = function(stream) {
    this.microphone = this.audioCtx.createMediaStreamSource(stream);
    this.gainNode = this.audioCtx.createGain();
    
    var numInputChannels = 1;
    var numOuputChannels = 1;    
    this.processor = this.audioCtx.createScriptProcessor(
        this.parms.audioNodebufferSize,
        numInputChannels,
        numOuputChannels);

    this.analyser = this.audioCtx.createAnalyser();
    this.mediaStreamOutput = this.audioCtx.destination;
}

Audio.prototype._setAllAudioNodesToMono = function(stream) {
    this.microphone.channelCount = 1;
    this.gainNode.channelCount = 1;
    this.processor.channelCount = 1;
    this.analyser.channelCount = 1;
    this.mediaStreamOutput.channelCount = 1;
}

Audio.prototype._connectAudioNodes = function(stream) {
    this.microphone.connect(this.gainNode);    
    this.gainNode.connect(this.processor);
    this.processor.connect(this.audioCtx.destination);
    this.gainNode.connect(this.analyser);    
}

Audio.prototype._setProfileAudioProperties = function (stream) {
    this.stream = stream;
    
    this.autoGainSupported =
        navigator.mediaDevices.getSupportedConstraints().autoGainSupported;

    this._setAudioPropertiesAndContraints();
    var track = stream.getAudioTracks()[0];
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
    var s = track.getSettings();
    this.debugValues = {};
    
    this._browserSupportedProperties(c,s);
    this._propertiesActuallyTurnedOn(c,s);
    this._audioProperties(c,s);
    this._appRecordingProperties(c,s);     
}

Audio.prototype._browserSupportedProperties = function (c,s) {
    var d = this.debugValues;
    d.browser_supports_echoCancellation =
        (typeof c.echoCancellation == 'undefined') ? 'undefined' : c.echoCancellation;
    d.browser_supports_noiseSuppression =
        (typeof c.noiseSuppression == 'undefined') ? 'undefined' : c.noiseSuppression;
    d.browser_supports_autoGain =
        (typeof c.autoGainSupported == 'undefined') ? 'undefined' : c.autoGainSupported;
}

Audio.prototype._propertiesActuallyTurnedOn = function (c,s) {
    var d = this.debugValues;    
    d.echoCancellation =
        (typeof s.echoCancellation == 'undefined') ? 'undefined' : s.echoCancellation;
    d.noiseSuppression =
        (typeof s.noiseSuppression == 'undefined') ? 'undefined' : s.noiseSuppression;              
    d.autoGainControl =
        (typeof s.autoGainControl == 'undefined') ? 'undefined' : s.autoGainControl;
}

Audio.prototype._audioProperties = function (c,s) {
    var d = this.debugValues;    
    d.channelCount =
        (typeof s.channelCount == 'undefined') ? 'undefined' : s.channelCount;
    d.latency =
        (typeof s.latency == 'undefined') ? 'undefined' : s.latency;
    d.volume =
        (typeof s.volume == 'undefined') ? 'undefined' : s.volume;
}

Audio.prototype._appRecordingProperties = function (c,s) {
    var d = this.debugValues;
    
    d.vad_maxsilence = this.parms.vad.maxsilence;
    d.vad_minvoice = this.parms.vad.minvoice;
    d.vad_bufferSize = this.parms.vad.buffersize;
    d.audioNode_bufferSize = this.parms.audioNodebufferSize || 'undefined';

    // TODO is audioNodebufferSize always same device_event_buffer_size??    
    //d.device_event_buffer_size = this.device_event_buffer_size || 'undefined';
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
    audioworker.postMessage({
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
    audioworker.postMessage({ 
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

    audioworker.postMessage({ 
        command: 'finish',
    });

    this.processor.onaudioprocess = null;

    if (audio_visualizer_checked) {
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

      audioworker.onmessage = function(returnObj) { 
        var obj = returnObj.data.obj;
        switch (returnObj.data.status) {
            case 'finished':
                //self._setGainAndAdjustVolumeIfNeeded.bind(self, obj); // TODO does not ever get called
                resolve(obj);
            break;

            default:
                let m = 'message from audio worker: audio error: ' +
                    returnObj.status;
                console.error(m);
                reject(m);
        }
      };

    }); // promise
}

Audio.prototype.setGainAndAndAdjustVolumeIfNeeded = function (obj) {
    var audioLevels = new AudioLevels(
        this.parms,    
        obj,
        this.autoGainSupported,
        this.gainNode,
        this.audioCtx,
        this.debugValues, );        
    audioLevels.adjust();

    return obj;
}

// #############################################################################
// TODO user needs to be able to disable automatic recording volume adjuster
function AudioLevels(parms, obj, autoGainSupported, gainNode, audioCtx, debugValues) {
    this.gain_decrement_factor = parms.gain_decrement_factor;
    this.gain_increment_factor = parms.gain_increment_factor;
    this.gain_max_increment_factor = parms.gain_max_increment_factor;

    this.autoGainSupported = autoGainSupported;
    this.currentTime = audioCtx.currentTime;
    
    this.gainNode = gainNode;           
    this.gainValue = this.gainNode.gain.value;  
    this.gain_minValue = -3.4; // most-negative-single-float	Approximately -3.4028235e38
    this.gain_maxValue = 3.4; // most-positive-single-float	Approximately 3.4028235e38

    this.obj = obj;
    this.obj.platform = parms.platform;
    this.obj.gain = gainNode.gain.value;

    this.debugValues = debugValues;
}

/**
 * Problem: user cannot adjust volume on smartphones; need some way to do so:
 * Solution:
 *      A. Voxforge app automatic recording volume control
 *      B. allow user to adjust recording volume using slider
 * TODO: allow user to disable VF software auto recorder volume adjust
 * 
 * I. on Desktops
 *      a. will always let user manually adjust volume;
 *      b. browser may have software auto ajust of recording volume (autogain);
 *   If browser has autogain or not: don't use VoxForge volume adjuster
 * 
 * II. on Smartphones
 *      a. smartphone has software/hardware automatic microphone adjuster
 *      (does not matter whether it is in O/S/ or browser)
 *          - don't use VoxForge volume adjuster
 *      b. if not: use Voxforge software gain adjustment
 */
AudioLevels.prototype.adjust = function () {
    if ( this.obj.platform == 'smartphone' ) {
        this._adjustVolume(); 
    }
}

/**
* app auto gain - changes gain for the *next* recording (not the current one)
*
* changing gain also increases noise in what were silence portions
* and this might mess up VAD
*
* tells user that audio is too loud or soft, adjusts
* gain (volume) up or down, then tells them to delete the 
* prompt and re-record at new gain level
*/
AudioLevels.prototype._adjustVolume = function () {
    if (this.obj.clipping) {
        this._reduceVolume();
    } else if (this.obj.too_soft && this._volumeLessThanMaxValue() ) {
        this._increaseVolume();
    } else if (this.obj.no_speech && this._volumeLessThanMaxValue() ) {
        this._increaseMaxVolume();
    }
}

AudioLevels.prototype._volumeLessThanMaxValue = function () {
    return Math.abs(this.obj.gain) < this.gain_maxValue;
}

AudioLevels.prototype._reduceVolume = function () {
    var newgain = Math.max(
        this.gainValue * this.gain_decrement_factor, this.gain_minValue);
    this._setGain(newgain);

    this._logGainChange("gainChange: too loud (clipping)", newgain);        
}

AudioLevels.prototype._increaseVolume = function () {
    var newgain = Math.min(
        this.gainValue * this.gain_increment_factor, this.gain_maxValue);
    this._setGain(newgain);

    this._logGainChange("gainChange: volume too low", newgain);        
}

AudioLevels.prototype._increaseMaxVolume = function () {
    var newgain = Math.min(
        this.gainValue * this.gain_max_increment_factor, this.gain_maxValue);
    this._setGain(newgain);

    this._logGainChange("gainChange: no speech", newgain);
}

AudioLevels.prototype._setGain = function (newgain) {
    this.gainNode.gain.setValueAtTime(
        newgain,
        this.currentTime + 1);
}

AudioLevels.prototype._logGainChange = function (m, newgain) {
    console.log (m + "; volume changed from: " + this.obj.gain + " to: " + newgain);
    
    this.debugValues.gainNode_gain_value = newgain;
}
