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
function Debug (standalone) 
{
  this.audio = {};
  this.prompts = {};
  this.app = {
      'standalone' : standalone,
  };
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
    var profile_hash = {};

    profile_hash["audio"] = this.audio;
    profile_hash["prompts"] = this.prompts;
    profile_hash["app"] = this.app;
    
    return profile_hash;
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
