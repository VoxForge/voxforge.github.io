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

importScripts('../../lib/webrtc_vad.js'); 

// emscripten required variables
var Module = {};
Module.noInitialRun = true;
var process_data;

/**
* Constructor
*/

var Audio = Audio || {};

Audio.Vad = function(sampleRate, parms) {
    this.sampleRate = sampleRate;
    this.maxsilence = parms.maxsilence;
    this.minvoice = parms.minvoice;
    this.sizeBufferVad = parms.buffersize;

    this.leftovers = 0;

    this.finishedvoice = false;
    this.samplesvoice = 0 ;
    this.samplessilence = 0 ;
    this.touchedvoice = false;
    this.touchedsilence = false;
    this.dtantesmili = Date.now();

    this.voice_started = false;
    this.voice_stopped= false;
    this.first_speak = true;
    this.first_buffer = true;

    this.speechstart_index = 0;
    this.speechend_index = 0;

    this._setEnergyProperties();
    this._setSilenceProperties();
    
    this.vadbuffer_start = 0;
    this.vadbuffer_end = 0;

    // VAD can only process sampling rates of 8/16/32/48kHz;
    // since chrome/FF default sample rate on Linux is 44100, but VAD does 
    // not support 44100... hardcode 48000 - works OK
    this.VAD_SAMPLE_RATE = 48000;
    
    this._setupWebrtcVad();
}

Audio.Vad.prototype._setEnergyProperties = function() {
    this.max_energy = 0;
    this.min_energy = 1.0;
}

Audio.Vad.prototype._setSilenceProperties = function() {
    // These values are a function of event buffer size... the larger the buffer
    // the smaller these values can be; and vice versa..
    this.LEADING_SILENCE_SEC = 0.2; // secs
    this.TRAILING_SILENCE_SEC = 0.2; // little less because of lag in VAD detecting end of speech

    this.leading_silence_buffer = 0;
    this.trailing_silence_buffer = 0;
}

/**
* buffer_pcm must be 16-bit
*/
Audio.Vad.prototype.calculateSilenceBoundaries = function(
    buffer_pcm,
    energy,
    buffers_index,
    chunk_index)
{
    if (this.first_buffer) {
        this._calculateSilencePadding(buffer_pcm.length, this.sampleRate);
        this.first_buffer = false;
    }

    this._callWebrtcVad(buffer_pcm, buffers_index, chunk_index);
    
    this._trackHighLowEnergyLevels(energy);
}

/*
 *  VAD configs:
 *      - mode      : Aggressiveness degree
 *                    0 (High quality) - 3 (Highly aggressive)
 */
Audio.Vad.prototype._setupWebrtcVad = function() {
    // setup webrtc VAD
    var main = cwrap('main');
    var setmode = cwrap('setmode', 'number', ['number']);
    process_data = cwrap('process_data', 'number', ['number', 'number', 'number', 'number', 'number', 'number']);

    main();

    var mode = 3;
    var result = setmode(mode);
    
//    console.log('WebRTC VAD setmode(' + mode + ')=' + result);
}

/**
* original Mozilla code segment to call webrtc_vad,
* some variable names changed
*/
Audio.Vad.prototype._callWebrtcVad = function(
    buffer_pcm,
    buffers_index,
    chunk_index)
{
    // save reference to current context for use in inner functions
    var self = this;
        
    /**
    * calls webrtc VAD code
    *
    * converts buffer_pcm 16-bit to 8 bit unsigned integer array
    * (using javascript buffer array property) for use by Webrtc VAD
    *
    * see HEAPF32 function in webrtc_vad
    */
    function isSilence(buffer_pcm){
        // Get data byte size, allocate memory on Emscripten heap, and get pointer
        let nDataBytes = buffer_pcm.length * buffer_pcm.BYTES_PER_ELEMENT;
        let dataPtr = _malloc(nDataBytes);

        // Copy data to Emscripten heap (directly accessed from Module.HEAPU8)
        let dataHeap = new Uint8Array(HEAPU8.buffer, dataPtr, nDataBytes);
        dataHeap.set(new Uint8Array(buffer_pcm.buffer));

        let result = process_data(
            dataHeap.byteOffset, // int16_t  data[],
            buffer_pcm.length, // int n_samples
            self.VAD_SAMPLE_RATE, // int samplerate,
            buffer_pcm[0], //  int val0
            buffer_pcm[100], // int val100
            buffer_pcm[2000]); // int val2000

        // Free memory
        _free(dataHeap.byteOffset);
        return result;
    }

    // ###
    // vad buffer is only size of even buffer
    let buffer_vad = new Int16Array(this.sizeBufferVad);
    //let buffer_vad = new Int8Array(this.sizeBufferVad); not working

    for (let i = 0; i < Math.ceil(buffer_pcm.length/this.sizeBufferVad); i++) {
      let start = i * this.sizeBufferVad;
      let end = start + this.sizeBufferVad;
      if ((start + this.sizeBufferVad) > buffer_pcm.length) {
        // store to the next
        buffer_vad.set(buffer_pcm.slice(start));
        this.leftovers =  buffer_pcm.length - start;
      } else {
        if (this.leftovers > 0) {
          // we have leftovers from previous array
          end = end - this.leftovers;
          buffer_vad.set((buffer_pcm.slice(start, end)), this.leftovers);
          this.leftovers =  0;
        } else {
          // send for vad
          buffer_vad.set(buffer_pcm.slice(start, end));
        }

        // whole vad algorithm comes here
        let vad = isSilence(buffer_vad);
        //this.buffer_vad = new Int16Array(this.sizeBufferVad);
        let dtdepois = Date.now();
        if (vad == 0) {
          if (this.touchedvoice) {
            this.samplessilence += dtdepois - this.dtantesmili;
            if (this.samplessilence >  this.maxsilence) {
              this.touchedsilence = true;
              this._nospeech(start, end, buffers_index, chunk_index);
            }
          }
        }
        else {
          this.samplesvoice  += dtdepois - this.dtantesmili;
          if (this.samplesvoice >  this.minvoice) {
            this.touchedvoice = true;
            this._speaking(start, end, buffers_index, chunk_index);
          }
        }
        this.dtantesmili = dtdepois;

        if (this.touchedvoice && this.touchedsilence, chunk_index)
          this.finishedvoice = true;
      }
    }
}

Audio.Vad.prototype._trackHighLowEnergyLevels = function(energy) {
    if (energy > this.max_energy) {
        this.max_energy = energy;
    } else if (energy < this.min_energy) {
        // TODO need to ignore silence selections, therefore do this after 
        // speech has been extracted...
        this.min_energy = energy;
    }
}

/**
* called when non-silence detected (any sound, not just speech)
*/
Audio.Vad.prototype._speaking = function(start, end, buffers_index, chunk_index) {
    this.voice_started = true;
    this.voice_stopped = false;
    if ( this.first_speak ) {
        // really only recognizing non-silence (i.e. any sound that is not silence")
        console.log(
            "webrtc: voice_started " + buffers_index + " " +
            "vadbuffer_start: " + start + " " +
            "vadbuffer_end: " + end + " " +
            "chunk_index: " + chunk_index);
        this.speechstart_index = buffers_index;
        this.first_speak = false;
    }
}

/**
* called when silence detected
*/
Audio.Vad.prototype._nospeech = function(start, end, buffers_index, chunk_index) {
    // only want first stop after speech ends
    if ( ! this.voice_stopped ) {
        console.log(
            "webrtc: voice_stopped=" + buffers_index + " " +
            "vadbuffer_start: " + start + " " +
            "vadbuffer_end: " + end + " " +
            "chunk_index: " + chunk_index);
        this.speechend_index = buffers_index;
    }
    this.voice_stopped = true;
}

/**
* Must be calculated from event buffer because there is no other way
* to get buffer size... and buffer sizes differ markedly 
* depending on device (e.g. Linux 2048 samples per event buffer; Android 16384 
* samples)

// TODO what if very short recording??? less than buffer length
// TODO what if talking when press stop so that end_voice is after length of array
// TODO what if sound from start to end of recording when user clicks stop
*/ 
Audio.Vad.prototype._calculateSilencePadding = function(
    num_samples_in_buffer,
    samples_per_sec)
{
    var buffers_per_sec = samples_per_sec / num_samples_in_buffer; 

    this.leading_silence_buffer = Math.round(this.LEADING_SILENCE_SEC * buffers_per_sec);
    this.trailing_silence_buffer = Math.floor(this.TRAILING_SILENCE_SEC * buffers_per_sec);

    console.log(
        'leading_silence_buffer= ' + this.leading_silence_buffer +
        '; trailing_silence_buffer= ' + this.trailing_silence_buffer);
}


Audio.Vad.prototype.getSpeech = function(buffers) {
    var vadSpeech = new Audio.Vad.Speech(
        buffers,
        this.speechstart_index,
        this.speechend_index,
        this.leading_silence_buffer,
        this.trailing_silence_buffer,
        this.max_energy,
        this.voice_started,
        this.voice_stopped,);

    return vadSpeech.get();
}

// #############################################################################

// TODO this class structure is still not quite right...
Audio.Vad.Speech = function(
    buffers,
    speechstart_index,
    speechend_index,
    leading_silence_buffer,
    trailing_silence_buffer,
    max_energy,
    voice_started,
    voice_stopped, )
{
    this.buffers = buffers;
    
    // VAD determined speech start and speech end
    this.speechstart_index = speechstart_index;
    this.speechend_index = speechend_index;

    this.leading_silence_buffer = leading_silence_buffer;
    this.trailing_silence_buffer = trailing_silence_buffer;
    
    // actual indices used for slicing buffer; taking into consideration
    // leading and trailing silence buffers
    this.start_index = Math.max(this.speechstart_index - this.leading_silence_buffer, 0);
    this.end_index = Math.min(this.speechend_index + this.trailing_silence_buffer, this.buffers.length); 

    this.max_energy = max_energy;
    this.voice_started = voice_started;
    this.voice_stopped = voice_stopped;
    
    this.no_speech = false;
    this.no_trailing_silence = false;
    this.clipping = false;
    this.too_soft = false;    

    // arbitrary trial and error values to determine when audio sample is too
    // loud or soft...
    // TODO convert to DB?
    //this.MAX_ENERGY_THRESHOLD = 0.50;
    this.MAX_ENERGY_THRESHOLD = 0.45;    
    this.MIN_ENERGY_THRESHOLD = 0.02;
}

Audio.Vad.Speech.prototype.get = function() {
    this._checkForProblemsWithRecording();
    this._extractSpeechFromBuffers();

    return [this.speech_array, this.no_speech, this.no_trailing_silence,
        this.clipping, this.too_soft];
}

/*
  // 1. user clicks stop before they finish speaking; voice_stopped never 
  // goes true (and voice_started never goes false)
  // user was still speaking when they clicked stop
*/
Audio.Vad.Speech.prototype._checkForProblemsWithRecording = function() {
    if ( this.voice_stopped ) { // user stopped talking then clicked stop button.
        this._checkAudioVolume();
    } else { // no speech or user hit stop too early
        this._problemsWithSpeech();
    }

    this._logValidateSpeech();
    this._checkForErrors();
}

/**
* determine if energy level threshholds have been passed
*/
Audio.Vad.Speech.prototype._checkAudioVolume = function() {
    if (this.max_energy > this.MAX_ENERGY_THRESHOLD) {
        this.clipping = true;
        console.warn( 'audio clipping');
    } else {
        if (this.max_energy < this.MIN_ENERGY_THRESHOLD) {
            this.too_soft = true;
            console.warn( 'audio volume too too low');
        }
    } 
}

/**
* no speech or user hit stop too early
*/
Audio.Vad.Speech.prototype._problemsWithSpeech = function() {
    if ( ! this.voice_started  ) { // VAD never started
        this.end_index = this.buffers.length; // no trimming of audio recording
        this.no_speech = true;
        console.warn( 'no speech recorded');
    } else { // user cut end of recording off too early
        this.end_index = this.buffers.length; // no trimming of audio recording
        this.no_trailing_silence = true;
        console.warn( 'no trailing silence');
        this._checkAudioVolume(); // even though user may have hit stop too early, still need to check energy levels
    }
}

Audio.Vad.Speech.prototype._logValidateSpeech = function() {
    console.log( 'max_energy=' + this.max_energy.toFixed(2) +
    ' MIN_ENERGY_THRESHOLD=' + this.MIN_ENERGY_THRESHOLD +
    ', MAX_ENERGY_THRESHOLD=' + this.MAX_ENERGY_THRESHOLD);
}

Audio.Vad.Speech.prototype._checkForErrors = function() {
    if (this.end_index == 0) { // should never occur
        this.start_index = 0;        
        this.end_index = this.buffers.length;
        console.warn( 'end_index never set, setting to end of recording');
    }
    if (this.end_index < this.start_index) {// should never occur
        this.start_index = 0;
        this.end_index = this.buffers.length;
        console.warn( 'end_index bigger than start_index; setting from ' +
            'beginning of recording to end');
    }
}

/**
* using calculated speechstart and speechstop indexes, extract audio segment
* that includes speech (i.e. remove leading and trailing silence from 
* recording)
*/
Audio.Vad.Speech.prototype._extractSpeechFromBuffers = function() {
    console.log("start_index=" + this.start_index + 
              "; end_index=" + this.end_index +
              "; buffer length=" + this.buffers.length);

    this.speech_array = this.buffers.slice(this.start_index, this.end_index);

    console.log("speech_array length=" + this.speech_array.length);
}
