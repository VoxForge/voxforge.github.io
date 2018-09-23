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

    this.watchID;
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
*
* Note: Watching for changes to a geolocation is not a free operation.
* while you're watching a position, you are engaging the device in a lot of extra processing.
*
* After you no longer need to track the user's position, call clearWatch to turn off the geolocation systems.
*
* test geolocation in Chrome console, sensors...
*/
Location.prototype.init = function () {
    var self = this;

    if (!navigator.geolocation){
        console.warn("Geolocation is not supported by your browser");
        return('');
    }


    // IP based geoloaction? https://stackoverflow.com/questions/15017854/geolocation-without-requesting-permission
    // see: https://developers.google.com/web/fundamentals/native-hardware/user-location/
    // Use the maximumAge optional property to tell the browser to use a
    // recently obtained geolocation result.
    // Unless you set a timeout, your request for the current position might never return.
    var options = {
        maximumAge: 5 * 60 * 1000,
        timeout: 10 * 1000,
    }

    function success(position) { // success
        self.coords.latitude = position.coords.latitude;
        self.coords.longitude = position.coords.longitude;
        console.log('Latitude is ' + self.coords.latitude +
                    '° Longitude is ' + self.coords.longitude + '°');
    }

    function error(err) { // error
        console.warn('ERROR(' + err.code + '): ' + err.message);
        // error.code can be:
        //   0: unknown error
        //   1: permission denied
        //   2: position unavailable (error response from location provider)
        //   3: timed out
    }
            
    if (! self.watchID) {
        navigator.geolocation.getCurrentPosition(success, error, options);
        // change of location event monitor
        // this way, self.coords always contains most current coordinates
        self.watchID = navigator.geolocation.watchPosition(success, error);
    }
}

/**
* reset geolocation state and properties
*/
Location.prototype.reset = function () {
    navigator.geolocation.clearWatch(this.watchID);
    this.coords.longitude = null;   
    this.coords.latitude = null;
}

/**
* return current location values (long & lat)
*/
Location.prototype.getLocation = function () {
    return( this.coords );
}

/**
* return current location values (long & lat)
*/
Location.prototype.getLocationString = function () {
    return( JSON.stringify( this.getLocation() ) );
}

/**
* 
*/
Location.prototype.saveToLocalStorage = function () {
    var coords = JSON.stringify(this.coords);
    localStorage.setItem( 'last_submission_coords',  coords);
}

