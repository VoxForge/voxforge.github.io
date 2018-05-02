importScripts('../lib/webrtc_vad.js'); 

//TODO re-implement clipping and audio too low warnings

// #############################################################################
// emscripten required variables
var Module = {};
Module.noInitialRun = true;
Module['onRuntimeInitialized'] = function() { setupwebrtc(); }; // this does not work in webworker???

// VAD indexes
var speechstart_index = 0;
var speechend_index = 0;

function setupwebrtc() {
  console.log('setupwebrtc');
  main = cwrap('main');
  setmode = cwrap('setmode', 'number', ['number']);
  process_data = cwrap('process_data', 'number', ['number', 'number', 'number', 'number', 'number', 'number']);

  main();
  var setmode = cwrap('setmode', 'number', ['number']);
  console.log(setmode(3));
}



// webRTC_VAD required variables
var main;
var setmode;
var process_data;
const sizeBufferVad = 480;
let leftovers = 0;
let buffer_vad = new Int16Array(sizeBufferVad);
const minvoice = 250;
//const maxsilence = 1500; // 
const maxsilence = 250; // 
const maxtime = 20; // 20 secs?
let silenceblocks = 0;
let skipsamples = 0;
let finishedvoice = false;
let samplesvoice = 0 ;
let samplessilence = 0 ;
let touchedvoice = false;
let touchedsilence = false;
let dtantes = Date.now();
let dtantesmili = Date.now();
let raisenovoice = false;
//


/**
*
*/
function recorderProcess(buffer, index, speechstart_index, speechend_index) {

  // TODO should use the output from WAVAudioEncoder...
  function floatTo16BitPCM(output, input) {
    for (let i = 0; i < input.length; i++) {
      let s = Math.max(-1, Math.min(1, input[i]));
      output[i] =  s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
  }

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

  let buffer_pcm = new Int16Array(buffer.length);
  floatTo16BitPCM(buffer_pcm, buffer);
  
  for (let i = 0; i < Math.ceil(buffer_pcm.length/sizeBufferVad); i++) {
    let start = i * sizeBufferVad;
    let end = start+sizeBufferVad;
    if ((start + sizeBufferVad) > buffer_pcm.length) {
      // store to the next
      buffer_vad.set(buffer_pcm.slice(start));
      leftovers =  buffer_pcm.length - start;
    } else {
      if (leftovers > 0) {
        // we have leftovers from previous array
        end = end - leftovers;
        buffer_vad.set((buffer_pcm.slice(start, end)), leftovers);
        leftovers =  0;
      } else {
        // send for vad
        buffer_vad.set(buffer_pcm.slice(start, end));
      }

      // whole vad algorithm comes here
      let vad = isSilence(buffer_vad);
      buffer_vad = new Int16Array(sizeBufferVad);
      let dtdepois = Date.now();
      if (vad == 0) {
        if (touchedvoice) {
          samplessilence += dtdepois - dtantesmili;
          if (samplessilence >  maxsilence) {
            touchedsilence = true;
            nospeech();
          }
        }
      }
      else {
        samplesvoice  += dtdepois - dtantesmili;
        if (samplesvoice >  minvoice) {
          touchedvoice = true;
          speaking();
        }
      }
      dtantesmili = dtdepois;

      if (touchedvoice && touchedsilence)
        finishedvoice = true;
    }
  }

// #############################################################################

  function speaking() {
    voice_started = true;
    voice_stopped = false;
    if ( first_buffer ) {
      // really only recognizing non-silence (i.e. any sound that is not silence")
      console.log("webrtc: voice_started=" + index);
      speechstart_index = index;
      first_buffer = false;
    }
  }

  function nospeech() {
    // only want first stop after speech ends
    if ( ! voice_stopped ) { // so won't print to console a million times...
      console.log("webrtc: voice_stopped=" + index);
      speechend_index = index;
    }
    voice_stopped = true;
  }

  return [speechstart_index, speechend_index];
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

  var leading_silence_buffer = Math.round(LEADING_SILENCE_SEC * buffers_per_sec);
  var trailing_silence_buffer = Math.floor(TRAILING_SILENCE_SEC * buffers_per_sec);

  console.log('worker leading_silence_buffer= ' + leading_silence_buffer + '; trailing_silence_buffer= ' + trailing_silence_buffer);

  return [leading_silence_buffer, trailing_silence_buffer];
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

  // https://dsp.stackexchange.com/questions/1522/simplest-way-of-detecting-where-audio-envelopes-start-and-stop?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
  //https://ccrma.stanford.edu/~jos/filters
  // https://github.com/corbanbrook/dsp.js/
  console.log('start buffers[' + record_end + '] maxEnergy=' + calculateWindowEnergy(buffers[record_end]).toFixed(2) + ' ; LOW_ENERGY_THRESHOLD=' + LOW_ENERGY_THRESHOLD);
  while (calculateWindowEnergy(buffers[record_end]) > LOW_ENERGY_THRESHOLD) {
    console.log('buffers[' + record_end + '] maxEnergy=' + calculateWindowEnergy(buffers[record_end]).toFixed(2) + ' ; LOW_ENERGY_THRESHOLD=' + LOW_ENERGY_THRESHOLD);
    record_end = record_end + 1;
    if (record_end > last_index )
      break;
  }

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


