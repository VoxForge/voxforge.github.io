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

importScripts('../lib/WavAudioEncoder.js'); 
importScripts('../scripts/Vad.js'); 

var buffers = undefined;
var encoder = undefined;
var vad_obj = undefined;
var vad = undefined;

self.onmessage = function(event) {
  var data = event.data;

  switch (data.command) {
    case 'start':
      buffers = [];
      encoder = new WavAudioEncoder(data.sampleRate);
      vad = data.vad;
      if ( vad ) {
          vad_obj = new Vad(data.sampleRate, data.low_powered_device);
      } else {
         console.log('VAD disabled');
      }
      break;

    case 'record':
      buffers.push(data.event_buffer);
      if ( vad ) {
         vad_obj.calculateSilenceBoundaries(data.event_buffer, buffers.length - 1);
      }
      break;

    case 'finish':
      var speech_array = null;
      var no_speech = false;
      var no_trailing_silence = false; 
      var clipping = false;
      var too_soft = false;
      if ( vad ) {
        [speech_array, no_speech, no_trailing_silence, clipping, too_soft] = 
            vad_obj.getSpeech(buffers);
        while (speech_array.length > 0) {
          encoder.encode(speech_array.shift());
        }
      } else {
        while (buffers.length > 0) {
          encoder.encode(buffers.shift());
        }
      }

      self.postMessage({ 
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
