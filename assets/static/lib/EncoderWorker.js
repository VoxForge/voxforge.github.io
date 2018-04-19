// use about:debugging#workers in firefox to get at web worker

// manually rewritten from CoffeeScript output
// (see dev-coffee branch for original source)
importScripts('WavAudioEncoder.js'); 

var buffers = undefined,
    encoder = undefined;

self.onmessage = function(event) {
  var data = event.data;
  switch (data.command) {
    case 'start':
      //encoder = new WavAudioEncoder(data.sampleRate, data.numChannels);
      encoder = new WavAudioEncoder(data.sampleRate);
      buffers = [];
      break;
    case 'record':
      buffers.push(data.buffers);
      break;
    case 'finish':
      while (buffers.length > 0)
        encoder.encode(buffers.shift());
      self.postMessage({ 
        blob: encoder.finish() 
      });
      encoder = undefined;
      break;
    case 'cancel':
      encoder.cancel();
      encoder = undefined;
  }
};
