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

/**
* Class definition
*/
function Debug (appversion) 
{
    this.audio = {};
    this.prompts = {};
    this.appversion = appversion;
  
    this.appType = this._getAppType();
}

Debug.prototype._getAppType = function () {
    var appType = window.matchMedia('(display-mode: standalone)').matches;
    //console.log('display-mode standalone is: ' + appType);    

    return { 'standalone' : appType };
}

// ### Methods #################################################################
/**
* does not pick up service worker logs...
* cannot pick up XHR upload attempts since zip package already created...
* need to override console.log etc for every class...
* TODO: remove unneeded console.log entries
*
*see: https://stackoverflow.com/questions/13815640/a-proper-wrapper-for-console-log-with-correct-line-number/32928812#32928812
  https://stackoverflow.com/questions/11403107/capturing-javascript-console-log
* currently only providing class level debug in View... no other classes or service workers
* TODO: get service workers to pass back logs of what they did for inclusion in log file
*
*
* https://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server
* 
 *https://stackoverflow.com/questions/13815640/a-proper-wrapper-for-console-log-with-correct-line-number/32928812#32928812
 *
 * http://tobyho.com/2012/07/27/taking-over-console-log/
*/
Debug.prototype.addToLog = function (message) {
    this.log.push(message);
}

/**
* values used in debugging app on other devices
*
* updates:
      this.debug 
*/
Debug.prototype.setValues = function (attribute, obj) {
    this.clearValues(attribute);
    for (const prop in obj) {
      if (obj.hasOwnProperty(prop)) { // skip inherited properties
        this[attribute][prop] = obj[prop];
      }
    } 
}

/**
* clear specified debug entries
*/
Debug.prototype.clearValues = function (attribute) {
    this[attribute] = {};
}

/**
* return debug info as a hash
*/
Debug.prototype.toHash = function () {
    var debug_hash = {};

    debug_hash["audio"] = this.audio.debugValues;
    debug_hash["prompts"] = this.prompts;
    debug_hash["appType"] = this.appType;
    debug_hash.appversion = this.appversion;
    
    var date = new Date();
    debug_hash.timestamp = date.getTime(); // UTC timestamp in milliseconds;
    debug_hash.timezoneOffset = date.getTimezoneOffset();
    debug_hash.dateAndTime = date.toString();
        
    return debug_hash;
};

/**
* Convert debug object to JSON string, with line feeds after every key 
* value line
*
* used to create debug.json file
*/
Debug.prototype.toJsonString = function () {
    return JSON.stringify(this.toHash() ,null ,"  ");
}
