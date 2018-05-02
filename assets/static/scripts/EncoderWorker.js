// use about:debugging#workers in firefox to get at web worker

// manually rewritten from CoffeeScript output
// (see dev-coffee branch for original source)
importScripts('../lib/WavAudioEncoder.js'); 
importScripts('../scripts/call_vad.js'); 

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


// #############################################################################

self.onmessage = function(event) {
  /**
  * set variables to their defaul values
  */
  function resetVariables(sampleRate) {
    encoder = new WavAudioEncoder(sampleRate);
    buffers = [];
    voice_started = false;
    voice_stopped= false;
    first_buffer = true;

    clipping = false;
    too_soft = false;

    leftovers = 0;
    buffer_vad = new Int16Array(sizeBufferVad);
    silenceblocks = 0;
    skipsamples = 0;
    finishedvoice = false;
    samplesvoice = 0 ;
    samplessilence = 0 ;
    touchedvoice = false;
    touchedsilence = false;
    dtantes = Date.now();
    dtantesmili = Date.now();
    raisenovoice = false;
  }

  var data = event.data;
  switch (data.command) {
    case 'start':
      setupwebrtc(); 
      resetVariables(data.sampleRate);
      samples_per_sec = data.sampleRate;
      break;

    case 'record':
/*
      // num_samples_in_buffer whould be able to calculate with: event.inputBuffer.getChannelData(0).length
      if (first_buffer) {
        [leading_silence_buffer, trailing_silence_buffer] = 
            calculateSilencePadding(data.buffers.length, samples_per_sec);

        first_buffer = false;
      }
*/
      buffers.push(data.buffers);
      [speechstart_index, speechend_index] = 
          recorderProcess(data.buffers,
                          buffers.length - 1,
                          speechstart_index, 
                          speechend_index,
          );
      break;

    case 'finish':
/*
      var [speech_array, max_energy] = 
          extractSpeechFromRecording(buffers, voice_start, voice_stop);
      var [clipping, too_soft] = getEnergyThreshholds(max_energy);

      while (speech_array.length > 0) {
        encoder.encode(speech_array.shift());
      }
*/
      var start_index = Math.max(speechstart_index - 10, 0);
      var end_index = Math.min(speechend_index + 2,buffers.length);
      console.log("start_index=" + start_index + 
                  " ;end_index=" + end_index +
                  " ;buffer length=" + buffers.length);
      var speech_array =  buffers.slice(start_index, end_index);
      console.log("speech_array length=" + speech_array.length);

      while (speech_array.length > 0) {
        encoder.encode(speech_array.shift());
      }

      self.postMessage({ 
        blob: encoder.finish(),
//        clipping: clipping,
//        too_soft: too_soft,
//       max_energy: max_energy,
        clipping: false,
        too_soft: false,
        max_energy: false,
      });
      encoder = undefined;
      break;

    case 'cancel':
      encoder.cancel();
      encoder = undefined;
  }
};
