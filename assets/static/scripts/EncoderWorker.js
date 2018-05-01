// use about:debugging#workers in firefox to get at web worker

// manually rewritten from CoffeeScript output
// (see dev-coffee branch for original source)
importScripts('../lib/WavAudioEncoder.js'); 
var MAX_ENERGY_THRESHOLD = 0.65;
var LOW_ENERGY_THRESHOLD = 0.1;

var LEADING_SILENCE_SEC = 0.5; // secs
var TRAILING_SILENCE_SEC = 0.5; // secs

var leading_silence_buffer = 0;
var trailing_silence_buffer = 0;

var buffers = undefined,
    encoder = undefined;
var voice_start;
var voice_stop;
var voice_started;
var samples_per_sec;
var first_buffer;
var buffer_size;

// estimate volume
var speaking = false;
var total_buffer_energy = 0;

self.onmessage = function(event) {
  /**
  * set variables to their defaul values
  */
  function resetVariables(sampleRate) {
    encoder = new WavAudioEncoder(sampleRate);
    buffers = [];
    voice_start = 0;
    voice_stop = 0;
    voice_started = false;
    first_buffer = true;

    clipping = false;
    too_soft = false;
  }

  var data = event.data;
  switch (data.command) {
    case 'start':
      resetVariables(data.sampleRate);
      samples_per_sec = data.sampleRate;
      break;

    case 'record':
      if (first_buffer) {
        [leading_silence_buffer, trailing_silence_buffer] = 
            calculateSilencePadding(data.buffers.length, samples_per_sec);

        first_buffer = false;
      }
      buffers.push(data.buffers);
      break;

    case 'finish':
      var [speech_array, max_energy] = 
          extractSpeechFromRecording(buffers, voice_start, voice_stop);
      var [clipping, too_soft] = getEnergyThreshholds(max_energy);

      while (speech_array.length > 0) {
        encoder.encode(speech_array.shift());
      }

      self.postMessage({ 
        blob: encoder.finish(),
        clipping: clipping,
        too_soft: too_soft,
        max_energy: max_energy,
      });
      encoder = undefined;
      break;
/*
    case 'voice_start':
      // tracking leading silence.
      if ( ! voice_started ) { 
        voice_start = buffers.length;
        console.log('worker first voice_start= ' + voice_start);
        voice_started = true;
      } else {
        console.log('worker next voice_start= ' + voice_start + '; current frame= ' + buffers.length);
      }
      speaking = true;

      break;

    case 'voice_stop':
      voice_stop = buffers.length;
      console.log('worker voice_stop= ' + voice_stop);
      speaking = false;
      break;
*/
    case 'cancel':
      encoder.cancel();
      encoder = undefined;
  }
};






























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
