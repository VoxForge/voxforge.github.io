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

/**
* Class declaration
*/
function Profile () {}

/**
* Instantiate Profile class
*/
var profile = new Profile();

/**
* Set up toggles for profile and direction buttons
*/
function profileInfo() {  $("#profile-display").toggle(); }
function speakerCharacteristics() {  $("#speaker_characteristics_display").toggle(); }
function recordingInformation() {  $("#recording_information_display").toggle(); }
function directionsInfo() {  $("#directions-display").toggle(); }

/**
* hide buttons after user makes a submission.  No need to show user information
* he just entered, and info is still accessible with profile button
*/
if ( $.cookie('all_done') ) 
{
  $("#profile-display").hide();
  $("#profile-button-display").show();
}

/**
* These are language specific variables on the Jekyll Mardown page that
* are needed for the javascript apps
*/
var article = document.getElementById('language_specific_variables');
var dataset_yes = article.dataset.yes;
var dataset_no = article.dataset.no;
var dataset_other = article.dataset.other;
var dataset_language = article.dataset.language;
var prompt_list_contains_id = article.dataset.prompt_list_contains_id;

/**
* ### STATIC METHODS ##############################################
*
* see: https://stackoverflow.com/questions/7694501/class-vs-static-method-in-javascript
*/

/**
* showDivBasedonValue makes the view of one div dependent on the value of a select 
* field in another div, and attaches an event handler to independent div so that
* any changes in it are reflected in dependent div
*
* The value of contents of the independent_div is compared to the passed in 
* value, and if they are equal, then the dependent_div is displayed 
*
* see https://stackoverflow.com/questions/15566999/how-to-show-form-input-fields-based-on-select-value
*/
Profile.showDivBasedonValue = function (independent_div, value, dependent_div, handler_already_created) {
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
        Profile.showDivBasedonValue(independent_div, value, dependent_div, true); 
    } );
  }
}

Profile.showDivBasedonValue('#native_speaker', dataset_no, '#first_language_display', false);
Profile.showDivBasedonValue('#native_speaker', dataset_yes, '#dialect_display', false);
Profile.showDivBasedonValue('#first_language', dataset_other, '#first_language_other_display', false);
Profile.showDivBasedonValue('#username', true, '#anonymous_instructions_display', false);
Profile.showDivBasedonValue('#microphone', dataset_other, '#microphone_other_display', false);
Profile.showDivBasedonValue('#dialect', dataset_other, '#dialect_other_display', false);
Profile.showDivBasedonValue('#recording_location', dataset_other, '#recording_location_other_display', false);
Profile.showDivBasedonValue('#background_noise', dataset_yes, '#background_noise_display', false);
Profile.showDivBasedonValue('#noise_type', dataset_other, '#noise_type_other_display', false);

/**
* This function changes the contents of a second select list based on the
* contents of a first select list.  This is used to set the 
* contents of the sub-dialect selection list based on the value the dialect
* selection list.
*
* see https://stackoverflow.com/questions/10570904/use-jquery-to-change-a-second-select-list-based-on-the-first-select-list-option
* Store all #subdialect's options in a variable, filter them according 
* to the value of the chosen option in #dialect, and set them using 
* .html() in #subdialect:
*/
var $select1 = $( '#dialect' );
$( '#sub_dialect select' ).val("Unknown");
var $select2 = $( '#sub_dialect' );
$optgroup = $select2.find( 'optgroup' );
$selected = $select2.find( ':selected' );
$result = $optgroup.add( $selected );

$select1.on( 'change', function() {
    var filter =  $result.filter( '[name="' + this.value + '"]' );
    var temp = filter.val();
    if ( filter.length ) {
      $("#sub_dialect_display").show();
  	  $select2.html( filter );
    }
    else
    {
      $("#sub_dialect_display").hide();
    }
    $select2.prop('defaultSelected');
} ).trigger( 'change' );



/**
* fill other languages select list with stringified array the names of most 
* ISO 639-1 language names
*/
var langscodes = languages.getAllLanguageCode(); // array of language codes
var option = ''; // string
for (var i=0;i<langscodes.length;i++){
   option += '<option value="'+ langscodes[i] + '">' +
   languages.getLanguageInfo(langscodes[i]).name + " (" +
   languages.getLanguageInfo(langscodes[i]).nativeName + ")" +  
   '</option>';
}
option += '<option value="' + dataset_other + '">' + dataset_other + '</option>'; 
$('#first_language').append(option);

/**
* ### METHODS ##############################################
*/

/**
* Convert profile object to array
*/
Profile.prototype.createHashArray = function () {
  var profile_hash = {};
  var profile_array = [];
  var i=0;

  if ( $('#username').val() ) {
    profile_array[i++] = 'User Name: ' + $('#username').val() + '\n';
    profile_hash["username"] = $("#username").val();
  } else {
    profile_array[i++] = 'User Name: Anonymous\n';
    profile_hash["username"] = "Anonymous";
  }

  profile_array[i++] = '\nSpeaker Characteristics: \n\n';

  profile_array[i++] = 'Gender: ' +  $('#gender').val() + '\n';
  profile_hash["gender"] = $("#gender").val();

  var $old_value = $('#age').find(':selected').attr('old_value');
  if ($old_value) {
    profile_array[i++] = 'Age Range: ' +  $old_value + '\n';
  } else {
    profile_array[i++] = 'Age Range: ' +  $('#age').val() + '\n';
  }
  profile_hash["age"] = $("#age").val();

  profile_array[i++] = 'Language: ' +  dataset_language + '\n';
  profile_hash["language"] = dataset_language;

  profile_array[i++] = 'Native Speaker: ' +  $('#native_speaker').val() + '\n';
  profile_hash["native_speaker"] = $("#native_speaker").val();
  if ($('#native_speaker').val() !== "No") {
    if ($('#dialect').val() !== dataset_other) {
      profile_array[i++] = 'Pronunciation dialect: ' + $('#dialect').val() + '\n';
      profile_hash["pronunciation_dialect"] = $("#dialect").val();
      if ( $('#sub_dialect').val() ) {
        profile_array[i++] = '  sub-dialect: ' + $('#sub_dialect').val() + '\n';
        profile_hash["sub_dialect"] = $("#sub_dialect").val();
      }
    } else {
      profile_array[i++] =  'Pronunciation dialect: Other - ' + $('#dialect_other').val() + '\n';
      profile_hash["pronunciation_dialect"] = $("#dialect_other").val();
    }
  } else {
    if ( $('#first_language').val() !== dataset_other) 
    {
      var langId = $('#first_language').val();
      profile_array[i++] = '  first language: ' + languages.getLanguageInfo(langId).name + '\n';
      profile_hash["first_language"] = languages.getLanguageInfo(langId).name;
    } else {
      profile_array[i++] = '  first language: ' + $('#first_language_other').val();
      profile_hash["first_language"] = $("#first_language_other").val();
    }
  }

  profile_array[i++] = '\nRecording Information: \n\n';
  if ($('#microphone').val() !== dataset_other) {
    profile_array[i++] = 'Microphone Type: ' + $('#microphone').val() + '\n';
    profile_hash["microphone"] = $("#microphone").val() ;
  } else {
    profile_array[i++] = 'Microphone Type: Other - ' + $('#microphone_other').val() + '\n';
    profile_hash["microphone"] = $("#microphone_other").val() ;
  }

  if ($('#recording_location').val() !== dataset_other) {
    profile_array[i++] = 'Recording Location: ' + $('#recording_location').val() + '\n';
    profile_hash["recording_location"] = $("#recording_location").val() ;
  } else {
    profile_array[i++] = 'Recording Location: Other - ' + $('#recording_location_other').val() + '\n';
    profile_hash["recording_location"] = $("#recording_location_other").val() ;
  }

  profile_array[i++] = 'Background Noise: ' + $('#background_noise').val() + '\n';
  profile_hash["background_noise"] = $("#background_noise").val() ;

  if ($('#background_noise').val() === "Yes") {
    profile_array[i++] = 'Noise Volume: ' + $('#noise_volume').val() + '\n';
    profile_hash["noise_volume"] = $("#noise_volume").val() ;
    if ($('#noise_type').val() !== dataset_other) {
      profile_array[i++] = 'Noise Type: ' + $('#noise_type').val() + '\n';
      profile_hash["noise_type"] = $("#noise_type").val();
    } else {
      profile_array[i++] = 'Noise Type: Other - ' + $('#noise_type_other').val() + '\n';
      profile_hash["noise_type"] = $("#noise_type_other").val();
    }
  }

  profile_hash["Audio Recording Software:"] = 
    profile_array[i++] = 
      'Audio Recording Software: VoxForge Javascript speech submission application\n';

  profile_array[i++] = 'O/S: ' +  platform.os + '\n';
  profile_hash["os"] = platform.os.toString();

  profile_array[i++] = 'Browser: ' +  platform.name + ' ' + platform.version + '\n';
  profile_hash["browser"] = platform.version;

  profile_array[i++] = '\nLicense: ' +  $('#license').val() + '\n';
  profile_hash["license"] = $("#license").val();

  profile_array[i++] = '\nFile Info: \n\n';
  // see https://www.pmtonline.co.uk/blog/2004/11/04/what-does-the-bit-depth-and-sample-rate-refer-to/
  profile_array[i++] = 'File type: wav\n';
  profile_hash["file_type"] = "wav";

  profile_array[i++] = 'Sample Rate: ' + profile.sample_rate + '\n';
  profile_hash["sample_rate"] = profile.sample_rate;

  profile_array[i++] = 'Sample Rate Format (bit depth): ' + profile.sample_rate_format + '\n';
  profile_hash["sample_rate_format"] = profile.sample_rate_format;

  profile_array[i++] = 'Number of channels: ' + profile.channels + '\n';
  profile_hash["channels"] = profile.channels;

  return {
    array: profile_array,
    hash: profile_hash
  }
};

/**
* Convert profile object to JSON string, with line feeds after every key value line
*/
Profile.prototype.toJsonString = function () {
  var profile_data = this.createHashArray();

  return JSON.stringify(profile_data.hash ,null ,"  ");
}

/**
* Convert profile object to JSON string, with line feeds after every key value line
*/
Profile.prototype.toArray = function () {
  var profile_data = this.createHashArray();

  return profile_data.array;
}

/**
* add profile information to local storage
*/
Profile.prototype.addProfile2LocalStorage = function () {
  $.cookie('username', $('#username').val());
  localStorage.setItem(dataset_language, this.toJsonString());
};

/**
* update user screen
*/
Profile.prototype.updateScreen = function (json_object) {
  //Speaker Characteristics
  $('#username').val( json_object.username );
  if (json_object.username) {
    $('#anonymous_instructions_display').hide();
  }
  $('#gender').val( json_object.gender );
  $('#age').val( json_object.age );
  // TODO how to deal with language when user might make submissions in more than
  // one language... need to key different json_object attributes based on language
  // !!!!!!
  $('#native_speaker').val( json_object.native_speaker );
  if ( $('#native_speaker').val()==="Yes" )
  {
    $("#sub_dialect_display").show();
  } else {
    $("#first_language_display").show();
  }
  $('#first_language').val( json_object.first_language );
  $('#first_language').val( json_object.first_language_other );
  $('#dialect').val( json_object.dialect );
  $('#dialect_other').val( json_object.dialect_other );
  if ( $('#dialect').val() === dataset_other )
  {
    $("#dialect_other_display").show();
  }
  $('#sub_dialect').val( json_object.dialect_other );
  //Recording Information:
  $('#microphone').val( json_object.microphone );
  $('#microphone_other').val( json_object.microphone_other );
  if ( $('#microphone').val() === dataset_other )
  {
    $("#microphone_other_display").show();
  }

  $('#recording_location').val( json_object.recording_location );
  $('#recording_location_other').val( json_object.recording_location_other );
  if ( $('#recording_location').val() === dataset_other )
  {
    $("#recording_location_other_display").show();
  }
  $('#background_noise').val( json_object.background_noise );
  if ( $('#background_noise').val()==="Yes" )
  {
    $("#background_noise_display").show();
  }
  $('#noise_volume').val( json_object.noise_volume );
  $('#noise_type').val( json_object.noise_type );
  $('#noise_type_other').val( json_object.noise_type_other );
  if ( $('#noise_type').val() === dataset_other )
  {
    $("#noise_type_other_display").show();
  }
  $('#license').val( json_object.license );
}

/**
* get profile information from local storage
*/
Profile.prototype.getProfileFromLocalStorage = function () {
  var retrievedObject = localStorage.getItem(dataset_language);
  // boolean expression. Second part is evaluated only if left one is true. 
  return retrievedObject && JSON.parse(retrievedObject);
}

/**
* refresh displayed user information with info stored in offline storage.
* Note: not using cookies... no need to pass this info back to the server
* with each call (which is what cookies do...)
*
* assumes that if the username contains something, then it make ssense to 
* load all the remaining fields from offline storage.
*/
//if (typeof localStorage.dataset_language !== 'undefined') {
var parsedLocalStorageObject;
if (parsedLocalStorageObject = profile.getProfileFromLocalStorage()) {
  profile.updateScreen(parsedLocalStorageObject);
}


/**
* return username user entered into input field
*/
Profile.prototype.getUserName = function () {
  return $('#username').val();
}

Profile.prototype.getTempSubmissionName = function () {
  //submission_filename = language + '-' + username + '-' + date + '-' + random_chars[:3] + '[' + random_chars + '].zip';
  // see: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }

  var username = $('#username').val().replace(/[^a-z0-9_\-]/gi, '_').replace(/_{2,}/g, '_').toLowerCase();
  //var language = $('#language').val();
  var d = new Date();
  var date = d.getFullYear().toString() + (d.getMonth() + 1).toString() + d.getDate().toString();
  var result = dataset_language + '-' + username + '-' + date + '-' + uuidv4();

  return result;
}
