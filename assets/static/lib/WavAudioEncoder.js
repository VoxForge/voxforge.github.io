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
*/

(function(self) {
  var min = Math.min,
      max = Math.max;

  var setString = function(view, offset, str) {
    var len = str.length;
    for (var i = 0; i < len; ++i)
      view.setUint8(offset + i, str.charCodeAt(i));
  };

  //var Encoder = function(sampleRate, numChannels) {
  var Encoder = function(sampleRate) {
    this.sampleRate = sampleRate;
//    this.numChannels = numChannels;
    this.numSamples = 0;
    this.dataViews = [];
  };

  // why convert to 16-bit... because takes up less space...

  //  convert raw 32-bit floating point audio samples to 16-bit signed integer
  // see https://stackoverflow.com/questions/43881026/convert-32-bit-floating-points-to-16-bit-pcm-range
  // see also: https://github.com/mattdiamond/Recorderjs/blob/master/src/recorder.js

  // https://github.com/Jam3/audiobuffer-to-wav/blob/master/index.js

  // see also: see: https://github.com/higuma/wav-audio-encoder-js

  // a more efficient way to copy 32-bit float is: AudioBuffer.copyFromChannel()
  // see: https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer/copyFromChannel

  Encoder.prototype.encode = function(buffer) {
    //var len = buffer[0].length,
    //    nCh = this.numChannels,
    //    view = new DataView(new ArrayBuffer(len * nCh * 2)),
    //    offset = 0;
    //for (var i = 0; i < len; ++i)
    // for (var ch = 0; ch < nCh; ++ch) {
    //    var x = buffer[ch][i] * 0x7fff; // 0x7fff = 32767
    //    view.setInt16(offset, x < 0 ? max(x, -0x8000) : min(x, 0x7fff), true);
    //    offset += 2;
    //  }
    var len = buffer.length;
    // array of twos-complement 16-bit signed integers in the platform byte order.
    //var buffer_pcm = new Int16Array(len); // webrtc_vad
    // If control over byte order is needed, use DataView instead.
    var view = new DataView(new ArrayBuffer(len * 2));

    var offset = 0;

    for (var i = 0; i < len; ++i) {
        var x = buffer[i] * 0x7fff; // 0x7fff = 32767
        // TODO why min max in original alg if by definition the 32-bit float only has a [-1,1] range??
        // trying to see if no min max causingn scratichin and pops...
        //view.setInt16(offset, x , true);
        var sample16bit =  x < 0 ? max(x, -0x8000) : min(x, 0x7fff);
        //buffer_pcm[i] = sample16bit;  // webrtc_vad
        view.setInt16(offset, sample16bit, true);
        offset += 2;
    }
    this.dataViews.push(view);
    this.numSamples += len;

    //return buffer_pcm; // !!!!!! for webrtc_vad
  };

  Encoder.prototype.finish = function(mimeType) {
    //var dataSize = this.numChannels * this.numSamples * 2,
    var dataSize = this.numSamples * 2;
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
    //view.setUint16(22, this.numChannels, true);
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, this.sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, this.sampleRate * 4, true);
    /* block align (channel count * bytes per sample) */
    //view.setUint16(32, this.numChannels * 2, true);
    view.setUint16(32, 2, true);
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
