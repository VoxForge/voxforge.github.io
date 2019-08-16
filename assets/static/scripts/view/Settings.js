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
        default_disabled,        
        function(){console.log(func_name + " enabled")},
        function(){console.log(func_name + " disabled")},);
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
    
    var checkbox = new View.Checkbox(
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
        "recording_information_button_display",
        false,
        this._enableRecordInfoProperties.bind(this),
        this._disableRecordInfoProperties.bind(this),);
    recordInfo.setup();
}

/*
// https://stackoverflow.com/questions/13675364/checking-unchecking-checkboxes-inside-a-jquery-mobile-dialog
*/ 
View.Settings.prototype._enableRecordInfoProperties = function() {
    this._updateCheckbox('#recording_time_reminder', false, true);
    this._updateCheckbox('#recording_geolocation_reminder', false, false);    
}

View.Settings.prototype._updateCheckbox = function(element, disabled, checked) {
    $(element).prop('disabled', disabled );
    $(element).prop('checked', checked).checkboxradio("refresh");
    $(element).change(); // updates value in localstorage (triggers Checkbox change function to execute localstorage update)
}

/*
* clear certain field entries when user clicks display_record_info off
*/
View.Settings.prototype._disableRecordInfoProperties = function() {    
    this._clearLocationSpecificRecordingInformation();
    
    this._updateCheckbox('#recording_time_reminder', true, false);
    this._updateCheckbox('#recording_geolocation_reminder', true, false);    
}

View.Settings.prototype._clearLocationSpecificRecordingInformation = function() {    
    $('#recording_location').val($("select option:first").val()).change();
    $('#recording_location_other').val("").change();
    $('#background_noise').val($("select option:first").val()).change();
    $('#noise_volume').val($("select option:first").val()).change();
    $('#noise_type').val($("select option:first").val()).change();
    $('#noise_type_other').val("").change();
}

// #############################################################################

View.DependentElement = function(
    independent_element,
    dependent_element,
    default_bool,
    func_on_true,
    func_on_false,)
{
    this.independent_element = independent_element;
    this.dependent_element = dependent_element;
    this.default_bool = default_bool;
    this.func_on_true = func_on_true;
    this.func_on_false = func_on_false;

    this.$independent_element = $('#' + independent_element);
    this.$dependent_element = $('#' + dependent_element);
}

View.DependentElement.prototype.setup = function() {
    if ( this._dependentElementdoesNotExistInStorage() ) {
        this._setupLocalStorage();
    } else {    
        this._getFromLocalStorage();
    }

    var self = this;
    this.$independent_element.change(function() {
        if (this.checked) {
            self._independentElementChecked.call(self);
        } else {
            self._independentElementUnchecked.call(self);          
        }
    });
}

View.DependentElement.prototype._dependentElementdoesNotExistInStorage = function() {
    return ! localStorage.getItem(this.dependent_element);
}

View.DependentElement.prototype._setupLocalStorage = function() {
    localStorage.setItem(
        this.dependent_element,
        View.Settings._convertBooleanToString(this.default_bool) );
    this.$dependent_element.hide();

    this.$independent_element.prop('checked', this.default_bool).change();
}

View.DependentElement.prototype._getFromLocalStorage = function() {
    if ( localStorage.getItem(this.independent_element) === 'true') {
        this.$dependent_element.show();
        this.$independent_element.prop('checked', true);
    } else {
        this.$dependent_element.hide();            
        this.$independent_element.prop('checked', false);
    }
}

View.DependentElement.prototype._independentElementChecked = function() {
    localStorage.setItem(this.independent_element, 'true');

    this.$dependent_element.show();
    localStorage.setItem(this.dependent_element, 'true');
    
    this.func_on_true();   
}

View.DependentElement.prototype._independentElementUnchecked = function() {
    localStorage.setItem(this.independent_element, 'false');

    this.$dependent_element.hide();
    localStorage.setItem(this.dependent_element, 'false');
    
    this.func_on_false();   
}

// #############################################################################

/*
 * Set up defaults for checkbox and generate an event so that any user changes
 * are saved to localstorage
*/
View.Checkbox = function(
    element,
    default_checked,
    default_disabled,    
    func_if_true,
    func_if_false)
{
    this.element = element;
    this.$element = $('#' + this.element);
     
    this.default_checked = default_checked; // element selected
    this.default_disabled = default_disabled;  // element display disabled  
    this.func_if_true = func_if_true;
    this.func_if_false = func_if_false;
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
    this._execElementDefaultFunction(this.default_checked);
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

        self._execElementDefaultFunction.call(self, this.checked);           
        self._setElementValueInLocalStorage.call(self, this.checked);
    } );
}

View.Checkbox.prototype._execElementDefaultFunction = function(test) {
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

View.Checkbox.prototype._functionsExist = function(func) {
    return this.func_if_true && this.func_if_false;
}

View.Checkbox.prototype._setElementValueInLocalStorage = function(bool) {
    localStorage.setItem(
        this.element,
        View.Settings._convertBooleanToString(bool) ); 
}

View.Checkbox.prototype._restoreSettingsFromLocalStorage = function() {
    var checked = localStorage.getItem(this.element) === 'true';
    
    this._setDefaultPropertyFromLocalStorage(checked);
    this._setDefaultFunctionFromLocalStorage(checked);    
}

View.Checkbox.prototype._setDefaultPropertyFromLocalStorage = function(checked) {
    this.$element.prop('checked', checked);
}

View.Checkbox.prototype._setDefaultFunctionFromLocalStorage = function(checked) {
    if ( checked ) {
        if (this.func_if_true) { this.func_if_true() }
    } else {
        if (this.func_if_false) { this.func_if_false() }             
    }
}

View.PromptSettings = function(
    parms,
    prompts, )
{
    this.parms = parms;
    this.prompts = prompts;

    this.element = "numPromptsToRead";
    this.$element = $('#' + this.element);
    this.$element_display = $('#' + this.element + '_display'); // numPromptsToRead_display
}

View.PromptSettings.prototype.setup = function() {
    this._displayPrompts();
    this._setupChangeFunctions();

    return this.$element;
}

/**
* updates the current number of prompts that the user selected from dropdown
*/
View.PromptSettings.prototype._setupChangeFunctions = function() {
    var self = this;
        
    this.$element.change(function() {
        var new_numPromptsToRead = this.value.replace(/[^0-9\.]/g,'');
        self.prompts.userChangedNumPromptsToRead.call(
            self.prompts, new_numPromptsToRead );
        self.updateProgress();

        localStorage.setItem(
            self.element,
            new_numPromptsToRead );
    });
}

/**
* set default (device dependent) max number of prompts the user can record
*
* startPrompt = // min number of prompts no matter what device
*/
View.PromptSettings.prototype._displayPrompts = function() {
    var min = this.parms.numPromptsToRead.min;
    var max = this.parms.numPromptsToRead.max;    
    var incr = this.parms.increment;
    
    var option = ''; // clear previous use of option var // TODO why is this required??? should go out of scope after method is called???   
    for (var i=min; i <= max; i = i + incr) {
       option += '<option value="'+ i + '">' + i +  '</option>';
    }
    
    this.$element.append(option);
    this.$element_display.show();
}

/**
* update number of prompts recorded and total number of prompts to record
*/
View.PromptSettings.prototype.updateProgress = function() {
    document.querySelector('.progress-display').innerText =
        this.prompts.getProgressDescription.call(this.prompts);
}
