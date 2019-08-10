// !!!!!! removed because software autogain was causing more problems
// than it was solving



/*
Copyright 2019 VoxForge

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
 * see: http://teropa.info/blog/2016/08/30/amplitude-and-loudness.html
 *
 * see also: https://webaudioapi.com/samples/volume/
 */
// TODO user should be able to disable automatic recording volume adjuster
Audio.MicVolume = function (
    parms,
    obj,
    autoGainSupported,
    gainNode,
    audioCtx,
    debugValues)
{
    this.parms = parms;        
    this.obj = obj;
    // TODO most phones seem to have autoGainSupported=undefined; but
    // have autoGainControl=true; therefore need to check if autoGainControl=true
    this.autoGainSupported = autoGainSupported;
    this.gainNode = gainNode;      
    this.currentTime = audioCtx.currentTime;
    this.debugValues = debugValues;   
    
    this._setGainConstants();
    this._updateRecordingResultsObject();
    
    this.gainValue = this.gainNode.gain.value;
}

Audio.MicVolume.prototype._setGainConstants = function () {
    this.gain_maxValue = this.parms.gain.maxValue;

    this.gain_decrement_factor = this.parms.gain.decrement_factor;
    this.gain_increment_factor = this.parms.gain.increment_factor;
    this.gain_max_increment_factor = this.parms.gain.max_increment_factor;
}

Audio.MicVolume.prototype._updateRecordingResultsObject = function () {
    this.obj.platform = this.parms.platform;
    this.obj.gain = this.gainNode.gain.value;
}

/**
 * Problem: user cannot adjust mic volume on smartphones; need some way to do so:
 * Solution:
 *      A. Voxforge app automatic mic volume control; or
 *      B. allow user to adjust recording volume using slider
 * TODO: allow user to disable VF software auto recorder volume adjust
 * 
 * I. on Desktops
 *      a. O/S will always let user manually adjust mic volume;
 *      b. browser may have software auto asjust of recording volume (autogain);
 *   browser may have autogain or not; regardless, since O/S allows it: don't use
 *   VoxForge volume adjuster
 * 
 * II. on Smartphones
 *      a. smartphone has software/hardware automatic microphone adjuster
 *      (does not matter whether it is in O/S or browser)
 *          - don't use VoxForge volume adjuster
 *      b. if not: i) use Voxforge software gain adjustment
 *                 ii) add mic volume adjuster
 * 
 */
// TODO automatic volume adjustment not user friendly if user misses recording
// first prompt; make it optional
// TODO just set up volume slider in settings... see: https://webaudioapi.com/samples/volume/
// see also: http://cwestblog.com/2017/08/17/html5-getting-more-volume-from-the-web-audio-api/
// TODO make audio level notification higher priority than no trailing silence
// message
// TODO only change levels if valid recording with speech
// TODO voxforge auto gain code also messes up VAD and therefore leading and
// trailing silence does not get pruned correctly...
/**
* app auto gain - changes gain for the *next* recording (not the current one)
*
* changing gain also increases noise in what were silence portions
* and this might mess up VAD
*
* tells user that audio is too loud or soft, adjusts
* gain (volume) up or down, then tells them to delete the 
* prompt and re-record at new gain level
*
*
* see: https://sound.stackexchange.com/questions/23877/how-can-i-limit-live-audio-from-the-clipping-effect
* Split the audio feed and run it into two different inputs. Set the gain at
* different levels on those two inputs, one "hot" and one "not". The one with
* higher gain will have the best audio quality (least noise) but the one with
* the lower gain is insurance in case the first one clips.
*/
Audio.MicVolume.prototype.adjust = function () {
    if (this.obj.clipping) {
        this._reduceVolume();
    } else if (this.obj.too_soft && this._gainFactorLessThanMaxValue() ) {
        this._increaseVolume();
    } else if (this.obj.no_speech && this._gainFactorLessThanMaxValue() ) {
        this._increaseMaxVolume();
    }     
}

/*
 * gain is always a positive number (audio signals can vary between [-1, 1]
 */
Audio.MicVolume.prototype._gainFactorLessThanMaxValue = function () {
    return this.obj.gain < this.gain_maxValue;
}

/*
 * gain is always a positive number, and a fraction of a positive real number will
 * always be positive, just really small...
 */
Audio.MicVolume.prototype._reduceVolume = function () {
    var newgain = this.gainValue * this.gain_decrement_factor;
    this._setGain(newgain);

    this._logGainChange("gainChange: too loud (clipping)", newgain);        
}

Audio.MicVolume.prototype._increaseVolume = function () {
    var newgain = Math.min(
        this.gainValue * this.gain_increment_factor, this.gain_maxValue);
    this._setGain(newgain);

    this._logGainChange("gainChange: volume too low", newgain);        
}

Audio.MicVolume.prototype._increaseMaxVolume = function () {
    var newgain = Math.min(
        this.gainValue * this.gain_max_increment_factor, this.gain_maxValue);
    this._setGain(newgain);

    this._logGainChange("gainChange: no speech", newgain);
}

/*
 * In theory, a sound wave can have any amplitude (the amplitude controls how
 * loud we perceive the signal to be).
 *
 * We can boost a wave by multiplying its samples with any arbitrarily large
 * number.  But in practice the Web Audio API limits amplitude to a
 * certain threshold.
 * 
 * In Web Audio, [-1, 1] is the range inside which all audio signals
 * should fall.
 *
 * But if you do send signals beyond the [-1, 1] limit to the destination,
 * you may start to hear clipping.
 *
 * (see: http://teropa.info/blog/2016/08/30/amplitude-and-loudness.html)
 * 
 * In Web Audio, the GainNode interface represents a change in volume. It
 * is an AudioNode audio-processing module that causes a given gain to be
 * applied to the input data before its propagation to the output.
 *
 * The gain is a unitless value, changing with time, that is multiplied
 * to each corresponding sample of all input channels. If modified,
 * the new gain is instantly applied (may cause clicks... therefore use
 * exponential interpolation)
 *
 * The default gain value is 1.0.
 * 
 * To increase mic volume, increase the gain value, but the resulting absolute
 * value of the signal cannot be greater than 1.0 (or less than -1.0), or
 * you will get clipping
 *
 * (see: https://developer.mozilla.org/en-US/docs/Web/API/GainNode)
 *
 * (see also: http://teropa.info/blog/2016/08/30/amplitude-and-loudness.html)
 */
Audio.MicVolume.prototype._setGain = function (newgain) {
    this.gainNode.gain.setValueAtTime(
        newgain,
        this.currentTime + 1);
}

Audio.MicVolume.prototype._logGainChange = function (m, newgain) {
    console.log (m +
        "; gain changed from: " +
        parseFloat(this.obj.gain).toFixed(2) +
        " to: " +
        parseFloat(newgain).toFixed(2));
    
    this.debugValues.gainNode_gain_value = newgain;
}
