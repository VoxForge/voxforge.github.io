/*

The MIT License (MIT)

Copyright (c) 2015 Yuji Miyane

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

see: https://github.com/higuma/wav-audio-encoder-js

*/


(function(self) {
  var min = Math.min,
      max = Math.max;

  var setString = function(view, offset, str) {
    var len = str.length;
    for (var i = 0; i < len; ++i)
      view.setUint8(offset + i, str.charCodeAt(i));
  };

  var Encoder = function(sampleRate, numChannels) {
    this.sampleRate = sampleRate;
    this.numChannels = numChannels;
    this.numSamples = 0;
    this.dataViews = [];
  };

  // TODO why convert to 16-bit... because wavesurfer doesn't seem to work with 32-bit float

  //  convert raw 32-bit floating point audio samples to 16-bit signed integer
  // see https://stackoverflow.com/questions/43881026/convert-32-bit-floating-points-to-16-bit-pcm-range
  // see also: https://github.com/mattdiamond/Recorderjs/blob/master/src/recorder.js
  Encoder.prototype.encode = function(buffer) {
    var len = buffer[0].length,
        nCh = this.numChannels,
        view = new DataView(new ArrayBuffer(len * nCh * 2)),
        offset = 0;
    for (var i = 0; i < len; ++i)
      for (var ch = 0; ch < nCh; ++ch) {
        var x = buffer[ch][i] * 0x7fff; // 0x7fff = 32767
        view.setInt16(offset, x < 0 ? max(x, -0x8000) : min(x, 0x7fff), true);
        offset += 2;
      }
    this.dataViews.push(view);
    this.numSamples += len;
  };

  Encoder.prototype.finish = function(mimeType) {
    var dataSize = this.numChannels * this.numSamples * 2,
    view = new DataView(new ArrayBuffer(44));
    /* RIFF identifier */
    setString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + dataSize, true);
    /* RIFF type */
    setString(view, 8, 'WAVE');
    /* format chunk identifier */
    setString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, this.numChannels, true);
    /* sample rate */
    view.setUint32(24, this.sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, this.sampleRate * 4, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, this.numChannels * 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    setString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, dataSize, true);

    this.dataViews.unshift(view);
    var blob = new Blob(this.dataViews, { type: 'audio/wav' });
    this.cleanup();
    return blob;
  };

  Encoder.prototype.cancel = Encoder.prototype.cleanup = function() {
    delete this.dataViews;
  };

  self.WavAudioEncoder = Encoder;
})(self);
