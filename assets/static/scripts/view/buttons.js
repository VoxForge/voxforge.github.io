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

View.prototype._setupButtons = function() {
    this.record = document.querySelector('.record');
    this.stop = document.querySelector('.stop');
    this.upload = document.querySelector('.upload');

    this.playbuttontext = this.pageVariables.playbuttontext;
    this.stopbuttontext = this.pageVariables.stopbuttontext;    
}

/**
* set record, stop button display
*/
View.prototype.setRSButtonDisplay = function(record, stop) {
    this.record.disabled = ! record;
    this.stop.disabled = ! stop;
}

/**
* set upload button display
*/
View.prototype.setUButtonDisplay = function(upload) {
    this.upload.disabled = ! upload;
}

/**
* set record, stop & upload button display
*/
View.prototype.setRSUButtonDisplay = function(record, stop, upload) {
    this.setRSButtonDisplay(record,stop);
    this.setUButtonDisplay(upload);
}

/**
* hide all dynamically created delete buttons
*/
View.prototype.disableDeleteButtons = function() {
    $('.delete').prop('disabled', true);
}

/**
* show all  dynamically created delete buttons
*/
View.prototype.enableDeleteButtons = function() {
    $('.delete').prop('disabled', false);
}


/**
* can't just disable the play button on the lower audio player, need to hide
* whole thing...
*/
View.prototype.hidePlayButtons = function() {
    $('.play').hide();
}

/**
* show all  dynamically created play buttons
* TODO disable does not seem to work with WaveSurfer
*/
View.prototype.showPlayButtons = function() {
    $('.play').show();
}
