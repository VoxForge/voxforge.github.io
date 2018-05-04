importScripts('../lib/webrtc_vad.js'); 

// arbitrary trial and error values to determine when audio sample is too
// loud or soft...
// convert to DB?
var MAX_ENERGY_THRESHOLD = 0.50;
var MIN_ENERGY_THRESHOLD = 0.02;

var LEADING_SILENCE_SEC = 0.5; // secs
var TRAILING_SILENCE_SEC = 0.3; // little less because of lag in VAD detecting end of speech


// emscripten required variables
var Module = {};
Module.noInitialRun = true;
// onRuntimeInitialized does not work in webworker???
// therefor call from object constructor
//Module['onRuntimeInitialized'] = function() { setupwebrtc(); }; 
var process_data;

/**
* Constructor
*/
function Vad(sampleRate) {
    this.sampleRate = sampleRate;

    this.sizeBufferVad = 480;
    this.leftovers = 0;
    this.buffer_vad = new Int16Array(this.sizeBufferVad);
    this.minvoice = 250;
    //const maxsilence = 1500; // 
    this.maxsilence = 250; // 
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
    this.trailing_silence_buffe = 0;

    this.max_energy = 0;
    this.min_energy = 1.0;

    // setup webrtc VAD
    var main = cwrap('main');
    var setmode = cwrap('setmode', 'number', ['number']);
    process_data = cwrap('process_data', 'number', ['number', 'number', 'number', 'number', 'number', 'number']);

    main();
    console.log('setmode(3)=' + setmode(3));
}

/**
*
*/
Vad.prototype.calculateSilenceBoundaries = function(buffer, index) {
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
    * 1. Convert buffer samples from 32-bit float to 16bit PCM, and
    * 2. Calculate root-mean-square to get an 'energy' measure of loudness of 
    * audio samples in buffer

    * http://www.statisticshowto.com/quadratic-mean/
    * The quadratic mean (also called the root mean square*) is a type of 
    * average. This type of mean gives a greater weight to larger items in the 
    * set and is always equal to or greater than the arithmetic mean. ... 
    * https://en.wikipedia.org/wiki/Root_mean_square#In_frequency_domain
    * RMS of a signal in the time domain is directly proportional to the RMS of 
    * the signal in the frequency domain
    */
    // see: https://github.com/cwilso/volume-meter/blob/master/volume-meter.js
    // https://www.gaussianwaves.com/2015/07/significance-of-rms-root-mean-square-value/
    // TODO should use the output from WAVAudioEncoder... premature optimization??
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
    * calls webrtc VAD code
    */
    // start: original Mozilla code segment to call webrtc_vad
    function isSilence(buffer_pcm){
      // Get data byte size, allocate memory on Emscripten heap, and get pointer
      let nDataBytes = buffer_pcm.length * buffer_pcm.BYTES_PER_ELEMENT;
      let dataPtr = _malloc(nDataBytes);

      // Copy data to Emscripten heap (directly accessed from Module.HEAPU8)
      let dataHeap = new Uint8Array(HEAPU8.buffer, dataPtr, nDataBytes);
      dataHeap.set(new Uint8Array(buffer_pcm.buffer));

      // Call function and get result
      let result = process_data(dataHeap.byteOffset, buffer_pcm.length, 48000, buffer_pcm[0], buffer_pcm[100], buffer_pcm[2000]);

      // Free memory
      _free(dataHeap.byteOffset);
      return result;
    }
    // end: original Mozilla code segment to call webrtc_vad

    /**
    * called when non-silence detected (any sound, not just speech)
    */
    function speaking() {
      self.voice_started = true;
      self.voice_stopped = false;
      if ( self.first_speak ) {
        // really only recognizing non-silence (i.e. any sound that is not silence")
        console.log("webrtc: voice_started=" + index);
        self.speechstart_index = index;
        self.first_speak = false;
      }
    }

    /**
    * called when silence detected
    */
    function nospeech() {
      // only want first stop after speech ends
      if ( ! self.voice_stopped ) {
        console.log("webrtc: voice_stopped=" + index);
        self.speechend_index = index;
      }
      self.voice_stopped = true;
    }

    // ### main ################################################################

    if (this.first_buffer) {
      calculateSilencePadding(buffer.length, this.sampleRate);
      this.first_buffer = false;
    }

    var [buffer_pcm, energy] = floatTo16BitPCM(buffer);
    if (energy > this.max_energy) {
      this.max_energy = energy;
    } else if (energy < this.min_energy) {
      // TODO need to ignore silence selections, therefore do this after 
      // speech has been extracted...
      this.min_energy = energy;
    }

    // start: original Mozilla code segment to call webrtc_vad
    for (let i = 0; i < Math.ceil(buffer_pcm.length/this.sizeBufferVad); i++) {
      let start = i * this.sizeBufferVad;
      let end = start+this.sizeBufferVad;
      if ((start + this.sizeBufferVad) > buffer_pcm.length) {
        // store to the next
        this.buffer_vad.set(buffer_pcm.slice(start));
        this.leftovers =  buffer_pcm.length - start;
      } else {
        if (this.leftovers > 0) {
          // we have leftovers from previous array
          end = end - this.leftovers;
          this.buffer_vad.set((buffer_pcm.slice(start, end)), this.leftovers);
          this.leftovers =  0;
        } else {
          // send for vad
          this.buffer_vad.set(buffer_pcm.slice(start, end));
        }

        // whole vad algorithm comes here
        let vad = isSilence(this.buffer_vad);
        this.buffer_vad = new Int16Array(this.sizeBufferVad);
        let dtdepois = Date.now();
        if (vad == 0) {
          if (this.touchedvoice) {
            this.samplessilence += dtdepois - this.dtantesmili;
            if (this.samplessilence >  this.maxsilence) {
              this.touchedsilence = true;
              nospeech();
            }
          }
        }
        else {
          this.samplesvoice  += dtdepois - this.dtantesmili;
          if (this.samplesvoice >  this.minvoice) {
            this.touchedvoice = true;
            speaking();
          }
        }
        this.dtantesmili = dtdepois;

        if (this.touchedvoice && this.touchedsilence)
          this.finishedvoice = true;
      }
    }
    // end: original Mozilla code segment to call webrtc_vad
}

/**
*
*/
Vad.prototype.getSpeech = function(buffers) {
    // save context for inner functions
    var self = this;

    /**
    * using calculated speechstart and speechsopt indexes, extract audio segment
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

      if ( self.voice_stopped ) { // user stopped talking then clicked stop button.
        if (self.max_energy > MAX_ENERGY_THRESHOLD) {
          clipping = true;
          console.warn( 'audio clipping');
        } else {
          if (self.max_energy < MIN_ENERGY_THRESHOLD) {
            too_soft = true;
            console.warn( 'audio volume too too low');
          }
        } 
      } else { 
        if ( ! self.voice_started  ) { // VAD never started
          self.speechend_index = buffers.length;
          no_speech = true;
          console.warn( 'no speech recorded');
        } else { // user cut recording off too early
          self.speechend_index = buffers.length;
          no_trailing_silence = true;
          console.warn( 'no trailing silence');
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

    // ### main ##################################################################
    var [no_speech, no_trailing_silence, clipping, too_soft] = 
        validateSpeech();

    var speech_array = extractSpeechFromRecording();

    return [speech_array, no_speech, no_trailing_silence, clipping, too_soft];
}

