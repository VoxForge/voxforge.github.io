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
function Settings () { }

/*
 * Local storage only uses strings (no booleans)
 */
Settings.convertBooleanToString = function(bool) {
    var bool_string;
    
    if (bool) {
        bool_string = 'true';
    } else {
        bool_string = 'false';
    }

    return bool_string;
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
* default.yaml for text, app.js for defaults
*/
Settings.prototype.initPopup = function(message) {
    this._setRecordingInformationCheckBox();
    this._setResourceIntensive();
    this._setSystemInformation();  
    
    var recordInfo = new DependentElement (
        "display_record_info",
        "recording_information_button_display",
        false,
        this._setPropertiesTrue.bind(this),
        this._clearRecordingLocationInfo.bind(this),);
    recordInfo.setup();
}

Settings.prototype._setPropertiesTrue = function() {
    this._setProperties(true);
    console.log("display_record_info enabled"); 
}

/*
// https://stackoverflow.com/questions/13675364/checking-unchecking-checkboxes-inside-a-jquery-mobile-dialog
*/
Settings.prototype._setProperties = function(checked) {        
    $('#recording_time_reminder').prop( "disabled", ! checked );
    $('#recording_time_reminder').prop('checked', checked).checkboxradio("refresh");
    // TODO does change work with jQuery Mobile?
    $('#recording_time_reminder').change(); // triggers change function

    // only enable geolocation selection when Record Info available
    $('#recording_geolocation_reminder').prop( "disabled", ! checked );
    $('#recording_geolocation_reminder').change(); // triggers change function       
}

/*
* clear certain field entries when user clicks display_record_info off
*/
Settings.prototype._clearRecordingLocationInfo = function() {    
    $('#recording_location').val($("select option:first").val()).change();
    $('#recording_location_other').val("").change();
    $('#background_noise').val($("select option:first").val()).change();
    $('#noise_volume').val($("select option:first").val()).change();
    $('#noise_type').val($("select option:first").val()).change();
    $('#noise_type_other').val("").change();
    
    this._setProperties(false);
    $('#recording_geolocation_reminder').prop('checked', false).checkboxradio("refresh");        
    console.log("display_record_info disabled");           
}

// TODO when turn this off, recording_geolocation_reminder shows
// message on console saying it is enabled on even though it is off?????
// see: setProperties above
Settings.prototype._setRecordingInformationCheckBox = function() {
    this._setupCheckBox("recording_time_reminder", false);       
}

Settings.prototype._setResourceIntensive = function() {
    this._setupCheckBox("recording_geolocation_reminder", false);      
    this._setupCheckBox("vad_run", true);  
    this._audioVisualizer();
    this._setupCheckBox("waveform_display", true);      
}

Settings.prototype._audioVisualizer = function() {
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

Settings.prototype._setSystemInformation = function() {
    this._setupCheckBox("ua_string", true);    
    this._setupCheckBox("debug", true);
}

Settings.prototype._setupCheckBox = function(func_name, bool) {
    var checkbox = new Checkbox(
        func_name,
        bool,
        function(){console.log(func_name + " enabled")},
        function(){console.log(func_name + " disabled")},);
    checkbox.setup();
}

// #############################################################################

function DependentElement (
    checkbox_element,
    dependent_element,
    default_bool,
    func_on_true,
    func_on_false,)
{
    this.checkbox_element = checkbox_element;
    this.dependent_element = dependent_element;
    this.default_bool = default_bool;
    this.$checkbox_element = $('#' + checkbox_element);
    this.$dependent_element = $('#' + dependent_element);
    this.func_on_true = func_on_true;
    this.func_on_false = func_on_false;    
}

DependentElement.prototype.setup = function() {
    if ( this._dependentElementdoesNotExistInStorage() ) {
        this._setupLocalStorage();
    } else {    
        this._getFromLocalStorage();
    }

    var self = this;
    this.$checkbox_element.change(function() {
        if (this.checked) {
            self._independentElementChecked.call(self);
        } else {
            self._independentElementUnchecked.call(self);          
        }
    });
}

DependentElement.prototype._independentElementChecked = function() {
    localStorage.setItem(self.checkbox_element, 'true');

    this.$dependent_element.show();
    localStorage.setItem(self.dependent_element, 'true');
    this.func_on_true();   
}

DependentElement.prototype._independentElementUnchecked = function() {
    localStorage.setItem(self.checkbox_element, 'false');

    this.$dependent_element.hide();
    localStorage.setItem(self.dependent_element, 'false');
    this.func_on_false();   
    }

DependentElement.prototype._getFromLocalStorage = function() {
    if ( localStorage.getItem(this.checkbox_element) === 'true') {
        this.$dependent_element.show();
        this.$checkbox_element.prop('checked', true);
    } else {
        this.$dependent_element.hide();            
        this.$checkbox_element.prop('checked', false);
    }
}

DependentElement.prototype._setupLocalStorage = function() {
    localStorage.setItem(
        this.dependent_element,
        Settings.convertBooleanToString(this.default_bool) );
    this.$dependent_element.hide();

    this.$checkbox_element.prop('checked', this.default_bool).change();
}

DependentElement.prototype._dependentElementdoesNotExistInStorage = function() {
    return ! localStorage.getItem(this.dependent_element);
}


// #############################################################################

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
        Settings.convertBooleanToString(bool) ); 
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

