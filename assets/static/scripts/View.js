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
/*
 *
 * ######## TODO convert View class from JQUERY to vanilla JS; keep jQuery mobile css
 */
function View (parms,
               prompts,
               profile,
               pageVariables)
{
    this.parms = parms;
    this.prompts = prompts;
    this.profile = profile;
    this.location = location;

    this.displayWaveform = parms.displayWaveform;

    // buttons
    this.record = document.querySelector('.record');
    this.stop = document.querySelector('.stop');
    this.upload = document.querySelector('.upload');

    // TODO this might work with delete if used class syntax (which should pick up many elements) instead of id synstax (which only pick up one element)
    this.delete_clicked = document.querySelector('#delete_clicked'); // only picks up first instance of in=delete in DOM

    this.localized_yes = pageVariables.localized_yes;
    this.localized_no = pageVariables.localized_no;
    this.localized_other = pageVariables.localized_other;
    this.please_select = pageVariables.please_select;
    this.default_value = pageVariables.default_value;
    this.alert_message = pageVariables.alert_message;

    this.playbuttontext = pageVariables.playbuttontext;
    this.stopbuttontext = pageVariables.stopbuttontext;

    this.settings = new Settings();
    this.submissionsLog = new SubmissionsLog(
         pageVariables.saved_submissions,
         pageVariables.uploaded_submissions,
    );
    this.audioPlayer = new AudioPlayer(
        prompts,
        pageVariables,
    );     
}

// ### METHODS #################################################################

/** 
* Initialize object with async operations (returns a promise)
*/
View.prototype.init = function () {
    var self = this;

    /**
    * The value of contents of the independent_div is compared to the passed in 
    * value, and if they are equal, then the dependent_div is displayed, otherwise
    * it is hidden 
    *
    * showDivBasedonValue makes the view of one div dependent on the value of a select 
    * field in another div, and attaches an event handler to independent div so that
    * any changes in it are reflected in dependent div
    *
    * see https://stackoverflow.com/questions/15566999/how-to-show-form-input-fields-based-on-select-value
    */
    var showDivBasedonValue = function (independent_div, value, dependent_div, handler_already_created) {
      function test ( boolean_result ) {
        if( boolean_result ){
          $(dependent_div).show();
        } else {
          $(dependent_div).hide();
        }
      }

      if ( typeof(value) === "boolean" && value === true ) { 
        // show if false; hide if true
        test( ! $(independent_div).val() );
      } else {
        test( $(independent_div).val()===value );
      }

      // only need to create event handler on first call to this function
      if ( ! handler_already_created ) 
      {
        $(independent_div).change(function () { // creates an event handler
            showDivBasedonValue(independent_div, value, dependent_div, true); 
        } );
      }
    }

    /*
     * compare value of independent div with passed in value and if equal, reset
     * selection option to default in dependent div
     */
    function setDefault(independent_div, value, dependent_div, handler_already_created) {
       if ( $(independent_div).val() === value ) {
           $(dependent_div).val($("select option:first").val()).change();
       }
      // only need to create event handler on first call to this function
      if ( ! handler_already_created ) 
      {
        $(independent_div).change(function () { // creates an event handler
            setDefault(independent_div, value, dependent_div, true); 
        } );
      }       
    }

    showDivBasedonValue('#native_speaker', self.localized_no, '#first_language_display', false);
    showDivBasedonValue('#native_speaker', self.localized_yes, '#dialect_display', false);
    // causes sub-dialect to display immediately rather than when Canadian or American dialect selected
    //showDivBasedonValue('#native_speaker', self.localized_yes, '#sub_dialect_display', false);
    setDefault('#native_speaker', self.localized_yes, '#first_language', false);
    setDefault('#native_speaker', self.localized_no, '#dialect', false);
    setDefault('#native_speaker', self.localized_no, '#sub_dialect', false);
    
    showDivBasedonValue('#first_language', self.localized_other, '#first_language_other_display', false);
    // true means hide if there is something in the username field
    showDivBasedonValue('#username', true, '#anonymous_instructions_display', false);
    showDivBasedonValue('#microphone', self.localized_other, '#microphone_other_display', false);
    showDivBasedonValue('#dialect', self.localized_other, '#dialect_other_display', false);
    showDivBasedonValue('#recording_location', self.localized_other, '#recording_location_other_display', false);
    showDivBasedonValue('#background_noise', self.localized_yes, '#background_noise_display', false);
    showDivBasedonValue('#noise_type', self.localized_other, '#noise_type_other_display', false);

    /**
    *
    * see: https://stackoverflow.com/questions/7694501/class-vs-static-method-in-javascript
    */

    /**
    * This function changes the contents of a dependent select list based on the
    * contents of a independent select list.  This is used to set the 
    * contents of the dependent sub-dialect selection list based on the value
    * the independent dialect selection list.
    *
    * Read.md contains the entire list of possible subdialects for a language,
    * this function filters those contents based on what is contained in dialect
    * so that user only sees filtered results
    *
    * see https://stackoverflow.com/questions/10570904/use-jquery-to-change-a-second-select-list-based-on-the-first-select-list-option
    * Store all #subdialect's options in a variable, filter them according 
    * to the value of the chosen option in #dialect, and set them using 
    * .html() in #subdialect:
    */
    // TODO when only one optgroup, first selection is not immediately selectable
    // need to select second or third option, then can select first option
    function setDependentSelect($independent, $dependent, $dependent_display) {
        var $optgroup = $dependent.find( 'optgroup' );
        var $selected = $dependent.find( ':selected' );

        $independent.on( 'change', function() {
            var filter =  $optgroup.filter( '[name="' + this.value + '"]' );

            if ( filter.length ) {
              filter = filter.add( $selected );
              $dependent_display.show();
              $dependent.html( filter );
            }
            else
            {
              $dependent_display.hide();
            }
            $dependent.val(self.default_value);                 
            $dependent.prop('defaultSelected');
       
        } ).trigger('change');
    }

    setDependentSelect( $('#dialect'), $('#sub_dialect'), $("#sub_dialect_display") );

    /**
    * fill other languages select list with stringified array the names of most 
    * ISO 639-1 language names
    */
    var langscodes = languages.getAllLanguageCode(); // array of language codes
    //var option = ''; // string
    var option = '<option value="' + self.default_value + '">'+ self.please_select + '</option>';
    for (var i=1;i<langscodes.length;i++){
       option += '<option value="'+ langscodes[i] + '">' +
       languages.getLanguageInfo(langscodes[i]).name + " (" +
       languages.getLanguageInfo(langscodes[i]).nativeName + ")" +
       '</option>';
    }
    option += '<option value="' + self.localized_other + '">' + self.localized_other + '</option>'; 
    $('#first_language').append(option);

    // Prompts

    this.maxnumpromptschanged = document.querySelector('#max_num_prompts');

    // set default (device dependent) max number of prompts the user can record 
    var option = ''; // clear previous use of option var
    if (self.prompts.max_numPrompts_selector > 10) {
        var startPrompt = 10; // min number of prompts no matter what device
        var incr = 5;
        for (var i=startPrompt; i <= self.prompts.max_numPrompts_selector; i = i + incr){
           option += '<option value="'+ i + '">' + i +  '</option>';
        }
        $('#max_num_prompts').append(option);
        $('#max_num_prompts-display').show();
    } else {
        $('#max_num_prompts-display').hide();
    }
    /**
    * updates the current number of prompts that the user selected from dropdown
    */
    //$('#max_num_prompts').click(function () { 
    $('#max_num_prompts').change(function () { 
      self.prompts.userChangedMaxNum( this.value.replace(/[^0-9\.]/g,'') );
      self.updateProgress();
    });

    this.settings.initPopup();
    this.submissionsLog.setupDisplay();

    // leave all buttons off until user accepts permission to use Microphone (getUserMedia request)
    this.setRSUButtonDisplay(false, false, false); 

    // ########################################################################

    return new Promise(function (resolve, reject) {
        var json_object = self.profile.getProfileFromBrowserStorage();
        if (json_object) {
          View.updateView(json_object,
                          self.localized_yes,
                          self.localized_other,
                          self.default_value);  
        } 

        resolve("OK");  // TODO not waiting for updateView
    }); // promise
}

/** 
* display upload to VoxForge server status to user
*
* TODO no longer used
*/
View.prototype.showUploadStatus = function (message) {
    $('#upload_status_display').show();
    $('#upload_status_display').text(message);
    $('#upload_status_display').css({ 'color': 'green', 'font-size': '50%' });
    setTimeout( function () {
      //document.querySelector('.upload_status_display').innerText = "";
      $('#upload_status_display').hide();
      return;
    }, 3000);
}

/**
* Set up toggles for profile and direction buttons
*/
View.prototype.speakerCharacteristics = function () {
    $("#speaker_characteristics_display").toggle(); 
    $("#recording_information_display").hide();
}

/**
* toggle to display profile info
*/
View.prototype.profileInfo = function () {
    $("#profile-display").toggle();
}

/**
* toggle to display recording info
*/
View.prototype.recordingInformation = function () {
    $("#recording_information_display").toggle();
    $("#speaker_characteristics_display").hide();
}

/**
* toggle to display recording info button
*/
View.prototype.recordingInformationButtonDisplay = function () {
    $('#display_record_info').trigger( "click" );
}

/**
* toggle to display directions
*/
View.prototype.directionsInfo = function () {
    $("#instructions-display").toggle(); 
}

/**
* hide profile info; otherwise recorded audio will not display properly 
* at bottom of page
*/
View.prototype.hideProfileInfo = function () {
    $("#profile-display").hide();
    $("#profile-button-display").show();
    $("#instructions-display").hide();
    $("#instructions-button-display").show();
    $('.info-display').show();

    document.querySelector('.info-display').innerText = "";
    document.querySelector('.prompt_id').innerText = "";
}

/**
* set record, stop button display
*/
View.prototype.setRSButtonDisplay = function (record, stop) {
    this.record.disabled = ! record;
    this.stop.disabled = ! stop;
}

/**
* set upload button display
*/
View.prototype.setUButtonDisplay = function (upload) {
    this.upload.disabled = ! upload;
}

/**
* set record, stop & upload button display
*/
View.prototype.setRSUButtonDisplay = function (record, stop, upload) {
    this.setRSButtonDisplay(record,stop);
    this.setUButtonDisplay(upload);
}

/**
* hide all dynamically created delete buttons
*/
View.prototype.disableDeleteButtons = function () {
    $('.delete').prop('disabled', true);
}

/**
* show all  dynamically created delete buttons
*/
View.prototype.enableDeleteButtons = function () {
    $('.delete').prop('disabled', false);
}

/**
* 
*/
View.prototype.enableVoiceActivityDetection = function () {
    $('#vad_run').prop('checked', true); 
}

   
/*
 *
 */
View.prototype.hideAudioPlayer = function () {
    //only hides the first instance of audio_player, even though it is a class
    //document.querySelector('.audio_player').controls = false;
    var object_arr = $('.audio_player');
    for (var i = 0; i < object_arr.length; i++) {
        object_arr[i].controls = false;
    }
}

/**
*
*/
View.prototype.showAudioPlayer = function () {
    //document.querySelector('.audio_player').controls = true;
    var object_arr = $('.audio_player');
    for (var i = 0; i < object_arr.length; i++) {
        object_arr[i].controls = true;
    }
}

/**

*
* can't just disable the play button on the lower audio player, need to hide
* whole thing...
*/
View.prototype.hidePlayButtons = function () {
    $('.play').hide();
}

/**
* show all  dynamically created play buttons
* TODO disable does not seem to work with WaveSurfer
*/
View.prototype.showPlayButtons = function () {
    $('.play').show();
}

/**
* hide prompt display
* TODO enable does not seem to work with WaveSurfer
*/
View.prototype.hidePromptDisplay = function () {
    $('.info-display').hide();
}



/**
* get debug value
*/
View.prototype.debugChecked = function () {
    return $('#debug').is(":checked");
}

/**
* 
*/
View.prototype.audioVisualizerChecked = function () {
    return $('#audio_visualizer').is(":checked");  
}


/**
*     // container holding visualizer, and buttons

*/
View.prototype.visualize = function (analyser) {
    var visualizer = document.querySelector('.visualizer');

    if ( this.audioVisualizerChecked() ) {
        visualize(visualizer, analyser, false);
    }
}

/**
* get recording information value
*/
View.prototype.displayRecordingInfoChecked = function () {
    return $('#display_record_info').is(":checked");
}

/**
* get recording information value
*/
View.prototype.timeSinceLastSubmissionChecked = function () {
    return $('#recording_time_reminder').is(":checked");
}


/**
* get recording Reminder value; assumption being that if they
* have not recorded in a while, then they may have changed locations...
*
* TODO use chrome geolocation api... should be ok since not saving info
* and only using to check for changes in location
*/
View.prototype.geolocationReminderChecked = function () {
    return $('#recording_geolocation_reminder').is(":checked");
}

/**
* if noise volume is low, still do VAD - user has option to disable themselves
* if noise moderateor higher, need to disable VAD, because it will not work
* 
* TODO create user override for this
*/
View.prototype.userSaysBackgroundNoise = function () {
    if (  $('#background_noise').val() === this.localized_yes ) {
      var options = document.getElementById('noise_volume').options;
      var values = [];
      var i = 0, len = options.length;

      while (i < len)
      {
        values.push(options[i++].value);
      }

      // assumes first two values are always low background noise
      if ( $('#noise_volume').val() !== values[1] &&
           $('#noise_volume').val() !== values[2] )
      {
        return true;
      }
    }
}

/**
* display prompt line
*/
View.prototype.displayPrompt = function (promptId, promptSentence) {
    document.querySelector('.prompt_id').innerText = promptId;
    document.querySelector('.info-display').innerText = promptSentence;
}

/**
* reset DOM variables for another submission
*/
View.prototype.reset = function () {
    this.audioPlayer.reset();
    this.hideProfileInfo();
    this.updateProgress();
}

/**
* update number of prompts recorded and total number of prompts to record
*/
View.prototype.updateProgress = function () {
    var progress = this.prompts.getProgressDescription();
    document.querySelector('.progress-display').innerText = progress;
}
