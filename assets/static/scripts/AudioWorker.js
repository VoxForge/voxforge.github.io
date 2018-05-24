/*
Copyright 2018 VoxForge

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

importScripts('../lib/WavAudioEncoder.js'); 
importScripts('../scripts/Vad.js'); 

var buffers = undefined;
var encoder = undefined;
var vad = undefined;
var run = undefined;
var prompt_id = undefined;
var event_buffer_size = undefined;
var got_buffer_size = false;
var vad_parms = undefined;
var ssd_parms = undefined;
var starttime = 0;

self.onmessage = function(event) {
  var data = event.data;

  switch (data.command) {
    case 'start':
      starttime = Date.now();

      prompt_id = data.prompt_id;
      buffers = [];
      encoder = new WavAudioEncoder(data.sampleRate);
      run = data.vad_parms.run;
      ssd_parms = data.ssd_parms;
      if ( run ) {
          vad = new Vad(data.sampleRate, data.vad_parms);
          vad_parms = data.vad_parms;
      } else {
         console.log('VAD disabled');
      }
      break;

    case 'record':
      buffers.push(data.event_buffer); // array of buffer arrays
      startSimpleSilenceDetection(buffers.length - 1, data.event_buffer);

      if ( run ) {
         vad.calculateSilenceBoundaries(data.event_buffer, buffers.length - 1);
      }

      // TODO do this in Audio class... simplify things
      // only way to get default event_buffer size is to look at what audio node 
      // sends you...therefore look at first event.buffer and save its length
      // TODO Amazon sets their buffer to 2048: https://aws.amazon.com/blogs/machine-learning/capturing-voice-input-in-a-browser/
      if ( ! got_buffer_size ) { 
        self.postMessage({
            status: 'event_buffer_size',
            obj : { 
              event_buffer_size: data.event_buffer.length,
            }
        });
        got_buffer_size = true;
      }
      break;

    case 'finish':
      var speech_array = null;
      var no_speech = false;
      var no_trailing_silence = false; 
      var clipping = false;
      var too_soft = false;
      if ( run ) {
        // need test for trailing and leading noise detection...
        [speech_array, no_speech, no_trailing_silence, clipping, too_soft] = 
            vad.getSpeech(buffers);
        while (speech_array.length > 0) {
          encoder.encode(speech_array.shift());
        }
      } else {
        while (buffers.length > 0) {
          encoder.encode(buffers.shift());
        }
      }

      self.postMessage({
          status: 'finished',
          obj : { 
            prompt_id: prompt_id,
            blob: encoder.finish(), // convert audio from float to int16
            no_trailing_silence: no_trailing_silence,
            no_speech: no_speech,
            clipping: clipping,
            too_soft: too_soft,
          }
      });

      encoder = undefined;
      break;

    case 'cancel':
      encoder.cancel();
      encoder = undefined;
  }
};



// using frequency domain data and minDecibels to detect silence
// https://stackoverflow.com/questions/46543341/how-can-i-extract-the-preceding-audio-from-microphone-as-a-buffer-when-silence?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
// zero crossings:
// https://dsp.stackexchange.com/questions/1178/using-short-time-energy-and-zero-crossing-rate?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
// https://github.com/cwilso/web-audio-samples/blob/master/samples/audio/zero-crossings.html

// see: https://aws.amazon.com/blogs/machine-learning/capturing-voice-input-in-a-browser/
// this is only useful in quiet environments... not a VAD
// only looks at first element of the smoothed buffer (see 
// smoothingTimeConstant setting below)
function startSimpleSilenceDetection(index, floatArray_time_domain) {
    /**
    *
    */
    function onSilence(index, elapsedTime, curr_value_time) {    
      console.log("*** [" + index + "] ***silence detected - value " + curr_value_time );
    }

    //var curr_value_time = (byteArray_time_domain[0] / 128) - 1.0; // values go from 0 to 255, with 128 being 0
    var curr_value_time = floatArray_time_domain[0] * 200.0;

    if (curr_value_time >       ssd_parms.amplitude   || 
        curr_value_time < (-1 * ssd_parms.amplitude)) 
    {
      starttime = Date.now();
    }
    var newtime = Date.now();
    var elapsedTime = newtime - starttime;
    if (elapsedTime > ssd_parms.duration) {
      onSilence(index, elapsedTime, curr_value_time);
      starttime = Date.now();
    } 
    //else {
    //  console.log("curr_value_time:" + curr_value_time );
    //}
}
