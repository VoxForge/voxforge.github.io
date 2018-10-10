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

importScripts('../scripts/wavAudioEncoder.js'); 
importScripts('../scripts/Vad.js'); 

var buffers = undefined;
var encoder = undefined;
var vad = undefined;
var vad_parms = undefined;
var prompt_id = undefined;
var ssd_parms = undefined;
var starttime = 0;

self.onmessage = function(event) {
  var data = event.data;

  switch (data.command) {
    case 'start':
      starttime = Date.now();

      prompt_id = data.prompt_id;
      buffers = [];
      encoder = new WavAudioEncoder(data.sampleRate, data.bitDepth);

      ssd_parms = data.ssd_parms;

      // user can turn on/off VAD at any time... therefore always create VAD object at startup
      vad = new Vad(data.sampleRate, data.vad_parms);

      break;

    case 'record':
      // no encoding while collecting audio so as not to tax the device
      // too much while recording
      buffers.push(data.event_buffer); // array of buffer arrays
      break;

    case 'record_vad':
      buffers.push(data.event_buffer); // array of buffer arrays
      // TODO either use this code or remove it!
      //startSimpleSilenceDetection(buffers.length - 1, data.event_buffer);

      //vad.calculateSilenceBoundaries(data.event_buffer, buffers.length - 1);
      // split buffer up into smaller chunks that VAD can digest
      let num_chunks = 4;
      let cutoff = Math.round(data.event_buffer.length / num_chunks);
      let buffers_index = buffers.length - 1;
      for (let i = 0; i < num_chunks; i++) {
        let chunk_index = i;
        let start = i * cutoff;
        let end = (i * cutoff) + cutoff
        // slice extracts up to but not including end.
        let chunk = data.event_buffer.slice(start, end);
        vad.calculateSilenceBoundaries(chunk, buffers_index, chunk_index);
      }
      break;

    case 'finish':
        // batch encoding after recording is completed
      while (buffers.length > 0) {
        encoder.encode(buffers.shift());
      }

      self.postMessage({
          status: 'finished',
          obj : { 
            prompt_id: prompt_id,
            blob: encoder.finish(), // convert audio from float to wav int16 or 32-bit float
            vad_run: false,
          }
      });

      encoder = undefined;
      buffers = [];
      break;

    case 'finish_vad':
      var speech_array = null;
      var no_speech = false;
      var no_trailing_silence = false; 
      var clipping = false;
      var too_soft = false;
      [speech_array, no_speech, no_trailing_silence, clipping, too_soft] = 
          vad.getSpeech(buffers);
      while (speech_array.length > 0) {
        encoder.encode(speech_array.shift());
      }

      self.postMessage({
          status: 'finished',
          obj : { 
            prompt_id: prompt_id,
            blob: encoder.finish(), // convert audio from float to wav int16 or 32-bit float
            no_trailing_silence: no_trailing_silence,
            no_speech: no_speech,
            clipping: clipping,
            too_soft: too_soft,
            vad_run: true,
          }
      });

      encoder = undefined;
      buffers = [];
      break;

    case 'cancel':
      encoder.cancel();
      encoder = undefined;
  }
  
};
