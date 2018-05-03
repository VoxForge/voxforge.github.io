// use about:debugging#workers in firefox to get at web worker

// manually rewritten from CoffeeScript output
// (see dev-coffee branch for original source)
importScripts('../lib/WavAudioEncoder.js'); 
importScripts('../scripts/Vad.js'); 

var buffers = undefined;
var encoder = undefined;
var vad = undefined;

self.onmessage = function(event) {
  var data = event.data;

  switch (data.command) {
    case 'start':
      buffers = [];
      encoder = new WavAudioEncoder(data.sampleRate);
      vad = new Vad(data.sampleRate);
      break;

    case 'record':
      buffers.push(data.buffers);
      vad.calculateSilenceBoundaries(data.buffers, buffers.length - 1);
      break;

    case 'finish':
      var [speech_array, clipping, too_soft] = vad.getSpeech(buffers);

      while (speech_array.length > 0) {
        encoder.encode(speech_array.shift());
      }

      self.postMessage({ 
        blob: encoder.finish(),
        clipping: clipping,
        too_soft: too_soft,
      });

      encoder = undefined;
      break;

    case 'cancel':
      encoder.cancel();
      encoder = undefined;
  }
};
