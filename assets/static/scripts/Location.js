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
function Location () 
{
    this.coords = {}
    this.coords.longitude = null;   
    this.coords.latitude = null;

    this.initialized = false;
}

/** 
* This sets up location processing so if there is a change of location
* and event is fired that updates the class' attributes so that they are
* always valid (after processing delay to poll device location hardware)
*
* Note: Devices with a GPS, for example, can take a minute or more to get a GPS fix.
* By default, getCurrentPosition() tries to answer as fast as possible
* with a low accuracy result.
*
* if the position data changes (either by device movement or if
* more accurate geo information arrives) watchPosition() will fire
*
* TODO how to monitor difference between actual change of location and
* improvement in accuracy data change???
*/
Location.prototype.init = function () {
    var self = this;

    if (!navigator.geolocation){
        console.warn("Geolocation is not supported by your browser");
        return('');
    }

    // change of location event monitor
    // this way, self.coords always contains most current coordinates
    navigator.geolocation.watchPosition(
        function(position) { // success
            self.coords.latitude = position.coords.latitude;
            self.coords.longitude = position.coords.longitude;
        },
        function(err) { // error
            console.warn('ERROR(' + err.code + '): ' + err.message);
        },

    );

    // initial location determination
    return new Promise(function (resolve, reject) {

      function success(position) {
          self.coords.latitude  = position.coords.latitude;
          self.coords.longitude = position.coords.longitude;

          console.log('Latitude is ' + self.coords.latitude +
                      '° Longitude is ' + self.coords.longitude + '°');

          self.initialized = true;
          resolve( self.coords );
      }
      function error() {
          console.log('Unable to retrieve your location');
          resolve('');
      }

      navigator.geolocation.getCurrentPosition(success, error);

    }); // promise
}

/**
* return current location values (long & lat)
*/
Location.prototype.getLocation = function () {
    return( self.coords );
}

/**
* return current location values (long & lat)
*/
Location.prototype.getLocationString = function () {
    return( JSON.stringify( self.getLocation() ) );
}

/**
* 
*/
Location.prototype.clearproperties = function () {
    this.coords.longitude = null;   
    this.coords.latitude = null;
}

/**
* 
*/
Location.prototype.saveToLocalStorage = function () {
    localStorage.setItem( 'last_submission_coords', this.getLocationString() );
}

