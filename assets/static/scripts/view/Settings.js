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
function Settings () {}


/*
 * Set up defaults for checkbox and generate an event so that any user changes
 * are saved to localstorage
*/
Settings.prototype.setupCheckbox = function (
    element,
    default_bool,
    func_if_true,
    func_if_false)
{
  var $element = $('#' + element);

  if ( ! localStorage.getItem(element) ) {
      var default_string;
      if (default_bool) {
          default_string = 'true';
          if (func_if_true) { func_if_true() }              
      } else {
          default_string = 'false';
          if (func_if_false) { func_if_false() }                
      }        
      // set defaults
      localStorage.setItem(element, default_string); 
      $element.prop('checked', default_bool);
      $element.prop( 'disabled', ! default_bool );
  } else {    
      if ( localStorage.getItem(element) === 'true') {
         $element.prop('checked', true);
         if (func_if_true) { func_if_true() }
      } else {
         $element.prop('checked', false);
         if (func_if_false) { func_if_false() }             
      }
  }

  $element.change( function() {
      // if checkbox is being set based on contents of another checkbox, then
      // need to use checkboxradio('refresh') so that it will display correctly
      // in jQuery Mobile
      // see: https://demos.jquerymobile.com/1.2.0/docs/forms/checkboxes/methods.html
      $element.checkboxradio('refresh');
              
      if (this.checked) {
        localStorage.setItem(element, 'true');
        if (func_if_true) { func_if_true() }          
      } else {
        localStorage.setItem(element, 'false');
        if (func_if_false) { func_if_false() }             
      }
  });
}

Settings.prototype.setupDisplayRecordInfo = function (
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

    $checkbox_element.change(function () {
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
Settings.prototype.initPopup = function (message) {
    /**
    * enable use of canvas visualizer
    *
    * user can disable on low resource devices
    */
    function addVisualizer () {
        var vu_meter = document.querySelector('#vu-meter');
        var visualizer = document.createElement('canvas');
        visualizer.classList.add('visualizer');
        vu_meter.appendChild(visualizer);

        console.log("audio_visualizer enabled");         
    }

    /**
    * see: https://dzone.com/articles/how-you-clear-your-html5
    */
    function removeVisualizer () {
        var visualizer = document.querySelector('.visualizer');
        
        if ( visualizer ) {
            visualizer.width = visualizer.width; // clear canvas
            visualizer.parentNode.removeChild(visualizer); // remove from DOM
        }

        console.log("audio_visualizer disabled");            
    }

    // Recording Information
    this.setupCheckbox(
        "recording_time_reminder",
        false,
        function(){console.log("recording_time_reminder enabled")},
        function(){console.log("recording_time_reminder disabled")},); 

    // Resource Intensive functions
    this.setupCheckbox(
        "audio_visualizer",
        true,
        addVisualizer,
        removeVisualizer);
    this.setupCheckbox(
        "waveform_display",
        true,
        function(){console.log("waveform_display enabled")},
        function(){console.log("waveform_display disabled")},); 
    this.setupCheckbox(
        "vad_run",
        true,
        function(){console.log("vad_run enabled")},
        function(){console.log("vad_run disabled")},); 
    this.setupCheckbox(
        "recording_geolocation_reminder",
        false,
        function(){console.log("recording_geolocation_reminder enabled")},
        function(){console.log("recording_geolocation_reminder disabled")},); 

    // System Information    
    this.setupCheckbox(
        "debug",
        true,
        function(){console.log("debug enabled")},
        function(){console.log("debug disabled")},); 
    this.setupCheckbox(
        "ua_string",
        true,
        function(){console.log("ua_string enabled")},
        function(){console.log("ua_string disabled")},); 

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
