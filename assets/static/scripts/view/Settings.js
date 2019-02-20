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

'use strict';

/**
* setup app settings Popup for user to modify
*/
function Settings () {

}


/**
* settings pop up
* Note: localstorage only stores strings
*
* see app.js, line 68, for setting of default values
*
* see: http://jq4you.blogspot.com/2013/04/jquery-attr-vs-prop-difference.html
* Notes: an element’s property can be changed, because it is in the DOM and dynamic.
* But element’s attribute is in HTML text and can not be changed! comes in name=”value” pairs
*
* if adding new setting element, see settings.html for layout;
* default.yaml for text, app.js for defauls
*/
Settings.prototype.initPopup = function(message) {
    this._setRecordingInformation();
    this._setVisualizer();  
    this._setResourceIntensive();
    this._setSystemInformation();  
    
    // https://stackoverflow.com/questions/13675364/checking-unchecking-checkboxes-inside-a-jquery-mobile-dialog
    function setProperties(checked) {
      $('#recording_time_reminder').prop( "disabled", ! checked );
          $('#recording_time_reminder').prop('checked', checked).checkboxradio("refresh");
          // TODO does change work with jQuery Mobile?
          $('#recording_time_reminder').change(); // triggers change function

          // only enable geolocation selection when Record Info available
          $('#recording_geolocation_reminder').prop( "disabled", ! checked );
          $('#recording_geolocation_reminder').change(); // triggers change function       
    }
    
    function setPropertiesTrue() {
        setProperties(true)
        console.log("display_record_info enabled"); 
    }

    // clear certain field entries when user clicks display_record_info off
    function clearRecordingLocationInfo() {
        $('#recording_location').val($("select option:first").val()).change();
        $('#recording_location_other').val("").change();
        $('#background_noise').val($("select option:first").val()).change();
        $('#noise_volume').val($("select option:first").val()).change();
        $('#noise_type').val($("select option:first").val()).change();
        $('#noise_type_other').val("").change();
        
        setProperties(false);
        $('#recording_geolocation_reminder').prop('checked', false).checkboxradio("refresh");        
        console.log("display_record_info disabled");           
    }

    this.setupDisplayRecordInfo(
        "display_record_info",
        "recording_information_button_display",
        false,
        setPropertiesTrue,
        clearRecordingLocationInfo);
}


Settings.prototype.setupDisplayRecordInfo = function(
    checkbox_element,
    dependent_element,
    default_bool,
    func_if_true,
    func_if_false)
{
    var $checkbox_element = $('#' +checkbox_element);
    var $dependent_element = $('#' + dependent_element);
          
    if ( ! localStorage.getItem(dependent_element) ) {
        var default_string;
        if (default_bool) {
          default_string = 'true';
        } else {
          default_string = 'false';
        }
        localStorage.setItem(dependent_element, default_string);
        $dependent_element.hide();

        $checkbox_element.prop('checked', default_bool).change();
    } else {    
        if ( localStorage.getItem(checkbox_element) === 'true') {
        $dependent_element.show();
        $checkbox_element.prop('checked', true);
        } else {
        $dependent_element.hide();            
        $checkbox_element.prop('checked', false);
        }
    }

    $checkbox_element.change(function() {
        if (this.checked) {
            localStorage.setItem(checkbox_element, 'true');

            $dependent_element.show();
            localStorage.setItem(dependent_element, 'true');
            if (func_if_true) { func_if_true() }   
        } else {
            localStorage.setItem(checkbox_element, 'false');
            
            $dependent_element.hide();
            localStorage.setItem(dependent_element, 'false');
            if (func_if_false) { func_if_false() }  
        }
    });
}

Settings.prototype._setSystemInformation = function() {
    var checkbox = new Checkbox(
        "debug",
        true,
        function(){console.log("debug enabled")},
        function(){console.log("debug disabled")},);
    checkbox.setup();
            
    checkbox = new Checkbox(
        "ua_string",
        true,
        function(){console.log("ua_string enabled")},
        function(){console.log("ua_string disabled")},); 
    checkbox.setup();
}

Settings.prototype._setResourceIntensive = function() {
    var checkbox = new Checkbox(
        "waveform_display",
        true,
        function(){console.log("waveform_display enabled")},
        function(){console.log("waveform_display disabled")},);
    checkbox.setup();         

    checkbox = new Checkbox(
        "vad_run",
        true,
        function(){console.log("vad_run enabled")},
        function(){console.log("vad_run disabled")},);
    checkbox.setup();
            
    checkbox = new Checkbox(
        "recording_geolocation_reminder",
        false,
        function(){console.log("recording_geolocation_reminder enabled")},
        function(){console.log("recording_geolocation_reminder disabled")},); 
    checkbox.setup();
}

Settings.prototype._setVisualizer = function() {
    var checkbox = new Checkbox(
        "audio_visualizer",
        true,
        this._addVisualizer,
        this._removeVisualizer);
    checkbox.setup();
}

/**
* enable use of canvas visualizer
*
* user can disable on low resource devices
*/
Settings.prototype._addVisualizer = function() {    
    var vu_meter = document.querySelector('#vu-meter');
    var visualizer = document.createElement('canvas');
    visualizer.classList.add('visualizer');
    vu_meter.appendChild(visualizer);

    console.log("audio_visualizer enabled");         
}

/**
* see: https://dzone.com/articles/how-you-clear-your-html5
*/
Settings.prototype._removeVisualizer = function() {       
    var visualizer = document.querySelector('.visualizer');
    
    if ( visualizer ) {
        visualizer.width = visualizer.width; // clear canvas
        visualizer.parentNode.removeChild(visualizer); // remove from DOM
    }

    console.log("audio_visualizer disabled");            
}

Settings.prototype._setRecordingInformation = function() {
    var checkbox = new Checkbox(
        "recording_time_reminder",
        false,
        function(){console.log("recording_time_reminder enabled")},
        function(){console.log("recording_time_reminder disabled")},); 
    checkbox.setup();
}

/*
 * Set up defaults for checkbox and generate an event so that any user changes
 * are saved to localstorage
*/
function Checkbox (
    element,
    default_bool,
    func_if_true,
    func_if_false)
{
    this.element = element;
    this.$element = $('#' + this.element);    
    this.default_bool = default_bool;
    this.func_if_true = func_if_true;
    this.func_if_false = func_if_false;
}

Checkbox.prototype.setup = function() {
    if ( this._firstTimeSetup() ) {
        this._performDefaultSetup();
    } else {    
        this._restoreSettingsFromLocalStorage();
    }
    
    this._setEventFunction();
}

Checkbox.prototype._setEventFunction = function() {
    var self = this;
        
    this.$element.change( function() {
        self.$element.checkboxradio('refresh');

        // using 'this.checked' - it is in local context to this change 
        // function representing whether element has been checked or not
        self._execElementDefaultFunction.call(self, this.checked);           
        self._setElementValueInLocalStorage.call(self, this.checked);
    } );
}

/*
 * Nothing in local storage, therefore first time setup
 */
Checkbox.prototype._firstTimeSetup = function() {
    return ! localStorage.getItem(this.element);
}

Checkbox.prototype._performDefaultSetup = function() {
    this._execElementDefaultFunction(this.default_bool);
    this._setElementValueInLocalStorage(this.default_bool); 

    this.$element.prop('checked', this.default_bool);
    this.$element.prop( 'disabled', ! this.default_bool);
}

Checkbox.prototype._execElementDefaultFunction = function(test) {
    if ( ! this._functionsExist() ) {
        console.warn("missing default function(s)");
        return;
    }
    
    if (test) {
        this.func_if_true();
    } else {
        this.func_if_false();
    }
}

Checkbox.prototype._functionsExist = function(func) {
    return this.func_if_true && this.func_if_false;
}

Checkbox.prototype._setElementValueInLocalStorage = function(bool) {
    localStorage.setItem(
        this.element,
        this._convertBooleanToString(bool) ); 
}

/*
 * Local storage only uses strings (no booleans)
 */
Checkbox.prototype._convertBooleanToString = function(bool) {
    var default_string;
    
    if (bool) {
        default_string = 'true';
    } else {
        default_string = 'false';
    }

    return default_string;
}

/*
// if checkbox is being set based on contents of another checkbox, then
// need to use checkboxradio('refresh') so that it will display correctly
// in jQuery Mobile
// see: https://demos.jquerymobile.com/1.2.0/docs/forms/checkboxes/methods.html
*/
Checkbox.prototype._updateLocalStorageWithElementValue = 

Checkbox.prototype._restoreSettingsFromLocalStorage = function() {
    var checked = localStorage.getItem(this.element) === 'true';
    
    this._setDefaultPropertyFromLocalStorage(checked);
    this._setDefaultFunctionFromLocalStorage(checked);    
}

Checkbox.prototype._setDefaultPropertyFromLocalStorage = function(checked) {
    if ( checked ) {
        this.$element.prop('checked', true);
    } else {
        this.$element.prop('checked', false);
    }
}

Checkbox.prototype._setDefaultFunctionFromLocalStorage = function(checked) {
    if ( checked ) {
        if (this.func_if_true) { this.func_if_true() }
    } else {
        if (this.func_if_false) { this.func_if_false() }             
    }
}

