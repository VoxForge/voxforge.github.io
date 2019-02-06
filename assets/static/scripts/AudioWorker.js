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

function AudioWorker(data) {
    this.sampleRate = data.sampleRate;
    this.bitDepth = data.bitDepth;
    this.vad_parms = data.vad_parms;
    this.prompt_id = data.prompt_id;

    this.buffers = [];    
    this.dataViews = [];
    this.numSamples = 0;
}

AudioWorker.prototype._initVad = function () {
    this.vad = new Vad(
        this.sampleRate,
        this.vad_parms);
}

AudioWorker.prototype._killVad = function () {
    this.vad = null;
}

var audioWorker;

self.onmessage = function(event) {
  var data = event.data;
    
  switch (data.command) {
    case 'start':
      audioWorker = new AudioWorker(data);
      break;

    case 'init_vad':
      audioWorker._initVad();
      break;

    case 'kill_vad':
      audioWorker._killVad();
      break;

    case 'record':
      // no encoding while collecting audio for low powered devices
      audioWorker.buffers.push(data.event_buffer); // array of buffer arrays
      audioWorker.numSamples += data.event_buffer.length;
      break;

    case 'finish':
      // batch encoding after recording is completed
      if (audioWorker.bitDepth === 16) { // testing FF on Chrome    
        while (audioWorker.buffers.length > 0) {
          var view = float2int16(audioWorker.buffers.shift());
          audioWorker.dataViews.push(view);
        }
      } else { // 32-bit float - buffer unmodified
         audioWorker.dataViews = audioWorker.buffers;
      }
      var header = createWavHeader(
        audioWorker.numSamples,
        audioWorker.bitDepth,
        audioWorker.sampleRate);
      audioWorker.dataViews.unshift(header);
      
      var audio_blob = new Blob(
            audioWorker.dataViews,
            { type: 'audio/wav' });
      
      self.postMessage({
          status: 'finished',
          obj : { 
            prompt_id: audioWorker.prompt_id,
            blob: audio_blob,
            vad_run: false,
          }
      });

      audioWorker.buffers = [];
      break;

    // TODO VAD currently only works with 16-bit audio.
    // So no matter what device you are using, if using vad,
    // there will always be a conversion to 16-bit audio
    case 'record_vad':
      audioWorker.buffers.push(data.event_buffer); // array of buffer arrays
      audioWorker.numSamples += data.event_buffer.length;

      // VAD can only process 16-bit audio, with sampling rates of 8/16/32/48kHz
      // we are fudging a bit so can process 44.1kHz
      //vad.calculateSilenceBoundaries(data.event_buffer, buffers.length - 1);
      // split buffer up into smaller chunks that VAD can digest
      let num_chunks = 4;
      let cutoff = Math.round(data.event_buffer.length / num_chunks);
      let buffers_index = audioWorker.buffers.length - 1;
      for (let i = 0; i < num_chunks; i++) {
        let chunk_index = i;
        let start = i * cutoff;
        let end = (i * cutoff) + cutoff;
        // slice extracts up to but not including end.
        let chunk = data.event_buffer.slice(start, end);
        var [buffer_chunk_int, chunk_energy] = floatTo16BitPCM(chunk);

        audioWorker.vad.calculateSilenceBoundaries(
            buffer_chunk_int,
            chunk_energy,
            buffers_index,
            chunk_index);
      }
      break;

    case 'finish_vad':
      var speech_array = null;
      var no_speech = false;
      var no_trailing_silence = false; 
      var clipping = false;
      var too_soft = false;

      [speech_array,
       no_speech,
       no_trailing_silence,
       clipping,
       too_soft] = audioWorker.vad.getSpeech(audioWorker.buffers);

      if (audioWorker.bitDepth === 16) { // testing FF on Chrome    
        while (speech_array.length > 0) {
          var view = float2int16(speech_array.shift());
          audioWorker.dataViews.push(view);
        }
      } else { // 32-bit float - buffer unmodified
          audioWorker.dataViews = speech_array;
      }

      var header = createWavHeader(
        audioWorker.numSamples,
        audioWorker.bitDepth,
        audioWorker.sampleRate);
      audioWorker.dataViews.unshift(header);
      var audio_blob = new Blob(
            audioWorker.dataViews,
            { type: 'audio/wav' });
           
      self.postMessage({
          status: 'finished',
          obj : { 
            prompt_id: audioWorker.prompt_id,
            blob: audio_blob,
            no_trailing_silence: no_trailing_silence,
            no_speech: no_speech,
            clipping: clipping,
            too_soft: too_soft,
            vad_run: true,
          }
      });

      audioWorker.buffers = [];

      break;
  }
  
};
