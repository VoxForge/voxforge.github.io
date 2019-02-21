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
 * Contructor Methods
 */

View.prototype._initProperties = function () {
    this._setupButtons();

    // TODO this might work with delete if used class syntax (which should
    // pick up many elements) instead of id syntax (which only pick up one element)
    this.delete_clicked = document.querySelector('#delete_clicked'); // only picks up first instance of in=delete in DOM

    this._setupTranslations();
    this._instantiateObjectDependencies();
}

View.prototype._setupButtons = function () {
    this.record = document.querySelector('.record');
    this.stop = document.querySelector('.stop');
    this.upload = document.querySelector('.upload');

    this.playbuttontext = this.pageVariables.playbuttontext;
    this.stopbuttontext = this.pageVariables.stopbuttontext;    
}

View.prototype._setupTranslations = function () {
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

View.prototype._instantiateObjectDependencies = function () {
    this.settings = new Settings();
    this.submissionsLog = new SubmissionsLog(
         this.saved_submissions,
         this.uploaded_submissions,
    );

    this.audioPlayer = new AudioPlayer(
        this.movePrompt2Stack,
        this.pageVariables,
    );
}

/*
 * Static methods
 */
View.getUserProfileInfo = function (
    localized_yes,
    localized_other,
    localized_anonymous,      
    default_value,)
{
    var profileView = new ProfileView(
        localized_yes,
        localized_other,
        localized_anonymous,      
        default_value,
        null, // json_object
    );    

    return profileView.getUserProfileInfo();
}

View.getLicenseID = ProfileView.getLicenseID;
View.getUserName = ProfileView.getUserName;

// ### METHODS #################################################################

/** 
* Initialize object with async operations (returns a promise)
*
* see: https://stackoverflow.com/questions/7694501/class-vs-static-method-in-javascript
*/
View.prototype.init = function () {
    var self = this;
    this._setupDisplayDefaults();
    this._turnAllButtonsOff();
    if ( this._runVad() ) {
        this.enableVoiceActivityDetection();
    }

    if (this.json_object) {
        this._updateProfileView();
    }
}

View.prototype._runVad = function () {
    return localStorage.getItem("vad_run") === 'true';
}

View.prototype._turnAllButtonsOff = function () {
    this.setRSUButtonDisplay(false, false, false); 
}

View.prototype._updateProfileView = function () {
    var profileView = new ProfileView(
        this.localized_yes,
        this.localized_other,
        this.localized_anonymous,      
        this.default_value,
        this.json_object,                
    );               
    profileView.update();
}

View.prototype._setupDisplayDefaults = function () {
    this._setupUsername();
    this._setUpSpeakerCharacteristics();    
    this._setUpRecordingInformation();   

    this._setupPrompts();

    this.settings.initPopup();
    this.submissionsLog.setupDisplay();
}

View.prototype._setupUsername = function () {
    // true means hide if there is something in the username field
    //this._showDivBasedonValue(
    //    '#username',
    //    true,
    //    '#anonymous_instructions_display',
    //false);
    // hide username instructions if there is something in the username field
    var divBasedonValue = new DivBasedonValue(
        '#username',
        '#anonymous_instructions_display',        
        true);
    divBasedonValue.setup();
}

View.prototype._setUpSpeakerCharacteristics = function () {
    this._setUpNativeSpeakerDependencies();
    this._setUpFirstLanguageDependencies();
    this._setUpDialectDependencies();    
    this._setupSubDialectDependencies();
    
    this._setupLanguageLookup();    
}

/*
 *  Aside: this causes sub-dialect to display immediately rather than when Canadian or
    American dialect selected:
    showDivBasedonValue('#native_speaker', this.localized_yes, '#sub_dialect_display', false);
 */
View.prototype._setUpNativeSpeakerDependencies = function () {
    this._showDivBasedonValue(
        '#native_speaker',
        this.localized_no,
        '#first_language_display',
        false);
    this._showDivBasedonValue(
        '#native_speaker',
        this.localized_yes,
        '#dialect_display',
        false);
    this._setDefault(
        '#native_speaker',
        this.localized_yes,
        '#first_language',
        false);
    this._setDefault(
        '#native_speaker',
        this.localized_no,
        '#dialect',
        false);
    this._setDefault(
        '#native_speaker',
        this.localized_no,
        '#sub_dialect',
        false);
}

View.prototype._setUpFirstLanguageDependencies = function () {
    this._showDivBasedonValue(
        '#first_language',
        this.localized_other,
        '#first_language_other_display',
        false);
}

View.prototype._setUpDialectDependencies = function () {
    this._showDivBasedonValue(
        '#dialect',
        this.localized_other,
        '#dialect_other_display',
        false);
}

View.prototype._setupSubDialectDependencies = function () {
    var dependentSelect = new DependentSelect(
        $('#dialect'),
        $('#sub_dialect'),
        $("#sub_dialect_display") );
    dependentSelect.setup()        
}

View.prototype._setUpRecordingInformation = function () {
    this._setupMicrophoneDependencies();
    this._setupRecordingLocationDependencies();
    this._setupBackgroundNoiseDependencies();
    this._setupNoiseTypeDependencies();
}

View.prototype._setupMicrophoneDependencies = function () {
    this._showDivBasedonValue(
        '#microphone',
        this.localized_other,
        '#microphone_other_display',
        false);
}

View.prototype._setupRecordingLocationDependencies = function () {
    this._showDivBasedonValue(
        '#recording_location',
        this.localized_other,
        '#recording_location_other_display',
        false);
}

View.prototype._setupBackgroundNoiseDependencies = function () {
    this._showDivBasedonValue(
        '#background_noise',
        this.localized_yes,
        '#background_noise_display',
        false);
}

View.prototype._setupNoiseTypeDependencies = function () {
    this._showDivBasedonValue(
        '#noise_type',
        this.localized_other,
        '#noise_type_other_display',
        false);
}

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
View.prototype._showDivBasedonValue = function (
    independent_div,
    value,
    dependent_div,
    handler_already_created)
{
    var self = this;
    
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
    if ( ! handler_already_created )  {
        $(independent_div).change(function () { // creates an event handler
            self._showDivBasedonValue(
                independent_div,
                value,
                dependent_div,
                true); 
        } );
    }
}

function DivBasedonValue(
    independent_div,
    dependent_div,    
    value)
{
    this.independent_div = independent_div;
    this.dependent_div = dependent_div;    
    this.value = value;
    
    this.handler_already_created = false;
}

DivBasedonValue.prototype.setup = function () {
    var self = this;
            
    if ( this._valueIsTrue() ) { 
        this.showBasedOnContentsOfIndependentDiv(
            ! $(this.independent_div).val() );
    } else {
        this.showBasedOnContentsOfIndependentDiv(
            $(this.independent_div).val() === this.value );
    }

    // only need to create event handler on first call to this function
    if ( ! this.handler_already_created )  {
        this.handler_already_created = true;
      
        $(this.independent_div).change(
            self.setup.bind(self));
    }
}

DivBasedonValue.prototype._valueIsTrue = function () {
    return typeof(this.value) === "boolean" && this.value === true;
}

// show if false; hide if true
DivBasedonValue.prototype.showBasedOnContentsOfIndependentDiv = function (boolean_result) {
    if( boolean_result ){
        $(this.dependent_div).show();
    } else {
        $(this.dependent_div).hide();
    }
}

/*
 * compare value of independent div with passed in value and if equal, reset
 * selection option to default in dependent div
 */
View.prototype._setDefault = function (
    independent_div,
    value,
    dependent_div,
    handler_already_created)
{
    var self = this;
    
    if ( $(independent_div).val() === value ) {
       $(dependent_div).val($("select option:first").val()).change();
    }
    // only need to create event handler on first call to this function
    if ( ! handler_already_created ) {
        $(independent_div).change(function () { // creates an event handler
            self._setDefault(independent_div, value, dependent_div, true); 
        } );
    }       
}



/**
* fill other languages select list with stringified array the names of most 
* ISO 639-1 language names
*/
View.prototype._setupLanguageLookup = function () {
    var langscodes = languages.getAllLanguageCode(); // array of language codes
    var option = '<option value="' + this.default_value + '">'+ this.please_select + '</option>';
    for (var i=1;i<langscodes.length;i++){
       option += '<option value="'+ langscodes[i] + '">' +
       languages.getLanguageInfo(langscodes[i]).name + " (" +
       languages.getLanguageInfo(langscodes[i]).nativeName + ")" +
       '</option>';
    }
    option += '<option value="' + this.localized_other + '">' + this.localized_other + '</option>'; 
    $('#first_language').append(option);
}

View.prototype._setupPrompts = function () {
    var self = this;
    
    this.maxnumpromptschanged = document.querySelector('#max_num_prompts');

    if (this.max_numPrompts_selector > 10) {
        this._displayPrompts();
    } else {
        $('#max_num_prompts-display').hide();
    }
    /**
    * updates the current number of prompts that the user selected from dropdown
    */
    //$('#max_num_prompts').click(function () { 
    $('#max_num_prompts').change(function () { 
      self.userChangedMaxNum( this.value.replace(/[^0-9\.]/g,'') );
      self.updateProgress();
    });
}

/**
* set default (device dependent) max number of prompts the user can record 
*/
View.prototype._displayPrompts = function () {
    var startPrompt = 10; // min number of prompts no matter what device
    var incr = 5;
    var option = ''; // clear previous use of option var    
    for (var i=startPrompt; i <= this.max_numPrompts_selector; i = i + incr){
       option += '<option value="'+ i + '">' + i +  '</option>';
    }
    $('#max_num_prompts').append(option);
    $('#max_num_prompts-display').show();
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

View.prototype.enableVoiceActivityDetection = function () {
    $('#vad_run').prop('checked', true); 
}
   
View.prototype.hideAudioPlayer = function () {
    //only hides the first instance of audio_player, even though it is a class
    //document.querySelector('.audio_player').controls = false;
    var object_arr = $('.audio_player');
    for (var i = 0; i < object_arr.length; i++) {
        object_arr[i].controls = false;
    }
}

View.prototype.showAudioPlayer = function () {
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
* TODO enable does not seem to work with WaveSurfer
*/
View.prototype.hidePromptDisplay = function () {
    $('.info-display').hide();
}

View.prototype.debugChecked = function () {
    return $('#debug').is(":checked");
}

View.prototype.audioVisualizerChecked = function () {
    return $('#audio_visualizer').is(":checked");  
}

/**
* container holding visualizer, and buttons
*/
View.prototype.visualize = function (analyser) {
    var visualizer = document.querySelector('.visualizer');

    if ( this.audioVisualizerChecked() ) {
        visualize(visualizer, analyser, false);
    }
}

View.prototype.displayRecordingInfoChecked = function () {
    return $('#display_record_info').is(":checked");
}

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
View.prototype.userSaysTooMuchBackgroundNoise = function () {
    if ( this._userHasSelectedBackgroundNoise() &&
         this._NoiseLevelTooHighForVAD() )
    {
        return true;
    }
}

View.prototype._userHasSelectedBackgroundNoise = function () {
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
    document.querySelector('.progress-display').innerText =
        this.getProgressDescription();
}

/**
* Interface to AudioPLayer - hide implementation details from Controller
*/
View.prototype.display = function (obj) {
    return this.audioPlayer.display.call(this.audioPlayer, obj);
}

// #############################################################################

/*
 * Contructor
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
function DependentSelect(
    $independent,
    $dependent,
    $dependent_display)
{
    this.$independent = $independent;
    this.$dependent = $dependent;
    this.$dependent_display = $dependent_display;
    
    this.$optgroup = $dependent.find( 'optgroup' );
    this.$selected = $dependent.find( ':selected' );
}

/*
 * Methods
 */
 
DependentSelect.prototype.setup = function () {
    var self = this;
        
    this.$independent.on( 'change', function() {
        self._filterOnDialectToFindSubdialect.call(self, this.value);
    })
    .trigger('change');
}

DependentSelect.prototype._filterOnDialectToFindSubdialect = function (value) {
    var filter =  this.$optgroup.filter( '[name="' + value + '"]' );

    if ( filter.length ) {
      filter = filter.add( this.$selected );
      this.$dependent_display.show();
      this.$dependent.html( filter );
    } else {
      this.$dependent_display.hide();
    }
    
    this.$dependent.val(self.default_value);                 
    this.$dependent.prop('defaultSelected');
}
