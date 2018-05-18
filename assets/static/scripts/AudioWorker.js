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

self.onmessage = function(event) {
  var data = event.data;

  switch (data.command) {
    case 'start':
      prompt_id = data.prompt_id;
      buffers = [];
      encoder = new WavAudioEncoder(data.sampleRate);
      run = data.vad_parms.run;
      if ( run ) {
          vad = new Vad(data.sampleRate, data.vad_parms);
      } else {
         console.log('VAD disabled');
      }
      break;

    case 'record':
      buffers.push(data.event_buffer);
      if ( run ) {
         vad.calculateSilenceBoundaries(data.event_buffer, buffers.length - 1);
      }
      break;

    case 'finish':
      var speech_array = null;
      var no_speech = false;
      var no_trailing_silence = false; 
      var clipping = false;
      var too_soft = false;
      if ( run ) {
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
        prompt_id: prompt_id,
        blob: encoder.finish(),
        no_trailing_silence: no_trailing_silence,
        no_speech: no_speech,
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
