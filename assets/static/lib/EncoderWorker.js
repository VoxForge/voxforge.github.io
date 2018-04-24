// use about:debugging#workers in firefox to get at web worker

// manually rewritten from CoffeeScript output
// (see dev-coffee branch for original source)
importScripts('WavAudioEncoder.js'); 

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
      //encoder = new WavAudioEncoder(data.sampleRate, data.numChannels);
      encoder = new WavAudioEncoder(data.sampleRate);
      buffers = [];
      voice_start = 0;
      voice_stop = 0;
      voice_started = false;
      first_buffer = true;
      samples_per_sec = data.sampleRate;
      break;

    case 'record':
      if (first_buffer) {
        // TODO what if very short recording??? less than buffer length
        // what if recording is all silence?

        //                 samples per second / number of samples in buffer
        var buffers_per_sec = samples_per_sec / data.buffers.length; 
        leading_silence_buffer = Math.round(leading_silence_sec * buffers_per_sec);
        trailing_silence_buffer = Math.floor(trailing_silence_sec * buffers_per_sec);
        console.log('worker leading_silence_buffer= ' + leading_silence_buffer + '; trailing_silence_buffer= ' + trailing_silence_buffer);
        first_buffer = false;
      }

      buffers.push(data.buffers);
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

    case 'finish':
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

      var arrayslice =  buffers.slice(record_start, record_end);

      var max_energy=0;
      for (var i = 0; i < arrayslice.length; i++) {
        var total_buffer_energy = 0;
        for (var j = 0; j < arrayslice[i].length; j++) {
            total_buffer_energy += Math.abs( arrayslice[i][j]);
        }
        var avg_buffer_energy = Math.sqrt(total_buffer_energy / arrayslice[i].length);
        if (avg_buffer_energy > max_energy) {
           max_energy = avg_buffer_energy;
        }
      }
      console.log('max_energy=' + max_energy );
      var clipping = false;
      if (max_energy > 0.65)
        clipping = true;

      //while (buffers.length > 0)
      //  encoder.encode(buffers.shift());
      while (arrayslice.length > 0) {
        encoder.encode(arrayslice.shift());
      }
      self.postMessage({ 
        blob: encoder.finish(),
        clipping: clipping,
        max_energy: max_energy,
      });
      encoder = undefined;
      break;

    case 'cancel':
      encoder.cancel();
      encoder = undefined;
  }
};
