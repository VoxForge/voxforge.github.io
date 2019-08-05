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

/*
 * see: https://github.com/mattdiamond/Recorderjs/blob/master/src/recorder.js
 * they use min/max
 */

// TODO these functions should be in Audio namespace, even though it is only in webworker
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
}

// TODO use the output from WAVAudioEncoder
function floatTo16BitPCM(buffer) {
  var buffer_pcm = new Int16Array(buffer.length);
  var sum = 0;

  for (let i = 0; i < buffer.length; i++) {
    var sample = buffer[i];
    //sum += Math.abs( sample );
    sum += sample * sample;

    // original Mozilla 32-bit float to 16bit PCM encoder
    //let s = Math.max(-1, Math.min(1, sample));
    //buffer_pcm[i] =  s < 0 ? s * 0x8000 : s * 0x7FFF;

    var x = buffer[i] * 0x7fff; // 0x7fff = 32767
    buffer_pcm[i] =  x < 0 ? Math.max(x, -0x8000) : Math.min(x, 0x7fff);
  }
  //var energy = sum / buffer.length;
  var energy = Math.sqrt( sum / buffer.length ); // rms

  return [buffer_pcm, energy];
}

/*
 * assumes one channel (mono)
 * see: https://github.com/mattdiamond/Recorderjs/blob/master/src/recorder.js
 */
function createWavHeader(numSamples, bitDepth, sampleRate) {

    var writeString = function(view, offset, string) {
        for (var i = 0; i < string.length; ++i) {
          view.setUint8(offset + i, string.charCodeAt(i))
        }
    };

    // ###############################################################
    
    if (bitDepth == 16) {
      var dataSize = numSamples * 2; // 16 bit
    } else { 
      var dataSize = numSamples * 4; // 32-bit float
    }
    var view = new DataView(new ArrayBuffer(44));
    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + dataSize, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    if (bitDepth == 16) {
      view.setUint16(20, 1, true); // 0x0001	WAVE_FORMAT_PCM	PCM
    } else {
      view.setUint16(20, 3, true);  // 0x0003	WAVE_FORMAT_IEEE_FLOAT	IEEE float
    }
    /* channel count */
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 4, true);
    if (bitDepth == 16) {
      /* block align (channel count * bytes per sample) */
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
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, dataSize, true);

    return view;
}
