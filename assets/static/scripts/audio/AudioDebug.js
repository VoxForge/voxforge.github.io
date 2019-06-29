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

function AudioDebug(parms, track) {
    this.parms = parms;       
    this.track = track;
    
    this.debugValues = {};
}

AudioDebug.prototype.set = function () {
    this._browserSupportedProperties();
    this._propertiesActuallyTurnedOn();
    this._audioProperties();
    this._appRecordingProperties();     
}

AudioDebug.prototype._browserSupportedProperties = function () {
    var d = this.debugValues;
    var c = navigator.mediaDevices.getSupportedConstraints();
    
    d.browser_supports_echoCancellation =
        (typeof c.echoCancellation == 'undefined') ? 'undefined' : c.echoCancellation;
    d.browser_supports_noiseSuppression =
        (typeof c.noiseSuppression == 'undefined') ? 'undefined' : c.noiseSuppression;
    d.browser_supports_autoGain =
        (typeof c.autoGainSupported == 'undefined') ? 'undefined' : c.autoGainSupported;
}

AudioDebug.prototype._propertiesActuallyTurnedOn = function () {
    var d = this.debugValues;
    var s = this.track.getSettings();
       
    d.echoCancellation =
        (typeof s.echoCancellation == 'undefined') ? 'undefined' : s.echoCancellation;
    d.noiseSuppression =
        (typeof s.noiseSuppression == 'undefined') ? 'undefined' : s.noiseSuppression;              
    d.autoGainControl =
        (typeof s.autoGainControl == 'undefined') ? 'undefined' : s.autoGainControl;
}

AudioDebug.prototype._audioProperties = function () {
    var d = this.debugValues;
    var s = this.track.getSettings();
        
    d.channelCount =
        (typeof s.channelCount == 'undefined') ? 'undefined' : s.channelCount;
    d.latency =
        (typeof s.latency == 'undefined') ? 'undefined' : s.latency;
    d.volume =
        (typeof s.volume == 'undefined') ? 'undefined' : s.volume;
}

AudioDebug.prototype._appRecordingProperties = function () {
    var d = this.debugValues;
    
    d.vad_maxsilence = this.parms.vad.maxsilence;
    d.vad_minvoice = this.parms.vad.minvoice;
    d.vad_bufferSize = this.parms.vad.buffersize;
    d.audioNode_bufferSize = this.parms.audioNodebufferSize || 'undefined';

    // TODO is audioNodebufferSize always same device_event_buffer_size??    
    //d.device_event_buffer_size = this.device_event_buffer_size || 'undefined';
}
