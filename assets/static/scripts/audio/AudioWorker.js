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
importScripts('wavAudioEncoder.js'); 
importScripts('Vad.js'); 

function AudioWorker(data) {
    this.sampleRate = data.sampleRate;
    this.bitDepth = data.bitDepth;
    this.vad_parms = data.vad_parms;
    this.prompt_id = data.prompt_id;

    this.buffers = [];    
    this.dataViews = [];
    this.numSamples = 0;
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

    // no encoding while collecting audio for low powered devices
    case 'record':
      audioWorker._record(data);
      break;

    case 'finish':
      audioWorker._finish();
      break;

    case 'record_vad':
      audioWorker._recordVad(data);
      break;

    case 'finish_vad':
      audioWorker._finishVad();
      break;
  }
};

AudioWorker.prototype._initVad = function () {
    this.vad = new Vad(
        this.sampleRate,
        this.vad_parms);
}

AudioWorker.prototype._killVad = function () {
    this.vad = null;
}

AudioWorker.prototype._record = function (data) {
    this.buffers.push(data.event_buffer); // array of buffer arrays
    this.numSamples += data.event_buffer.length;
}

AudioWorker.prototype._finish = function () {
    self.postMessage({
        status: 'finished',
        obj : { 
            prompt_id: this.prompt_id,
            blob: this._convertBufferToAudioBlob(this.buffers),
            vad_run: false,
        }
    });

    this.buffers = [];
}

AudioWorker.prototype._convertBufferToAudioBlob = function (bufferArray) {
    this._convertBufferToWavDataViewFormat(bufferArray);
    this._addWavHeaderToDataView();
       
    return new Blob(
        this.dataViews, 
        { type: 'audio/wav' });
}

AudioWorker.prototype._convertBufferToWavDataViewFormat = function (bufferArray) {
    if (this.bitDepth === 16) { // testing FF on Chrome    
        this._convertAudioBuffersTo16bitDataView(bufferArray);
    } else { // 32-bit float - buffer unmodified
        this.dataViews = bufferArray;
    }
}

AudioWorker.prototype._convertAudioBuffersTo16bitDataView = function (bufferArray) {
    while (bufferArray.length > 0) {
        var view = float2int16(bufferArray.shift());
        this.dataViews.push(view);
    }
}

AudioWorker.prototype._addWavHeaderToDataView = function () {
    var header = createWavHeader(
        this.numSamples,
        this.bitDepth,
        this.sampleRate);
        
    this.dataViews.unshift(header);
}

// TODO VAD currently only works with 16-bit audio.
// So no matter what device you are using, if using vad,
// there will always be a conversion to 16-bit audio
/*
 * VAD can only process 16-bit audio, with sampling rates of 8/16/32/48kHz;
 * we are fudging a bit so can process 44.1kHz...
 * so split buffer up into smaller chunks that VAD can digest
 */ 
AudioWorker.prototype._recordVad = function (data) {
    this.buffers.push(data.event_buffer); // array of buffer arrays
    this.numSamples += data.event_buffer.length;

    let num_chunks = 4;
    let cutoff = Math.round(data.event_buffer.length / num_chunks);
    let buffers_index = this.buffers.length - 1;
    for (let i = 0; i < num_chunks; i++) {
        this._performVadOnChunk(data, i, cutoff, buffers_index);
    }
}

AudioWorker.prototype._performVadOnChunk = function(
    data,
    i,
    cutoff,
    buffers_index)
{
    let chunk_index = i;
    let start = i * cutoff;
    let end = (i * cutoff) + cutoff;
    // slice extracts up to but not including end.
    let chunk = data.event_buffer.slice(start, end);
    var [buffer_chunk_int, chunk_energy] = floatTo16BitPCM(chunk);

    this.vad.calculateSilenceBoundaries(
        buffer_chunk_int,
        chunk_energy,
        buffers_index,
        chunk_index);
}

AudioWorker.prototype._finishVad = function () {
    var speech_array, no_speech, no_trailing_silence, clipping, too_soft;
    
    [speech_array,
    no_speech,
    no_trailing_silence,
    clipping,
    too_soft] = this.vad.getSpeech(this.buffers);
        
    self.postMessage({
      status: 'finished',
      obj : { 
        prompt_id: this.prompt_id,
        blob: this._convertBufferToAudioBlob(speech_array),
        no_trailing_silence: no_trailing_silence,
        no_speech: no_speech,
        clipping: clipping,
        too_soft: too_soft,
        vad_run: true,
      }
    });

    this.buffers = [];
}
