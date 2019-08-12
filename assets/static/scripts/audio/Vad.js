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

    //const maxsilence = 1500; //  original
    //this.minvoice = 250;//  original

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

    // since chrome/FF default sample rate on Linux is 44100, but VAD does 
    // not support 44100... hardcode 48000 - works OK
    this.VAD_SAMPLE_RATE = 48000;

    // setup webrtc VAD
    var main = cwrap('main');
    var setmode = cwrap('setmode', 'number', ['number']);
    process_data = cwrap('process_data', 'number', ['number', 'number', 'number', 'number', 'number', 'number']);

    main();

// * VAD configs:
// *      - mode      : Aggressiveness degree
// *                    0 (High quality) - 3 (Highly aggressive)
    var mode = 3;
    var result = setmode(mode);
//    console.log('WebRTC VAD setmode(' + mode + ')=' + result);
}

Audio.Vad.prototype._setSilenceProperties = function() {
    // These values are a function of event buffer size... the larger the buffer
    // the smaller these values can be; and vice versa..
    this.LEADING_SILENCE_SEC = 0.2; // secs
    this.TRAILING_SILENCE_SEC = 0.2; // little less because of lag in VAD detecting end of speech

    this.leading_silence_buffer = 0;
    this.trailing_silence_buffer = 0;
}

Audio.Vad.prototype._setEnergyProperties = function() {
    this.max_energy = 0;
    this.min_energy = 1.0;

    // arbitrary trial and error values to determine when audio sample is too
    // loud or soft...
    // TODO convert to DB?
    this.MAX_ENERGY_THRESHOLD = 0.50;
    this.MIN_ENERGY_THRESHOLD = 0.02;
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
    // save reference to current context for use in inner functions
    var self = this;

    /**
    * Must be calculated from event buffer because there is no other way
    * to get buffer size... and buffer sizes differ markedly 
    * depending on device (e.g. Linux 2048 samples per event buffer; Android 16384 
    * samples)
    */
    // TODO what if very short recording??? less than buffer length
    // TODO what if talking when press stop so that end_voice is after length of array
    // TODO what if sound from start to end of recording when user clicks stop
    function calculateSilencePadding(num_samples_in_buffer, samples_per_sec) {
      var buffers_per_sec = samples_per_sec / num_samples_in_buffer; 

      self.leading_silence_buffer = Math.round(self.LEADING_SILENCE_SEC * buffers_per_sec);
      self.trailing_silence_buffer = Math.floor(self.TRAILING_SILENCE_SEC * buffers_per_sec);

      console.log(
        'leading_silence_buffer= ' + self.leading_silence_buffer +
        '; trailing_silence_buffer= ' + self.trailing_silence_buffer);
    }

    /**
    * called when non-silence detected (any sound, not just speech)
    */
    function speaking(start, end) {
      self.speaking_vadbuffer_start = start;
      self.speaking_vadbuffer_end = end;

      self.voice_started = true;
      self.voice_stopped = false;
      if ( self.first_speak ) {
        // really only recognizing non-silence (i.e. any sound that is not silence")
        console.log(
            "webrtc: voice_started=" + buffers_index + 
            " vadbuffer_start: " + start + 
            " vadbuffer_end: " + end + 
            " chunk_index: " + chunk_index);
        self.speechstart_index = buffers_index;
        self.first_speak = false;
      }
    }

    /**
    * called when silence detected
    */
    function nospeech(start, end) {
      self.nospeech_vadbuffer_start = start;
      self.nospeech_vadbuffer_end = end;

      // only want first stop after speech ends
      if ( ! self.voice_stopped ) {
        console.log(
            "webrtc: voice_stopped=" + buffers_index + 
            " vadbuffer_start: " + start + 
            " vadbuffer_end: " + end + 
            " chunk_index: " + chunk_index);
        self.speechend_index = buffers_index;
      }
      self.voice_stopped = true;
    }

    /**
    * original Mozilla code segment to call webrtc_vad,
    * some variable names changed
    */
    function callWebrtcVad(buffer_pcm) {
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
        let buffer_vad = new Int16Array(self.sizeBufferVad);
        //let buffer_vad = new Int8Array(self.sizeBufferVad); not working

        for (let i = 0; i < Math.ceil(buffer_pcm.length/self.sizeBufferVad); i++) {
          let start = i * self.sizeBufferVad;
          let end = start+self.sizeBufferVad;
          if ((start + self.sizeBufferVad) > buffer_pcm.length) {
            // store to the next
            buffer_vad.set(buffer_pcm.slice(start));
            self.leftovers =  buffer_pcm.length - start;
          } else {
            if (self.leftovers > 0) {
              // we have leftovers from previous array
              end = end - self.leftovers;
              buffer_vad.set((buffer_pcm.slice(start, end)), self.leftovers);
              self.leftovers =  0;
            } else {
              // send for vad
              buffer_vad.set(buffer_pcm.slice(start, end));
            }

            // whole vad algorithm comes here
            let vad = isSilence(buffer_vad);
            //self.buffer_vad = new Int16Array(self.sizeBufferVad);
            let dtdepois = Date.now();
            if (vad == 0) {
              if (self.touchedvoice) {
                self.samplessilence += dtdepois - self.dtantesmili;
                if (self.samplessilence >  self.maxsilence) {
                  self.touchedsilence = true;
                  nospeech(start, end);
                }
              }
            }
            else {
              self.samplesvoice  += dtdepois - self.dtantesmili;
              if (self.samplesvoice >  self.minvoice) {
                self.touchedvoice = true;
                speaking(start, end);
              }
            }
            self.dtantesmili = dtdepois;

            if (self.touchedvoice && self.touchedsilence)
              self.finishedvoice = true;
          }
        }
    }

    // ### main ################################################################

    if (this.first_buffer) {
      calculateSilencePadding(buffer_pcm.length, this.sampleRate);
      this.first_buffer = false;
    }

    callWebrtcVad(buffer_pcm);

    if (energy > this.max_energy) {
      this.max_energy = energy;
    } else if (energy < this.min_energy) {
      // TODO need to ignore silence selections, therefore do this after 
      // speech has been extracted...
      this.min_energy = energy;
    }
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
    this.speechstart_index = speechstart_index;
    this.speechend_index = speechend_index;          
    this.leading_silence_buffer = leading_silence_buffer;
    this.trailing_silence_buffer = trailing_silence_buffer;
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
    this._validateSpeech();

    var speech_array = this._extractSpeechFromBuffers();

    return [speech_array, this.no_speech, this.no_trailing_silence,
        this.clipping, this.too_soft];
}

/**
* determine if energy level threshholds have been passed

  // 1. user clicks stop before they finish speaking; voice_stopped never 
  // goes true (and voice_started never goes false)
  // user was still speaking when they clicked stop
*/
Audio.Vad.Speech.prototype._validateSpeech = function() {
    var self = this;

    if ( this.voice_stopped ) { // user stopped talking then clicked stop button.
        this._checkAudioVolume();
    } else { 
        this._problemsWithSpeech();
    }

    this._logValidateSpeech();
    this._checkForErrors();
}

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

Audio.Vad.Speech.prototype._problemsWithSpeech = function() {
    if ( ! this.voice_started  ) { // VAD never started
        this.speechend_index = this.buffers.length;
        this.no_speech = true;
        console.warn( 'no speech recorded');
    } else { // user cut end of recording off too early
        this.speechend_index = this.buffers.length;
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
    if (this.speechend_index == 0) { // should never occur
        this.speechend_index = this.buffers.length;
        console.warn( 'speechend_index never set, setting to end of recording');
    }
    if (this.speechend_index < this.speechstart_index) {// should never occur
        this.speechend_index =0;
        this.speechend_index = this.buffers.length;
        console.warn( 'speechend_index bigger than speechstart_index');
    }
}

/**
* using calculated speechstart and speechstop indexes, extract audio segment
* that includes speech (i.e. remove leading and trailing silence from 
* recording)
*/
Audio.Vad.Speech.prototype._extractSpeechFromBuffers = function() {
  var start_index = Math.max(this.speechstart_index - this.leading_silence_buffer, 0);
  var end_index = Math.min(this.speechend_index + this.trailing_silence_buffer, this.buffers.length);
  console.log("start_index=" + start_index + 
              "; end_index=" + end_index +
              "; buffer length=" + this.buffers.length);

  var speech_array = this.buffers.slice(start_index, end_index);

  console.log("speech_array length=" + speech_array.length);

  return speech_array;
}
