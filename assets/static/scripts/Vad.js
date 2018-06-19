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

importScripts('../lib/webrtc_vad.js'); 

// arbitrary trial and error values to determine when audio sample is too
// loud or soft...
// TODO convert to DB?
var MAX_ENERGY_THRESHOLD = 0.50;
var MIN_ENERGY_THRESHOLD = 0.02;

// These values are a function of event buffer size... the larger the buffer
// the smaller these values can be; and vice versa..
var LEADING_SILENCE_SEC = 0.2; // secs
var TRAILING_SILENCE_SEC = 0.2; // little less because of lag in VAD detecting end of speech

// since chrome/FF default sample rate on Linux is 44100, but VAD does 
// not support 44100... hardcode 48000 - works OK
var VAD_SAMPLE_RATE = 48000;

// emscripten required variables
var Module = {};
Module.noInitialRun = true;

var process_data;

/**
* Constructor
*/
function Vad(sampleRate, parms) {
    this.sampleRate = sampleRate;
    this.maxsilence = parms.maxsilence;
    this.minvoice = parms.minvoice;
    this.sizeBufferVad = parms.buffersize;

    this.leftovers = 0;
    this.buffer_vad = new Int16Array(this.sizeBufferVad);

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

    this.leading_silence_buffer = 0;
    this.trailing_silence_buffer = 0;

    this.max_energy = 0;
    this.min_energy = 1.0;

    this.vadbuffer_start = 0;
    this.vadbuffer_end = 0;

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
    console.log('WebRTC VAD setmode(' + mode + ')=' + result);
}

/**
*
*/
Vad.prototype.calculateSilenceBoundaries = function(buffer, buffers_index, chunk_index) {
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

      self.leading_silence_buffer = Math.round(LEADING_SILENCE_SEC * buffers_per_sec);
      self.trailing_silence_buffer = Math.floor(TRAILING_SILENCE_SEC * buffers_per_sec);

      console.log('leading_silence_buffer= ' + self.leading_silence_buffer + '; trailing_silence_buffer= ' + self.trailing_silence_buffer);
    }

    /**
    *
    */
    // TODO use the output from WAVAudioEncoder
    function floatTo16BitPCM(buffer) {
      var buffer_pcm = new Int16Array(buffer.length);
      var sum = 0;

      for (let i = 0; i < buffer.length; i++) {
        var sample = buffer[i];
        //sum += Math.abs( sample );
        sum += sample * sample;

        // original Mozilla 32-bit float to 16bit PCM encoder
        //let s = Math.max(-1, Math.min(1, sample));
        //buffer_pcm[i] =  s < 0 ? s * 0x8000 : s * 0x7FFF;

        var x = buffer[i] * 0x7fff; // 0x7fff = 32767
        buffer_pcm[i] =  x < 0 ? Math.max(x, -0x8000) : Math.min(x, 0x7fff);
      }
      //var energy = sum / buffer.length;
      var energy = Math.sqrt( sum / buffer.length ); // rms

      return [buffer_pcm, energy];
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
        console.log("webrtc: voice_started=" + buffers_index + 
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
        console.log("webrtc: voice_stopped=" + buffers_index + 
                    " vadbuffer_start: " + start + 
                     " vadbuffer_end: " + end + 
                    " chunk_index: " + chunk_index);
        self.speechend_index = buffers_index;
      }
      self.voice_stopped = true;


    }

    /**
    * original Mozilla code segment to call webrtc_vad
    */
    function callWebrtcVad(buffer_pcm) {
        /**
        * calls webrtc VAD code
        */
        function isSilence(buffer_pcm){
          // Get data byte size, allocate memory on Emscripten heap, and get pointer
          let nDataBytes = buffer_pcm.length * buffer_pcm.BYTES_PER_ELEMENT;
          let dataPtr = _malloc(nDataBytes);

          // Copy data to Emscripten heap (directly accessed from Module.HEAPU8)
          let dataHeap = new Uint8Array(HEAPU8.buffer, dataPtr, nDataBytes);
          dataHeap.set(new Uint8Array(buffer_pcm.buffer));

          //         int process_data(int16_t  data[], int n_samples, int samplerate, int val0, int val100, int val2000){
          let result = process_data(dataHeap.byteOffset, buffer_pcm.length, VAD_SAMPLE_RATE, buffer_pcm[0], buffer_pcm[100], buffer_pcm[2000]);

          // Free memory
          _free(dataHeap.byteOffset);
          return result;
        }

        // ###

        for (let i = 0; i < Math.ceil(buffer_pcm.length/self.sizeBufferVad); i++) {
          let start = i * self.sizeBufferVad;
          let end = start+self.sizeBufferVad;
          if ((start + self.sizeBufferVad) > buffer_pcm.length) {
            // store to the next
            self.buffer_vad.set(buffer_pcm.slice(start));
            self.leftovers =  buffer_pcm.length - start;
          } else {
            if (self.leftovers > 0) {
              // we have leftovers from previous array
              end = end - self.leftovers;
              self.buffer_vad.set((buffer_pcm.slice(start, end)), self.leftovers);
              self.leftovers =  0;
            } else {
              // send for vad
              self.buffer_vad.set(buffer_pcm.slice(start, end));
            }

            // whole vad algorithm comes here
            let vad = isSilence(self.buffer_vad);
            self.buffer_vad = new Int16Array(self.sizeBufferVad);
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
      calculateSilencePadding(buffer.length, this.sampleRate);
      this.first_buffer = false;
    }

    var [buffer_pcm, energy] = floatTo16BitPCM(buffer);

    callWebrtcVad(buffer_pcm);

    if (energy > this.max_energy) {
      this.max_energy = energy;
    } else if (energy < this.min_energy) {
      // TODO need to ignore silence selections, therefore do this after 
      // speech has been extracted...
      this.min_energy = energy;
    }
}

/**
*
*/
Vad.prototype.getSpeech = function(buffers) {
    // save context for inner functions
    var self = this;

    /**
    * determine if energy level threshholds have been passed

      // 1. user clicks stop before they finish speaking; voice_stopped never 
      // goes true (and voice_started never goes false)
      // user was still speaking when they clicked stop
    */
    function validateSpeech() {
      var no_speech = false;
      var no_trailing_silence = false;
      var clipping = false;
      var too_soft = false;

      function checkEnergy() {
          if (self.max_energy > MAX_ENERGY_THRESHOLD) {
            clipping = true;
            console.warn( 'audio clipping');
          } else {
            if (self.max_energy < MIN_ENERGY_THRESHOLD) {
              too_soft = true;
              console.warn( 'audio volume too too low');
            }
          } 
      }

      if ( self.voice_stopped ) { // user stopped talking then clicked stop button.
        checkEnergy();
      } else { 
        if ( ! self.voice_started  ) { // VAD never started
          self.speechend_index = buffers.length;
          no_speech = true;
          console.warn( 'no speech recorded');
        } else { // user cut end of recording off too early
          self.speechend_index = buffers.length;
          no_trailing_silence = true;
          console.warn( 'no trailing silence');
          checkEnergy(); // even though user may have hit stop too early, still need to check energy levels
        }
      }
      console.log( 'max_energy=' + self.max_energy.toFixed(2) + ' MIN_ENERGY_THRESHOLD=' + MIN_ENERGY_THRESHOLD + ', MAX_ENERGY_THRESHOLD=' + MAX_ENERGY_THRESHOLD);

      if (self.speechend_index == 0) { // should never occur
        self.speechend_index = buffers.length;
        console.warn( 'speechend_index never set, setting to end of recording');
      }
      if (self.speechend_index < self.speechstart_index) {// should never occur
        self.speechend_index =0;
        self.speechend_index = buffers.length;
        console.warn( 'speechend_index bigger than speechstart_index');
      }

      return [no_speech, no_trailing_silence, clipping, too_soft];
    }

    /**
    * using calculated speechstart and speechstop indexes, extract audio segment
    * that includes speech (i.e. remove leading and trailing silence from 
    * recording)
    */
    function extractSpeechFromRecording() {
      var start_index = Math.max(self.speechstart_index - self.leading_silence_buffer, 0);
      var end_index = Math.min(self.speechend_index + self.trailing_silence_buffer, buffers.length);
      console.log("start_index=" + start_index + 
                  "; end_index=" + end_index +
                  "; buffer length=" + buffers.length);

      var speech_array =  buffers.slice(start_index, end_index);

      console.log("speech_array length=" + speech_array.length);

      return speech_array;
    }

    // ### main ##################################################################

    var [no_speech, no_trailing_silence, clipping, too_soft] = 
        validateSpeech();

    var speech_array = extractSpeechFromRecording();

    return [speech_array, no_speech, no_trailing_silence, clipping, too_soft];
}

