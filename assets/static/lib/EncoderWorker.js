// use about:debugging#workers in firefox to get at web worker

// manually rewritten from CoffeeScript output
// (see dev-coffee branch for original source)
importScripts('WavAudioEncoder.js'); 

var buffers = undefined,
    encoder = undefined;
var voice_start;
var voice_started = false;
var voice_stop;
// TODO should be a function of sample rate
// TODO click to stop recording should continue for a but now that we have silence removal...
var leading_silence_buffer = 10;
var trailing_silence_buffer = 5;

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
    case 'voice_start':
      if ( ! voice_started ) {
          voice_start = buffers.length;
          console.log('worker voice_start= ' + voice_start);
          voice_started = true;
      }
      break;
    case 'voice_stop':
      voice_stop = buffers.length;
      console.log('worker voice_stop= ' + voice_stop);
      break;
    case 'finish':
      if (typeof voice_start == 'undefined')
         voice_start = 0;
      if (typeof voice_stop == 'undefined')
         voice_stop = buffers.length;
      // should not happen
      if (voice_start > voice_stop) {
        console.warn('voice_start='+ voice_start + ' is bigger than voice_stop='+ voice_stop);
        voice_start = 0;
        voice_stop = buffers.length;
      }

      console.log('worker buffers.length=' + buffers.length + '; voice_start='+ voice_start + '; voice_stop='+ voice_stop);

      var record_start = Math.max(voice_start - leading_silence_buffer, 0);
      var record_end = Math.min(voice_stop + trailing_silence_buffer, buffers.length);
      console.log('worker record_start='+ record_start + '; record_end='+ record_end);

      var arrayslice =  buffers.slice(record_start, record_end);
      //while (buffers.length > 0)
      //  encoder.encode(buffers.shift());
      while (arrayslice.length > 0)
        encoder.encode(arrayslice.shift());
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
