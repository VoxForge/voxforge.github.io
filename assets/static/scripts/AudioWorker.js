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
var vad = undefined;
var vad_parms = undefined;
var prompt_id = undefined;
var ssd_parms = undefined;
var starttime = 0;

var dataViews;
var numSamples;
var sampleRate;
var bitDepth;

self.onmessage = function(event) {
  var data = event.data;

  switch (data.command) {
    case 'start':
      starttime = Date.now();
      dataViews = [];
      numSamples = 0;
      sampleRate = data.sampleRate;
      bitDepth = data.bitDepth;
      
      prompt_id = data.prompt_id;
      buffers = [];

      ssd_parms = data.ssd_parms;

      // user can turn on/off VAD at any time... therefore always create VAD object at startup
      vad = new Vad(data.sampleRate, data.vad_parms);

      break;

    case 'record':
      // no encoding while collecting audio for low powered devices
      buffers.push(data.event_buffer); // array of buffer arrays
      numSamples += data.event_buffer.length;
      break;

    case 'finish':
      // batch encoding after recording is completed
      if (bitDepth === 16) { // testing FF on Chrome    
        while (buffers.length > 0) {
          var view = float2int16(buffers.shift());
          dataViews.push(view);
        }
      } else { // 32-bit float - buffer unmodified
          dataViews = buffers;
      }
      var header = createWavHeader(numSamples, bitDepth, sampleRate);
      dataViews.unshift(header);
      var audio_blob = new Blob(dataViews, { type: 'audio/wav' });
      
      self.postMessage({
          status: 'finished',
          obj : { 
            prompt_id: prompt_id,
            blob: audio_blob,
            vad_run: false,
          }
      });

      buffers = [];
      break;

    case 'record_vad':
      buffers.push(data.event_buffer); // array of buffer arrays
      numSamples += data.event_buffer.length;

      // VAD can only process 16-bit audio, with sampling rates of 8/16/32/48kHz
      // we are fudging a bit so can process 44.1kHz
      //vad.calculateSilenceBoundaries(data.event_buffer, buffers.length - 1);
      // split buffer up into smaller chunks that VAD can digest
      let num_chunks = 4;
      let cutoff = Math.round(data.event_buffer.length / num_chunks);
      let buffers_index = buffers.length - 1;
      for (let i = 0; i < num_chunks; i++) {
        let chunk_index = i;
        let start = i * cutoff;
        let end = (i * cutoff) + cutoff;
        // slice extracts up to but not including end.
        let chunk = data.event_buffer.slice(start, end);
        vad.calculateSilenceBoundaries(chunk, buffers_index, chunk_index);
      }
      break;

    case 'finish_vad':
      var speech_array = null;
      var no_speech = false;
      var no_trailing_silence = false; 
      var clipping = false;
      var too_soft = false;
      [speech_array, no_speech, no_trailing_silence, clipping, too_soft] = 
          vad.getSpeech(buffers);

      if (bitDepth === 16) { // testing FF on Chrome    
        while (speech_array.length > 0) {
          var view = float2int16(speech_array.shift());
          dataViews.push(view);
        }
      } else { // 32-bit float - buffer unmodified
          dataViews = speech_array;
      }

      var header = createWavHeader(numSamples, bitDepth, sampleRate);
      dataViews.unshift(header);
      var audio_blob = new Blob(dataViews, { type: 'audio/wav' });
           
      self.postMessage({
          status: 'finished',
          obj : { 
            prompt_id: prompt_id,
            blob: audio_blob,
            no_trailing_silence: no_trailing_silence,
            no_speech: no_speech,
            clipping: clipping,
            too_soft: too_soft,
            vad_run: true,
          }
      });

      buffers = [];
      break;
  }
  
};
