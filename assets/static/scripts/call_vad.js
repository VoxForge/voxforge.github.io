importScripts('../lib/webrtc_vad.js'); 

//TODO re-implement clipping and audio too low warnings

var MAX_ENERGY_THRESHOLD = 0.65;
var LOW_ENERGY_THRESHOLD = 0.1;

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

  this.clipping = false;
  this.too_soft = false;

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

    // TODO should use the output from WAVAudioEncoder...but is that premature optimization??
    function floatTo16BitPCM(buffer) {
      var buffer_pcm = new Int16Array(buffer.length);

      for (let i = 0; i < buffer.length; i++) {
        let s = Math.max(-1, Math.min(1, buffer[i]));
        buffer_pcm[i] =  s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      return buffer_pcm;
    }
    
    //
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

    //
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

    //
    function nospeech() {
      // only want first stop after speech ends
      if ( ! self.voice_stopped ) { // so won't print to console a million times...
        console.log("webrtc: voice_stopped=" + index);
        self.speechend_index = index;
      }
      self.voice_stopped = true;
    }


    /**
    * Calculate silence padding.  Must be calculated from event buffer because 
    * there is no other way to get it... and buffer sizes differ markedly 
    * depending on device (e.g. Linux 2048 samples per event buffer; Android 16384 
    * samples)
    */
    // TODO what if very short recording??? less than buffer length
    function calculateSilencePadding(num_samples_in_buffer, samples_per_sec) {
      var buffers_per_sec = samples_per_sec / num_samples_in_buffer; 

      self.leading_silence_buffer = Math.round(LEADING_SILENCE_SEC * buffers_per_sec);
      self.trailing_silence_buffer = Math.floor(TRAILING_SILENCE_SEC * buffers_per_sec);

      console.log('worker leading_silence_buffer= ' + self.leading_silence_buffer + '; trailing_silence_buffer= ' + self.trailing_silence_buffer);
    }

    // ### main ################################################################
    if (this.first_buffer) {
      calculateSilencePadding(buffer.length, this.sampleRate);
      this.first_buffer = false;
    }


    var buffer_pcm = floatTo16BitPCM(buffer);
    
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
}

/**
*
*/
Vad.prototype.getSpeech = function(buffers) {
/*
    var [speech_array, max_energy] = 
        extractSpeechFromRecording(buffers, voice_start, voice_stop);
    var [clipping, too_soft] = getEnergyThreshholds(max_energy);

    while (speech_array.length > 0) {
      encoder.encode(speech_array.shift());
    }
*/

    //var start_index = Math.max(this.speechstart_index - 10, 0);
    //var end_index = Math.min(this.speechend_index + 2,buffers.length);
    var start_index = Math.max(this.speechstart_index - this.leading_silence_buffer, 0);
    var end_index = Math.min(this.speechend_index + this.trailing_silence_buffer, buffers.length);
    console.log("start_index=" + start_index + 
                "; end_index=" + end_index +
                "; buffer length=" + buffers.length);

    var speech_array =  buffers.slice(start_index, end_index);
    console.log("speech_array length=" + speech_array.length);

    return speech_array;
}



















/**
* skip silence in a recording and only return those buffer containing speech,
* with leading and trailing silence padding
*/
function extractSpeechFromRecording(buffers, voice_start, voice_stop) {
  /**
  * Window size is a function of device user is operating on.

    Number of elements in Floar32Array corresponds to the 'Frame' or 'Window' size 
    of a Wav audio recording.  (Linux = 2048; Android = 16384) and each element 
    contained therein is a Sample
  */
  function calculateWindowEnergy(sampleArray) {
    var total_buffer_energy = 0;

    // calculate RMS (root mean square) of speech array
    // An envelope of a signal is a curve that describes its magnitude over 
    // time, independently of how its frequency content makes it oscillate 
    for (var j = 0; j < sampleArray.length; j++) {
        total_buffer_energy += Math.abs( sampleArray[j]);
    }
    return Math.sqrt(total_buffer_energy / (sampleArray.length - 1) );
  }

  // buffer is an array of Float32Arrays (with a size specific to 
  // the device we are operating on e.g. Linux - size=2048); the size
  // of buffer array is a function of length of audio file.
  function calculateMaxEnergy(buffer) {
    var max_energy=0;

    for (var i = 0; i < buffer.length; i++) {
      var avg_buffer_energy = calculateWindowEnergy(buffer[i]);
      if (avg_buffer_energy > max_energy) {
         max_energy = avg_buffer_energy;
      }
    }
  
    return max_energy;
  }

  var last_index = buffers.length - 1;

  if (typeof voice_start == 'undefined')
     voice_start = 0;

  if (typeof voice_stop == 'undefined' || voice_stop == 0)
     voice_stop = last_index;

  // should not happen
  if (voice_start > voice_stop) {
    console.warn( 'voice_stop=' + voice_stop + ' starts before voice_start=' + voice_start + ', capturing entire recording');
    voice_start = 0;
    voice_stop = last_index;
  }

  console.log('worker last_index=' + last_index + '; voice_start='+ voice_start + '; voice_stop='+ voice_stop);

  var record_start = Math.max(voice_start - leading_silence_buffer, 0);
  var record_end = Math.min(voice_stop + trailing_silence_buffer, last_index);

  // using energy check (i.e. volume) to confirm that VAD actually found 
  // end of speech... it sometimes makes mistakes...
  // TODO why is VAD voice_stop detection sometimes wrong??
  // this will cause problems in noisy enviroments, may need to skip this for those...
  var original_record_end = record_end;



  console.log('worker record_start='+ record_start + '; original_record_end='+ original_record_end + '; vol_adjusted_record_end='+ record_end);

  var speech_array =  buffers.slice(record_start, record_end);
  var max_energy = calculateMaxEnergy(speech_array);

  return [speech_array, max_energy];
}

/**
* determine if energy level threshholds have been passed
*/
function getEnergyThreshholds(max_energy) {
  var clipping;
  var too_soft;

  if (max_energy > MAX_ENERGY_THRESHOLD) {
    clipping = true;
  } else {
    clipping = false;
  }

  if (max_energy < LOW_ENERGY_THRESHOLD) {
    too_soft = true;
  } else {
    too_soft = false;
  }

  console.log( 'max_energy=' + max_energy.toFixed(2) + ' LOW_ENERGY_THRESHOLD=' + LOW_ENERGY_THRESHOLD + ', MAX_ENERGY_THRESHOLD=' + MAX_ENERGY_THRESHOLD);

  return [clipping, too_soft];
}


