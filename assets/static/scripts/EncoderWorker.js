// use about:debugging#workers in firefox to get at web worker

// manually rewritten from CoffeeScript output
// (see dev-coffee branch for original source)
importScripts('../lib/WavAudioEncoder.js'); 
var MAX_ENERGY_THRESHOLD = 0.65;
var LOW_ENERGY_THRESHOLD = 0.1;

// TODO click to stop recording should continue for a bit now that we have silence removal...
var leading_silence_sec = 0.4; // secs
// shorter because of lag before vad recognizes final silence...
var trailing_silence_sec = 0.3; // secs
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
  var data = event.data;
  switch (data.command) {
    case 'start':
      resetVariables(data.sampleRate);
      samples_per_sec = data.sampleRate;
      break;

    case 'record':
      if (first_buffer) {
        calculateSilencePadding(data.buffers.length, samples_per_sec);
        first_buffer = false;
      }
      buffers.push(data.buffers);
      break;

    case 'finish':
      var [speech_array, max_energy] = getSpeech();
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

    case 'voice_start':
      // don't care about silences between words; only tracking leading silence.
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

    case 'cancel':
      encoder.cancel();
      encoder = undefined;
  }
};

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

/**
* Calculate silence padding.  Must be calculated from event buffer because 
* there is no other way to get it... and buffer sizes differ markedly 
* depending on device (e.g. Linux 2048 samples per event buffer; Android 16384 
* samples)
*/
// TODO what if very short recording??? less than buffer length
function calculateSilencePadding(num_samples_in_buffer, samples_per_sec) {
  var buffers_per_sec = samples_per_sec / num_samples_in_buffer; 

  leading_silence_buffer = Math.round(leading_silence_sec * buffers_per_sec);
  trailing_silence_buffer = Math.floor(trailing_silence_sec * buffers_per_sec);

  console.log('worker leading_silence_buffer= ' + leading_silence_buffer + '; trailing_silence_buffer= ' + trailing_silence_buffer);
}

/**
* skip silence in a recording and only return those buffer containing speech,
* with leading and trailing silence padding
*/
function getSpeech() {
  if (typeof voice_start == 'undefined')
     voice_start = 0;
  if (typeof voice_stop == 'undefined')
     voice_stop = buffers.length;
  // should not happen
  if (voice_start > voice_stop) {
    console.warn( 'voice_stop=' + voice_stop + ' starts before voice_start=' + voice_start + ', capturing entire recording');
    voice_start = 0;
    voice_stop = buffers.length;
  }

  console.log('worker buffers.length=' + buffers.length + '; voice_start='+ voice_start + '; voice_stop='+ voice_stop);

  var record_start = Math.max(voice_start - leading_silence_buffer, 0);
  var record_end = Math.min(voice_stop + trailing_silence_buffer, buffers.length);
  console.log('worker record_start='+ record_start + '; record_end='+ record_end);

  var speech_array =  buffers.slice(record_start, record_end);

  var max_energy=0;
  for (var i = 0; i < speech_array.length; i++) {
    var total_buffer_energy = 0;
    for (var j = 0; j < speech_array[i].length; j++) {
        total_buffer_energy += Math.abs( speech_array[i][j]);
    }
    var avg_buffer_energy = Math.sqrt(total_buffer_energy / speech_array[i].length);
    if (avg_buffer_energy > max_energy) {
       max_energy = avg_buffer_energy;
    }
  }
  console.log('max_energy=' + max_energy );

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

