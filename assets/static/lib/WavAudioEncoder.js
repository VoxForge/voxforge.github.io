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

  var Encoder = function(sampleRate, bitDepth) {
    this.sampleRate = sampleRate;
    this.numSamples = 0;
    this.dataViews = [];
    this.bitDepth = bitDepth;
  };

  Encoder.prototype.encode = function(buffer) {
    var len = buffer.length;

    if (this.bitDepth == 16) {
      // array of twos-complement 16-bit signed integers in the platform byte order.
      // If control over byte order is needed, use DataView...
      var view = new DataView(new ArrayBuffer(len * 2));

      var offset = 0;
      for (var i = 0; i < len; ++i) {
          // TODO use mozilla min/max approach to calculating 16bit sample - more efficient than ternary conditional
          var x = buffer[i] * 0x7fff; // 0x7fff = 32767
          // TODO why min max in original alg if by definition the 32-bit float only has a [-1,1] range??
          // trying to see if no min max causing scratches and pops...
          var sample16bit =  x < 0 ? max(x, -0x8000) : min(x, 0x7fff);
          view.setInt16(offset, sample16bit, true);
          offset += 2;
      }
      this.dataViews.push(view);
    } else { // 32-bit float
      this.dataViews.push(buffer);
    }

    this.numSamples += len;
  };

  Encoder.prototype.finish = function(mimeType) {
    //var dataSize = this.numChannels * this.numSamples * 2,
    if (this.bitDepth == 16) {
      var dataSize = this.numSamples * 2; // 16 bit
    } else { 
      var dataSize = this.numSamples * 4; // 32-bit float
    }
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
    if (this.bitDepth == 16) {
      view.setUint16(20, 1, true); // 0x0001	WAVE_FORMAT_PCM	PCM
    } else {
      view.setUint16(20, 3, true);  // 0x0003	WAVE_FORMAT_IEEE_FLOAT	IEEE float
    }
    /* channel count */
    //view.setUint16(22, this.numChannels, true);
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, this.sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, this.sampleRate * 4, true);
    if (this.bitDepth == 16) {
      /* block align (channel count * bytes per sample) */
      //view.setUint16(32, this.numChannels * 2, true);
      view.setUint16(32, 2, true);// 16 bits per sample
      /* bits per sample */
      view.setUint16(34, 16, true); // 16 bits per sample
    } else {
      /* block align (channel count * bytes per sample) */
      view.setUint16(32, 4, true);// 32 bits per sample
      /* bits per sample */
      view.setUint16(34, 32, true); // 32 bits per sample
    }
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
