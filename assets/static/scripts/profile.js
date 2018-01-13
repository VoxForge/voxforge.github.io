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
function directionInfo() {  $("#directions-display").toggle(); }
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
var other = article.dataset.other;
var language = article.dataset.language;
var prompt_list_contains_id = article.dataset.prompt_list_contains_id;

/**
* div_function abstracts some repetitive code for making the view of one div
* dependent on the value of a select field.
*
* The value of contents of the independent_div is compared to the passed in 
* value, and if they are equal, then the dependent_div is displayed 
*
* see https://stackoverflow.com/questions/15566999/how-to-show-form-input-fields-based-on-select-value
*/
Profile.prototype.div_function = function (independent_div, value, dependent_div) {
  function test ( boolean_result ) {
    if( boolean_result ){
      $(dependent_div).show();
    } else {
      $(dependent_div).hide();
    }
  }

  var already_executed_once = false;
  if ( typeof(value) === "boolean" && value === true ) { 
    // show if false; hide if true
    test( ! $(independent_div).val() );
  } else {
    test( $(independent_div).val()===value );
  }
  // TODO !!!!!! debug this conditional to make sure it is doing what it is supposed to
  if ( !already_executed_once ) 
  {
    $(independent_div).change(function () { 
        profile.div_function(independent_div, value, dependent_div); 
    } );
    //already_executed_once = false;
    already_executed_once = true; // TODO need to test this to make sure it 
                                  // works correctly, because it has been working 
                                  // ok even though it was incorrectly set????
  }
}

/**
* the value of contents of the independent_div is compared to the passed in 
* value, and if they are equal, then the dependent_div is displayed 
*/
profile.div_function('#native_speaker', dataset_no, '#first_language_display');
profile.div_function('#native_speaker', dataset_yes, '#dialect_display');
profile.div_function('#first_language', other, '#first_language_other_display');
profile.div_function('#username', true, '#anonymous_instructions_display');
profile.div_function('#microphone', other, '#microphone_other_display');
profile.div_function('#dialect', other, '#dialect_other_display');
function recordingInformation() {  $("#recording_information_display").toggle(); }
profile.div_function('#recording_location', other, '#recording_location_other_display');
profile.div_function('#background_noise', dataset_yes, '#background_noise_display');
profile.div_function('#noise_type', other, '#noise_type_other_display');

/**
* This function changes the contents of a second select list based on the
* contents of a first select list.  This is used, for example, to set the 
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
* refresh displayed user information with info stored in offline storage.
* Note: not using cookies... no need to pass this info back to the server
* with each call (which is what cookies do...)
*
* assumes that if the username contains something, then it make ssense to 
* load all the remaining fields from offline storage.
*/
if (typeof localStorage.username !== 'undefined')
{
  //Speaker Characteristics
  $('#username').val( localStorage.username );
  //$('#username').val( $.cookie('username') );
  $('#gender').val( localStorage.gender );
  $('#age').val( localStorage.age );
  $('#native_speaker').val( localStorage.native_speaker );
  if ( $('#native_speaker').val()==="Yes" )
  {
    $("#sub_dialect_display").show();
  } else {
    $("#first_language_display").show();
  }
  $('#first_language').val( localStorage.first_language );
  $('#first_language').val( localStorage.first_language_other );
  $('#dialect').val( localStorage.dialect );
  $('#dialect_other').val( localStorage.dialect_other );
  if ( $('#dialect').val()==="Other" )
  {
    $("#dialect_other_display").show();
  }
  $('#sub_dialect').val( localStorage.dialect_other );
  //Recording Information:
  $('#microphone').val( localStorage.microphone );
  $('#microphone_other').val( localStorage.microphone_other );
  if ( $('#microphone').val()==="Other" )
  {
    $("#microphone_other_display").show();
  }

  $('#recording_location').val( localStorage.recording_location );
  $('#recording_location_other').val( localStorage.recording_location_other );
  if ( $('#recording_location').val()==="Other" )
  {
    $("#recording_location_other_display").show();
  }
  $('#background_noise').val( localStorage.background_noise );
  if ( $('#background_noise').val()==="Yes" )
  {
    $("#background_noise_display").show();
  }
  $('#noise_volume').val( localStorage.noise_volume );
  $('#noise_type').val( localStorage.noise_type );
  $('#noise_type_other').val( localStorage.noise_type_other );
  if ( $('#noise_type').val()==="Other" )
  {
    $("#noise_type_other_display").show();
  }
  $('#license').val( localStorage.license );
}

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
option += '<option value="' + other + '">' + other + '</option>'; 
$('#first_language').append(option);

/**
* ### METHODS ##############################################
*/

/**
* Convert profile object to array
*/
Profile.prototype.toArray = function () {
  var i=0;
  var readme = [];
  if ( $('#username').val() ) {
    readme[i++] = 'User Name: ' + $('#username').val() + '\n';
  } else {
    readme[i++] = 'User Name: Anonymous\n';
  }
  readme[i++] = '\nSpeaker Characteristics: \n\n';
  readme[i++] = 'Gender: ' +  $('#gender').val() + '\n';
  var $old_value = $('#age').find(':selected').attr('old_value');
  if ($old_value) {
    readme[i++] = 'Age Range: ' +  $old_value + '\n';
  } else {
    readme[i++] = 'Age Range: ' +  $('#age').val() + '\n';
  }
  readme[i++] = 'Language: ' +  language + '\n';
  readme[i++] = 'Native Speaker: ' +  $('#native_speaker').val() + '\n';
  if ($('#native_speaker').val() !== "No") {
    if ($('#dialect').val() !== "Other") {
      readme[i++] = 'Pronunciation dialect: ' + $('#dialect').val() + '\n';
      if ( $('#sub_dialect').val() ) {
        readme[i++] = '  sub-dialect: ' + $('#sub_dialect').val() + '\n';
      }
    } else {
      readme[i++] =  'Pronunciation dialect: Other - ' + $('#dialect_other').val() + '\n';
    }
  } else {
    if ( $('#first_language').val() !== "Other") 
    {
      var langId = $('#first_language').val();
      readme[i++] = '  first language: ' + languages.getLanguageInfo(langId).name + '\n';
    } else {
      readme[i++] = '  first language: ' + $('#first_language_other').val();
    }
  }

  readme[i++] = '\nRecording Information: \n\n';
  if ($('#microphone').val() !== "Other") {
    readme[i++] = 'Microphone Type: ' + $('#microphone').val() + '\n';
  } else {
    readme[i++] = 'Microphone Type: Other - ' + $('#microphone_other').val() + '\n';
  }
  if ($('#recording_location').val() !== "Other") {
    readme[i++] = 'Recording Location: ' + $('#recording_location').val() + '\n';
  } else {
    readme[i++] = 'Recording Location: Other - ' + $('#recording_location_other').val() + '\n';
  }
  readme[i++] = 'Background Noise: ' + $('#background_noise').val() + '\n';
  if ($('#background_noise').val() === "Yes") {
    readme[i++] = 'Noise Volume: ' + $('#noise_volume').val() + '\n';
    if ($('#noise_type').val() !== "Other") {
      readme[i++] = 'Noise Type: ' + $('#noise_type').val() + '\n';
    } else {
      readme[i++] = 'Noise Type: Other - ' + $('#noise_type_other').val() + '\n';
    }
  }
  readme[i++] = 'Audio Recording Software: VoxForge Javascript speech submission application\n';

  readme[i++] = 'O/S: : ' +  platform.os + '\n';
  readme[i++] = 'Browser: ' +  platform.name + ' ' + platform.version + '\n';

  readme[i++] = '\nLicense: ' +  $('#license').val() + '\n';

  readme[i++] = '\nFile Info: \n\n';
  // see https://www.pmtonline.co.uk/blog/2004/11/04/what-does-the-bit-depth-and-sample-rate-refer-to/
  readme[i++] = 'File type: wav\n';
  readme[i++] = 'Sample Rate: ' + profile.sample_rate + '\n';
  readme[i++] = 'Sample Rate Format (bit depth): ' + profile.sample_rate_format + '\n';
  readme[i++] = 'Number of channels: ' + profile.channels + '\n';

  return readme;
};

/**
* Convert profile object to JSON string
*/
Profile.prototype.toJsonString = function () {
  var profile_hash = {};
  if ( $("#username").val() ) {
    profile_hash["username"] = $("#username").val();
  } else {
    profile_hash["username"] = "Anonymous";
  }
  // Speaker Characteristics: 
  profile_hash["gender"] = $("#gender").val();
  profile_hash["age"] = $("#age").val();
  profile_hash["language"] = language;
  profile_hash["native_speaker"] = $("#native_speaker").val();

  if ($("#native_speaker").val() !== "No") {
    if ($("#dialect").val() !== "Other") {
      profile_hash["pronunciation_dialect"] = $("#dialect").val();
      if ( $('#sub_dialect').val() ) {
        profile_hash["sub_dialect"] = $("#sub_dialect").val();
      }
    } else {
      profile_hash["pronunciation_dialect"] = $("#dialect_other").val() ;
    }
  } else {
    if ( $('#first_language').val() !== "Other") 
    {
      var langId = $("#first_language").val();
      profile_hash["first_language"] = languages.getLanguageInfo(langId).name;
    } else {
      profile_hash["first_language"] = $("#first_language_other").val();
    }
  }

  // Recording Information: 
  if ($("#microphone").val() !== "Other") {
    profile_hash["microphone"] = $("#microphone").val() ;
  } else {
    profile_hash["microphone"] = $("#microphone_other").val() ;
  }
  if ($("#recording_location").val() !== "Other") {
    profile_hash["recording_location"] = $("#recording_location").val() ;
  } else {
    profile_hash["recording_location"] = $("#recording_location_other").val() ;
  }
  profile_hash["background_noise"] = $("#background_noise").val() ;
  if ($("#background_noise").val() === "Yes") {
    profile_hash["noise_volume"] = $("#noise_volume").val() ;
    if ($("#noise_type").val() !== "Other") {
      profile_hash["noise_type"] = $("#noise_type").val() ;
    } else {
      profile_hash["noise_type"] = $("#noise_type_other").val() ;
    }
  }
  profile_hash["os: platform.os"] ;
  profile_hash["browser: platform.version"] ;

  profile_hash["license"] = $("#license").val();
  // File Info:
  profile_hash["file_type"] = "wav";
  profile_hash["sample_rate"] = profile.sample_rate ;
  profile_hash["sample_rate_format"] = profile.sample_rate_format;
  profile_hash["channels"] = profile.channels;

  return JSON.stringify(profile_hash,null,"  ");
};

/**
* add profile information to local storage
*
* see: https://www.electrictoolbox.com/jquery-cookies/ 
*/
Profile.prototype.addProfile2LocalStorage = function () {
  //Speaker Characteristics:
  $.cookie('username', $('#username').val());
  localStorage.username = $('#username').val();

  localStorage.gender = $('#gender').val();
  localStorage.age = $('#age').val();
  //localStorage.language = $('#language').val();
  localStorage.language = language;
  localStorage.native_speaker = $('#native_speaker').val();
  if ( $('#native_speaker').val() === "Yes") 
  {
    localStorage.first_language = null;
  } else {
    if ( $('#first_language').val() !== "Other") 
    {
      localStorage.first_language_other = $('#first_language').val();
    } else {
      localStorage.first_language_other = $('#first_language_other').val();
    }
  }
  localStorage.dialect = $('#dialect').val();
  localStorage.dialect_other = $('#dialect_other').val();
  localStorage.sub_dialect = $('#sub_dialect').val();
  // Recording Information:
  localStorage.microphone = $('#microphone').val();
  if ( $('#microphone').val() !== "Other") 
  {
    localStorage.microphone_other = null;
  } else {
    localStorage.microphone_other = $('#microphone_other').val();
  }
  localStorage.recording_location = $('#recording_location').val();
  if ( $('#recording_location').val() !== "Other") 
  {
    localStorage.recording_location_other = null;
  } else {
    localStorage.recording_location_other = $('#recording_location_other').val();
  }
  localStorage.background_noise = $('#background_noise').val();
  if ( $('#background_noise').val() === "Yes") 
  {
    localStorage.noise_volume = $('#noise_volume').val();
    localStorage.noise_type = $('#noise_type').val();
    if ( $('#recording_location').val() !== "Other") 
    {
      localStorage.noise_type_other = null;
    } else {
      localStorage.noise_type_other = $('#noise_type_other').val();
    }
  } else {
    localStorage.noise_volume = null;
    localStorage.noise_type = null;
    localStorage.noise_type_other = null;
  }
  localStorage.license = $('#license').val();
};

/**
* add profile information to local storage
*
* see: https://www.electrictoolbox.com/jquery-cookies/ 
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
  var result = language + '-' + username + '-' + date + '-' + uuidv4();

  return result;
}
