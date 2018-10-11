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

################################################################################

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


function float2int16(buffer) {
    var len = buffer.length;

    // array of twos-complement 16-bit signed integers in the platform byte order.
    // If control over byte order is needed, use DataView...
    var view = new DataView(new ArrayBuffer(len * 2));

    var offset = 0;
    for (var i = 0; i < len; ++i) {
        // TODO use mozilla min/max approach to calculating 16bit sample - more efficient than ternary conditional
        var x = buffer[i] * 0x7fff; // 0x7fff = 32767
        // TODO why min max in original alg if by definition the 32-bit float only has a [-1,1] range??
        // trying to see if no min max causing scratches and pops...
        var sample16bit =  x < 0 ? Math.max(x, -0x8000) : Math.min(x, 0x7fff);
        view.setInt16(offset, sample16bit, true);
        offset += 2;
    }
    
    return view;
  };

function finish(dataViews, numSamples, bitDepth, sampleRate) {

    var setString = function(view, offset, str) {
        var len = str.length;
        for (var i = 0; i < len; ++i) {
          view.setUint8(offset + i, str.charCodeAt(i))
        }
    };

    // ###############################################################
    
    //var dataSize = numChannels * numSamples * 2,
    if (bitDepth == 16) {
      var dataSize = numSamples * 2; // 16 bit
    } else { 
      var dataSize = numSamples * 4; // 32-bit float
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
    if (bitDepth == 16) {
      view.setUint16(20, 1, true); // 0x0001	WAVE_FORMAT_PCM	PCM
    } else {
      view.setUint16(20, 3, true);  // 0x0003	WAVE_FORMAT_IEEE_FLOAT	IEEE float
    }
    /* channel count */
    //view.setUint16(22, numChannels, true);
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 4, true);
    if (bitDepth == 16) {
      /* block align (channel count * bytes per sample) */
      //view.setUint16(32, numChannels * 2, true);
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

    dataViews.unshift(view);
    
    var blob = new Blob(dataViews, { type: 'audio/wav' });

    return blob;
  };


