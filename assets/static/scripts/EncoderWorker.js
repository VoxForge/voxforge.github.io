// use about:debugging#workers in firefox to get at web worker

// manually rewritten from CoffeeScript output
// (see dev-coffee branch for original source)
importScripts('../lib/WavAudioEncoder.js'); 
importScripts('../scripts/call_vad.js'); 

var buffers = undefined;
var encoder = undefined;
var vad = undefined;

//var samples_per_sec;


// #############################################################################

self.onmessage = function(event) {
  var data = event.data;

  switch (data.command) {
    case 'start':
      buffers = [];
      encoder = new WavAudioEncoder(data.sampleRate);
      vad = new Vad();
//      samples_per_sec = data.sampleRate;
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
      vad.calculateSilenceBoundaries(data.buffers, buffers.length - 1);
      break;

    case 'finish':
      var speech_array = vad.getSpeech(buffers);

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
