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
// TODO need to split the display for advanced and easy modes for selecting
// things
View.Settings = function() {

}

/*
 * Local storage only uses strings (no booleans)
 */
View.Settings._convertBooleanToString = function(bool) {
    if (bool) {
        return 'true';
    } else {
        return 'false';
    }
}

/**
* settings pop up
* Note: localstorage only stores strings
*
* see main.js, line 68, for setting of default values
*
* see: http://jq4you.blogspot.com/2013/04/jquery-attr-vs-prop-difference.html
* Notes: an element’s property can be changed, because it is in the DOM and dynamic.
* But element’s attribute is in HTML text and can not be changed! comes in name=”value” pairs
*
* if adding new setting element, see settings.html for layout;
* default.yaml for text, main.js for defaults
*/
View.Settings.prototype.initPopup = function(message) {
    this._setResourceIntensive();
    this._setSystemInformation();
    this._setRecordInfoDependencies();
    this._setRecordingInformation();
}

View.Settings.prototype._setRecordingInformation = function() {
    this._setupCheckBox("recording_time_reminder", false, true);
    this._setupCheckBox("recording_geolocation_reminder", false, true);
}

View.Settings.prototype._setupCheckBox = function(
    func_name,
    default_checked,
    default_disabled)
{
    var checkbox = new View.Checkbox(
        func_name,
        default_checked,
        default_disabled,);
    checkbox.setup();
}

View.Settings.prototype._setResourceIntensive = function() {
    this._setupCheckBox("vad_run", true, false);
    this._audioVisualizer();
    this._setupCheckBox("waveform_display", true, false);      
}

View.Settings.prototype._audioVisualizer = function() {
    var default_checked = true;
    var default_disabled = false;
    
    var checkbox = new View.CheckboxWithFunction(
        "audio_visualizer",
        default_checked,
        default_disabled,        
        this._addVisualizer,
        this._removeVisualizer);
    checkbox.setup();
}

/**
* enable use of canvas visualizer
*
* user can disable on low resource devices
*/
View.Settings.prototype._addVisualizer = function() {    
    var vu_meter = document.querySelector('#vu-meter');
    var visualizer = document.createElement('canvas');
    visualizer.classList.add('visualizer');
    vu_meter.appendChild(visualizer);

    console.log("audio_visualizer enabled");         
}

/**
* see: https://dzone.com/articles/how-you-clear-your-html5
*/
View.Settings.prototype._removeVisualizer = function() {       
    var visualizer = document.querySelector('.visualizer');
    
    if ( visualizer ) {
        visualizer.width = visualizer.width; // clear canvas
        visualizer.parentNode.removeChild(visualizer); // remove from DOM
    }

    console.log("audio_visualizer disabled");
}

View.Settings.prototype._setSystemInformation = function() {
    this._setupCheckBox("ua_string", true, false);
    this._setupCheckBox("debug", true, false);
}

View.Settings.prototype._setRecordInfoDependencies = function() {
     var recordInfo = new View.DependentElement(
        "display_record_info",
        "recording_information_button_display",);
    recordInfo.setup();
}

// #############################################################################

View.DependentElement = function(
    setting_checkbox, // independent element
    button, ) // dependent element
{
    this.setting_checkbox = setting_checkbox;
    this.button = button; // button to display recording information

    this.$setting_checkbox = $('#' + setting_checkbox);
    this.$button = $('#' + button);
}

View.DependentElement.prototype.setup = function() {
    if ( this._dependentElementdoesNotExistInStorage() ) {
        this._setupLocalStorage();
    } else { 
        this._getFromLocalStorage();
    }

    var self = this;
    this.$setting_checkbox.change(function() { // not executed until user actually makes change to checkbox
        if (this.checked) {
            self._independentElementChecked.call(self);
        } else {
            self._independentElementUnchecked.call(self);          
        }
    });    
}

View.DependentElement.prototype._dependentElementdoesNotExistInStorage = function() {
    return ! localStorage.getItem(this.button);
}

View.DependentElement.prototype._setupLocalStorage = function() {
    localStorage.setItem(
        this.button,
        View.Settings._convertBooleanToString(false) );
    this.$button.hide();

    this.$setting_checkbox.prop('checked', false).change();
}

View.DependentElement.prototype._getFromLocalStorage = function() {
    if ( localStorage.getItem(this.setting_checkbox) === 'true') {
        this.$button.show();
        this.$setting_checkbox.prop('checked', true);
    } else {
        this.$button.hide();            
        this.$setting_checkbox.prop('checked', false);

        this._disableRecordInfoProperties();
    }
}

View.DependentElement.prototype._independentElementChecked = function() {
    localStorage.setItem(this.setting_checkbox, 'true');
    localStorage.setItem(this.button, 'true');
    this.$button.show();
    
    this._enableRecordInfoProperties();   
}

View.DependentElement.prototype._independentElementUnchecked = function() {
    localStorage.setItem(this.setting_checkbox, 'false');
    localStorage.setItem(this.button, 'false');
    this.$button.hide();

    this._disableRecordInfoProperties();      
}

/*
// https://stackoverflow.com/questions/13675364/checking-unchecking-checkboxes-inside-a-jquery-mobile-dialog
*/ 
View.DependentElement.prototype._enableRecordInfoProperties = function() {
    this._updateCheckbox('#recording_time_reminder', false, true);
    this._updateCheckbox('#recording_geolocation_reminder', false, false);
}

/*
* clear certain field entries when user clicks display_record_info off
*/
View.DependentElement.prototype._disableRecordInfoProperties = function() {    
    this._clearLocationSpecificRecordingInformation();
    
    this._updateCheckbox('#recording_time_reminder', true, false);
    this._updateCheckbox('#recording_geolocation_reminder', true, false);
}

View.DependentElement.prototype._clearLocationSpecificRecordingInformation = function() {    
    $('#recording_location').val($("select option:first").val()).change();
    $('#recording_location_other').val("").change();
    $('#background_noise').val($("select option:first").val()).change();
    $('#noise_volume').val($("select option:first").val()).change();
    $('#noise_type').val($("select option:first").val()).change();
    $('#noise_type_other').val("").change();
}

/*
 *  //$(element).prop('checked', checked).checkboxradio("refresh"); // refresh
 *    already being done within checkbox event function

 *  $(element).change(); // updates value in localstorage (triggers Checkbox
 *    change function to execute localstorage update)
 *    see: View.Checkbox.prototype._setEventFunction
 */
View.DependentElement.prototype._updateCheckbox = function(element, disabled, checked) {
    $(element).prop('disabled', disabled );
    $(element).prop('checked', checked);
    $(element).change(); // updates value in localstorage
}

// #############################################################################

/*
 * Set up defaults for checkbox and generate an event so that any user changes
 * are saved to localstorage
*/
View.Checkbox = function(
    element,
    default_checked,
    default_disabled)
{
    this.element = element;
    this.$element = $('#' + this.element);
     
    this.default_checked = default_checked; // element selected
    this.default_disabled = default_disabled;  // element display disabled  
}

View.Checkbox.prototype.setup = function() {
    if ( this._firstTimeSetup() ) {
        this._performDefaultSetup();
    } else {    
        this._restoreSettingsFromLocalStorage();
    }
    
    this._setEventFunction();
}

/*
 * Nothing in local storage, therefore first time setup
 */
View.Checkbox.prototype._firstTimeSetup = function() {
    return ! localStorage.getItem(this.element);
}

View.Checkbox.prototype._performDefaultSetup = function() {
    this._runFunction(this.default_checked);
    this._setElementValueInLocalStorage(this.default_checked); 

    this.$element.prop('checked', this.default_checked);
    this.$element.prop( 'disabled', this.default_disabled);
}

/*
 * if checkbox is being set based on contents of another checkbox, then
 * need to use checkboxradio('refresh') so that it will display correctly
 * in jQuery Mobile
 * see: https://demos.jquerymobile.com/1.2.0/docs/forms/checkboxes/methods.html
 *
 * Note: using 'this.checked' inside $element.change function - it is in local
 * context to this change function representing whether element has been
 * checked or not
 */
View.Checkbox.prototype._setEventFunction = function() {
    var self = this;

    this.$element.change( function() {
        self.$element.checkboxradio('refresh');

        self._runFunction.call(self, this.checked);           
        self._setElementValueInLocalStorage.call(self, this.checked);
    } );
}

View.Checkbox.prototype._runFunction = function(checked) {
    if (checked) {
        console.log(this.element + " enabled");
    } else {
        console.log(this.element + " disabled");
    }
}

View.Checkbox.prototype._setElementValueInLocalStorage = function(bool) {
    localStorage.setItem(
        this.element,
        View.Settings._convertBooleanToString(bool) );
}

View.Checkbox.prototype._restoreSettingsFromLocalStorage = function() {
    var checked = localStorage.getItem(this.element) === 'true';

    this._setDefaultPropertyFromLocalStorage(checked);
    this._logCheckboxChange(checked);
}

View.Checkbox.prototype._setDefaultPropertyFromLocalStorage = function(checked) {
    this.$element.prop('checked', checked);
}

// https://eli.thegreenplace.net/2013/10/22/classical-inheritance-in-javascript-es5
// #############################################################################
// subclass
View.CheckboxWithFunction = function(
    element,
    default_checked,
    default_disabled,
    func_if_true,
    func_if_false,)
{
    // Call constructor of superclass to initialize superclass-derived members.
    View.Checkbox.call(this, element, default_checked, default_disabled);

    this.func_if_true = func_if_true;
    this.func_if_false = func_if_false;
}

// Audio.VadWorker derives from Audio.Worker
View.CheckboxWithFunction.prototype = Object.create(View.Checkbox.prototype);
View.CheckboxWithFunction.prototype.constructor = View.Checkbox;

View.CheckboxWithFunction.prototype._runFunction = function(test) {
    if (test) {
        this.func_if_true();
    } else {
        this.func_if_false();
    }
}
