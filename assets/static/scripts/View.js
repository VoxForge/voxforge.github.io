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
 * Contructor
 */
function View (
    parms,
    prompts,
    profile,
    pageVariables)
{
    this.max_numPrompts_selector = parms.max_numPrompts_selector;
    this.displayWaveform = parms.displayWaveform;
    this.movePrompt2Stack = prompts.movePrompt2Stack.bind(prompts);
    this.userChangedMaxNum = prompts.userChangedMaxNum.bind(prompts);
    this.getProgressDescription = prompts.getProgressDescription.bind(prompts);
    this.json_object = profile.getProfileFromBrowserStorage();
    this.pageVariables = pageVariables;

    this._initProperties();
}

/*
 * Contructor methods
 */

View.prototype._initProperties = function() {
    this._setupButtons();

    // TODO this might work with delete if used class syntax (which should
    // pick up many elements) instead of id syntax (which only pick up one element)
    this.delete_clicked = document.querySelector('#delete_clicked'); // only picks up first instance of in=delete in DOM

    this._setupTranslations();
    this._instantiateObjectDependencies();
}

View.prototype._setupButtons = function() {
    this.record = document.querySelector('.record');
    this.stop = document.querySelector('.stop');
    this.upload = document.querySelector('.upload');

    this.playbuttontext = this.pageVariables.playbuttontext;
    this.stopbuttontext = this.pageVariables.stopbuttontext;    
}

View.prototype._setupTranslations = function() {
    this.localized_yes = this.pageVariables.localized_yes;
    this.localized_no = this.pageVariables.localized_no;
    this.localized_other = this.pageVariables.localized_other;
    this.localized_anonymous = this.pageVariables.anonymous;    
    this.please_select = this.pageVariables.please_select;
    this.default_value = this.pageVariables.default_value;
    this.alert_message = this.pageVariables.alert_message;
    this.saved_submissions = this.pageVariables.saved_submissions;
    this.uploaded_submissions = this.pageVariables.uploaded_submissions;    
}

View.prototype._instantiateObjectDependencies = function() {
    this.settings = new View.Settings();
    this.submissionsLog = new View.SubmissionsLog(
         this.saved_submissions,
         this.uploaded_submissions,
    );

    this.audioPlayer = new View.AudioPlayer(
        this.movePrompt2Stack,
        this.pageVariables,
    );
}

/*
 * Static methods
 */
View.getUserProfileInfo = function(
    localized_yes,
    localized_other,
    localized_anonymous,      
    default_value,)
{
    var profileView = new View.ProfileView(
        localized_yes,
        localized_other,
        localized_anonymous,      
        default_value,
        null, // json_object
    );    

    return profileView.getUserProfileInfo();
}

/*
 * #### static Methods #########################################################
 */

/**
* get user keyed in username
*/
View.getUserName = function() {
  return $('#username').val();
}

/**
* get user selected license
*/
View.getLicenseID = function() {
  return $("#license").val();
}

// ### METHODS #################################################################

/** 
* Initialize object
*
* see: https://stackoverflow.com/questions/7694501/class-vs-static-method-in-javascript
*/
View.prototype.init = function() {
    var self = this;
    
    this._setupDisplayDefaults();
    
    this.settings.initPopup();
    this.submissionsLog.setupDisplay();    
    this._turnAllButtonsOff();
    if ( this._runVad() ) {
        this.enableVoiceActivityDetection();
    }

    if (this.json_object) {
        this._updateProfileView();
    }
}

/**
* Set up toggles for profile and direction buttons
*/
View.prototype.speakerCharacteristics = function() {
    $("#speaker_characteristics_display").toggle(); 
    $("#recording_information_display").hide();
}

/**
* toggle to display profile info
*/
View.prototype.profileInfo = function() {
    $("#profile-display").toggle();
}

/**
* toggle to display recording info
*/
View.prototype.recordingInformation = function() {
    $("#recording_information_display").toggle();
    $("#speaker_characteristics_display").hide();
}

/**
* toggle to display recording info button
*/
View.prototype.recordingInformationButtonDisplay = function() {
    $('#display_record_info').trigger( "click" );
}

/**
* toggle to display directions
*/
View.prototype.directionsInfo = function() {
    $("#instructions-display").toggle(); 
}

/**
* hide profile info; otherwise recorded audio will not display properly 
* at bottom of page
*/
View.prototype.hideProfileInfo = function() {
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
View.prototype.setRSButtonDisplay = function(record, stop) {
    this.record.disabled = ! record;
    this.stop.disabled = ! stop;
}

/**
* set upload button display
*/
View.prototype.setUButtonDisplay = function(upload) {
    this.upload.disabled = ! upload;
}

/**
* set record, stop & upload button display
*/
View.prototype.setRSUButtonDisplay = function(record, stop, upload) {
    this.setRSButtonDisplay(record,stop);
    this.setUButtonDisplay(upload);
}

/**
* hide all dynamically created delete buttons
*/
View.prototype.disableDeleteButtons = function() {
    $('.delete').prop('disabled', true);
}

/**
* show all  dynamically created delete buttons
*/
View.prototype.enableDeleteButtons = function() {
    $('.delete').prop('disabled', false);
}

View.prototype.enableVoiceActivityDetection = function() {
    $('#vad_run').prop('checked', true); 
}
   
View.prototype.hideAudioPlayer = function() {
    //only hides the first instance of audio_player, even though it is a class
    //document.querySelector('.audio_player').controls = false;
    var object_arr = $('.audio_player');
    for (var i = 0; i < object_arr.length; i++) {
        object_arr[i].controls = false;
    }
}

View.prototype.showAudioPlayer = function() {
    //document.querySelector('.audio_player').controls = true;
    var object_arr = $('.audio_player');
    for (var i = 0; i < object_arr.length; i++) {
        object_arr[i].controls = true;
    }
}

/**
* can't just disable the play button on the lower audio player, need to hide
* whole thing...
*/
View.prototype.hidePlayButtons = function() {
    $('.play').hide();
}

/**
* show all  dynamically created play buttons
* TODO disable does not seem to work with WaveSurfer
*/
View.prototype.showPlayButtons = function() {
    $('.play').show();
}

/**
* TODO enable does not seem to work with WaveSurfer
*/
View.prototype.hidePromptDisplay = function() {
    $('.info-display').hide();
}

View.prototype.debugChecked = function() {
    return $('#debug').is(":checked");
}

View.prototype.audioVisualizerChecked = function() {
    return $('#audio_visualizer').is(":checked");  
}

/**
* container holding visualizer, and buttons
*
*
* TODO: need better waveform display so can show user in realtime if audio
* too loud or too soft or in not enough leading or trailing silence
*/
View.prototype.visualize = function(analyser) {
    var visualizer = document.querySelector('.visualizer');

    if ( this.audioVisualizerChecked() ) {
        visualize(visualizer, analyser, false);
    }
}

View.prototype.displayRecordingInfoChecked = function() {
    return $('#display_record_info').is(":checked");
}

View.prototype.timeSinceLastSubmissionChecked = function() {
    return $('#recording_time_reminder').is(":checked");
}

/**
* get recording Reminder value; assumption being that if they
* have not recorded in a while, then they may have changed locations...
*
* TODO use chrome geolocation api... should be ok since not saving info
* and only using to check for changes in location
*/
View.prototype.geolocationReminderChecked = function() {
    return $('#recording_geolocation_reminder').is(":checked");
}

/**
* if noise volume is low, still do VAD - user has option to disable themselves
* if noise moderateor higher, need to disable VAD, because it will not work
* 
* TODO create user override for this
*/
View.prototype.userSaysTooMuchBackgroundNoise = function() {
    if ( this._userHasSelectedBackgroundNoise() &&
         this._NoiseLevelTooHighForVAD() )
    {
        return true;
    }
}

View.prototype._userHasSelectedBackgroundNoise = function() {
    return (  $('#background_noise').val() === this.localized_yes );
}

// assumes first two values are always low background noise
View.prototype._NoiseLevelTooHighForVAD = function() {
    var values = this._getNoiseSelectValues();    

    return  ( $('#noise_volume').val() !== values[1] &&
              $('#noise_volume').val() !== values[2] );
}

View.prototype._getNoiseSelectValues = function() {
    var options = document.getElementById('noise_volume').options;

    var values = [];

    Object.keys(options).forEach(function(key) {
        values.push(options[key]);
    });
    
    return values;
}

/**
* display prompt line
*/
View.prototype.displayPrompt = function(promptId, promptSentence) {
    document.querySelector('.prompt_id').innerText = promptId;
    document.querySelector('.info-display').innerText = promptSentence;
}

/**
* reset DOM variables for another submission
*/
View.prototype.reset = function() {
    this.audioPlayer.reset();
    this.hideProfileInfo();
    this.updateProgress();
}

/**
* update number of prompts recorded and total number of prompts to record
*/
View.prototype.updateProgress = function() {
    document.querySelector('.progress-display').innerText =
        this.getProgressDescription();
}

/**
* Interface to AudioPLayer - hide implementation details from Controller
*/
View.prototype.display = function(obj) {
    return this.audioPlayer.display.call(this.audioPlayer, obj);
}

