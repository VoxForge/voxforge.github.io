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

/**
*
given that audio recorded from smartphone sometimes contains scratches and pops, 
do we need to add dithering?
see: http://wiki.audacityteam.org/wiki/Dither
"Dither" is intentional noise which is added so as to randomise the quantisation 
errors  (rounding errors) that occur when downsampling the Bit Depth of an
 audio stream to a lower resolution than the current format. 
see also: 
http://darkroommastering.com/blog/dithering-explained



 * research:
 * from: https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer
  The buffer contains data in the following format:  non-interleaved IEEE754 
  32-bit linear PCM with a nominal range between -1 and +1, that is, 
  32bits floating point buffer, with each samples between -1.0 and 1.0.
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

  // TODO why convert to 16-bit... BECAUSE wavesurfer doesn't seem to work with 32-bit float
  // TODO only one channel for audio... therefore simplify loop...

  //  convert raw 32-bit floating point audio samples to 16-bit signed integer
  // see https://stackoverflow.com/questions/43881026/convert-32-bit-floating-points-to-16-bit-pcm-range
  // see also: https://github.com/mattdiamond/Recorderjs/blob/master/src/recorder.js

  // try it with 32-bit float: trying to figure out if noise artifacts on
  // recording on Android with FireFox (especially) or Chrome (sometimes)
  // is a result of downsampling quantization error, since no dithering is
  // being applied...
  // https://github.com/Jam3/audiobuffer-to-wav/blob/master/index.js
  //
  Encoder.prototype.encode = function(buffer) {
    var len = buffer[0].length,
        nCh = this.numChannels,
        //view = new DataView(new ArrayBuffer(len * nCh * 2)), // 16-bit
        view = new DataView(new ArrayBuffer(len * nCh * 4)), // 32-bit float
        offset = 0;
    //for (var i = 0; i < len; ++i)
    //  for (var ch = 0; ch < nCh; ++ch) {
    //    var x = buffer[ch][i] * 0x7fff; // 0x7fff = 32767
    //    view.setInt16(offset, x < 0 ? max(x, -0x8000) : min(x, 0x7fff), true);
    //    offset += 2;
    //  }
    var ch = 1;
    for (var i = 0; i < len; ++i) {
      view.setFloat32(offset,buffer[ch][i], true);
      offset += 4;
    }

    this.dataViews.push(view);
    this.numSamples += len;
  };

  Encoder.prototype.finish = function(mimeType) {
    var bitDepth = 32;
    var bytesPerSample = bitDepth / 8;
    var format = (bitDepth == 32 ? 3 : 1);
    var blockAlign = this.numChannels * bytesPerSample;

    var dataSize = this.numChannels * this.numSamples * bytesPerSample;
    view = new DataView(new ArrayBuffer(44)); // appending to this would take longer than just allocating it from the beginning....
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
    view.setUint16(20, format, true); 
    /* channel count */
    view.setUint16(22, this.numChannels, true);
    /* sample rate */
    view.setUint32(24, this.sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, this.sampleRate * blockAlign, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, blockAlign, true);
    /* bits per sample */
    view.setUint16(34, bitDepth, true);
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
