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
function Profile () {
  //profile.sample_rate
  //profile.sample_rate_format
  //profile.channels
}

/**
* Instantiate Profile class
*/
var profile = new Profile();

/**
* Set up toggles for profile and direction buttons
*/
function profileInfo() {  $("#profile-display").toggle(); }
function speakerCharacteristics() {  
  $("#speaker_characteristics_display").toggle(); 
  $("#recording_information_display").hide();
}
function recordingInformation() {  
  $("#recording_information_display").toggle(); 
  $("#speaker_characteristics_display").hide(); 
}
function directionsInfo() {  $("#directions-display").toggle(); }

/**
* hide buttons after user makes a submission.  No need to show user information
* he just entered, and info is still accessible with profile button
*/
// TODO does this ever get executed?
if ( $.cookie('all_done') ) 
{
  $("#profile-display").hide();
  $("#profile-button-display").show();
}

/**
* ### STATIC METHODS ##############################################
*
* see: https://stackoverflow.com/questions/7694501/class-vs-static-method-in-javascript
*/

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
Profile.showDivBasedonValue = function (independent_div, value, dependent_div, handler_already_created) {
  function test ( boolean_result ) {
    if( boolean_result ){
      $(dependent_div).show();
    } else {
      $(dependent_div).hide();
//      if (value === page_localized_other) { // trying to clear text in other field if user unselects
//         $(dependent_div).empty();
//      }
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

Profile.showDivBasedonValue('#native_speaker', page_localized_no, '#first_language_display', false);
Profile.showDivBasedonValue('#native_speaker', page_localized_yes, '#dialect_display', false);
Profile.showDivBasedonValue('#first_language', page_localized_other, '#first_language_other_display', false);
// true means hide if there is something in the username field
Profile.showDivBasedonValue('#username', true, '#anonymous_instructions_display', false); 
Profile.showDivBasedonValue('#microphone', page_localized_other, '#microphone_other_display', false);
Profile.showDivBasedonValue('#dialect', page_localized_other, '#dialect_other_display', false);
Profile.showDivBasedonValue('#recording_location', page_localized_other, '#recording_location_other_display', false);
Profile.showDivBasedonValue('#background_noise', page_localized_yes, '#background_noise_display', false);
Profile.showDivBasedonValue('#noise_type', page_localized_other, '#noise_type_other_display', false);

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
//var option = ''; // string
var option = '<option value="Unknown">'+ page_please_select + '</option>';
for (var i=1;i<langscodes.length;i++){
   option += '<option value="'+ langscodes[i] + '">' +
   languages.getLanguageInfo(langscodes[i]).name + " (" +
   languages.getLanguageInfo(langscodes[i]).nativeName + ")" +  
   '</option>';
}
option += '<option value="' + page_localized_other + '">' + page_localized_other + '</option>'; 
$('#first_language').append(option);

/**
* update user display
*/
Profile.updateScreen = function (json_object) {
  //Speaker Characteristics
  $('#username').val( Profile.cleanUserInputRemoveSpaces(json_object.username) );
  if (json_object.username) {
    $('#anonymous_instructions_display').hide();
  }
  $('#gender').val( json_object.gender );
  $('#age').val( json_object.age );

  // TODO implied by the page the user is on... 
  // $('#page_language').val( json_object.page_language );

  $('#native_speaker').val( json_object.native_speaker );
  if ( $('#native_speaker').val()==="Yes" )
  {
    $("#sub_dialect_display").show();
  } else {
    $("#first_language_display").show();
  }
  $('#first_language').val( json_object.first_language );
  $('#first_language_other').val( Profile.cleanUserInput(json_object.first_language_other) );
  $('#dialect').val( json_object.dialect );
  $('#dialect_other').val( Profile.cleanUserInput(json_object.dialect_other) );
  if ( $('#dialect').val() === page_localized_other )
  {
    $("#dialect_other_display").show();
  }
  $('#sub_dialect').val( json_object.dialect_other );
  //Recording Information:
  $('#microphone').val( json_object.microphone );
  $('#microphone_other').val( Profile.cleanUserInput(json_object.microphone_other) );
  if ( $('#microphone').val() === page_localized_other )
  {
    $("#microphone_other_display").show();
  }

  $('#recording_location').val( json_object.recording_location );
  $('#recording_location_other').val( Profile.cleanUserInput(json_object.recording_location_other) );
  if ( $('#recording_location').val() === page_localized_other )
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
  $('#noise_type_other').val( Profile.cleanUserInput(json_object.noise_type_other) );
  if ( $('#noise_type').val() === page_localized_other )
  {
    $("#noise_type_other_display").show();
  }
  $('#license').val( json_object.license );
}

/**
* get profile information from local storage and if it exists, return parsed
* JSON object, otherwise return null.
*/
Profile.getProfileFromLocalStorage = function () {
  var retrievedObject = localStorage.getItem(page_language);
  // boolean expression. Second part is evaluated only if left one is true. 
  // therefore if retrievedObject is null, that gets returned
  return retrievedObject && JSON.parse(retrievedObject);
}

/**
* refresh displayed user information with info stored in offline storage.
* Note: not using cookies... no need to pass this info back to the server
* with each call (which is what cookies do...)
*/
var parsedLocalStorageObject;
if ( parsedLocalStorageObject = Profile.getProfileFromLocalStorage() ) {
  Profile.updateScreen(parsedLocalStorageObject);
}

/**
* remove unwanted characters from user input
*
* see: https://stackoverflow.com/questions/20864893/javascript-replace-all-non-alpha-numeric-characters-new-lines-and-multiple-whi
* \W is the negation of shorthand \w for [A-Za-z0-9_] word characters (including the underscore)
* 
* $('#username').val().replace(/[^a-z0-9_\-]/gi, '_').replace(/_{2,}/g, '_').toLowerCase();
* 
* first replace convert one or more spaces to underscore
* second replace removes all non-alphanumeric characters
* third remove consecutive underscores and replace them with single underscore
* lastly, trim string to max of length 40 characters
*/
Profile.cleanUserInputRemoveSpaces = function (user_input) {
  var user_input = user_input.replace(/\s+/, '_').replace(/[^a-z0-9_\-]/gi,'').replace(/_+/g, '_');

  return user_input.substring(0, 40);
}

/**
* remove unwanted characters from user input
* 
* removes all non-alphanumeric characters
* trim string to max of length 80 characters
* 
* TODO would HTML excaping be enough? using browser's escape(str) function
* see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/escape

* https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet
*   But HTML entity encoding doesn't work if you're putting untrusted data inside 
*   a <script> tag anywhere, or an event handler attribute like onmouseover, or 
*   inside CSS, or in a URL. 
*
*/
Profile.cleanUserInput = function (user_input) {
  var user_input = user_input.replace(/[^a-z0-9_\-\s]/gi,'');
 
  return user_input.substring(0, 80);
}

/**
* ### METHODS ##############################################
*/

/**
* Convert profile form entries to hash
*/
Profile.prototype.toHash = function () {
  var profile_hash = {};
  var i=0;

  if ( $('#username').val() ) {
    profile_hash["username"] = Profile.cleanUserInputRemoveSpaces( $("#username").val() );
  } else {
    profile_hash["username"] = "Anonymous";
  }
  profile_hash["gender"] = $("#gender").val();
  profile_hash["age"] = $("#age").val();

  profile_hash["language"] = page_language;
  profile_hash["native_speaker"] = $("#native_speaker").val();
  profile_hash["first_language"] = $('#first_language').val();
  profile_hash["first_language_other"] = $("#first_language_other").val();
  profile_hash["dialect"] = $("#dialect").val();
  profile_hash["dialect_other"] = Profile.cleanUserInput( $("#dialect_other").val() );
  profile_hash["sub_dialect"] = $("#sub_dialect").val();

  profile_hash["microphone"] = $("#microphone").val() ;
  profile_hash["microphone_other"] = Profile.cleanUserInput( $("#microphone_other").val() );

  profile_hash["recording_location"] = $("#recording_location").val() ;
  profile_hash["recording_location_other"] = Profile.cleanUserInput( $("#recording_location_other").val() );

  profile_hash["background_noise"] = $("#background_noise").val() ;
  profile_hash["noise_volume"] = $("#noise_volume").val() ;
  profile_hash["noise_type"] = $("#noise_type").val();
  profile_hash["noise_type_other"] = Profile.cleanUserInput( $("#noise_type_other").val() );

  profile_hash["Audio Recording Software:"] = 'VoxForge Javascript speech submission application';

  profile_hash["os"] = platform.os.toString();
  profile_hash["browser"] = platform.version;

  profile_hash["license"] = $("#license").val();

  profile_hash["file_type"] = "wav";

  // see https://www.pmtonline.co.uk/blog/2004/11/04/what-does-the-bit-depth-and-sample-rate-refer-to/
  profile_hash["sample_rate"] = this.sample_rate;
  profile_hash["sample_rate_format"] = this.sample_rate_format;
  profile_hash["channels"] = this.channels;

  return profile_hash;
};

/**
* Convert profile object to JSON string, with line feeds after every key 
* value line
*/
Profile.prototype.toJsonString = function () {
  return JSON.stringify(this.toHash() ,null ,"  ");
}

/**
* Convert profile form entries to array
*/
Profile.prototype.toTextArray = function () {
  var profile_array = [];
  var i=0;

  if ( $('#username').val() ) {
    profile_array[i++] = 'User Name: ' + Profile.cleanUserInputRemoveSpaces( $('#username').val() ) + '\n';
  } else {
    profile_array[i++] = 'User Name: Anonymous\n';
  }

  profile_array[i++] = '\nSpeaker Characteristics: \n\n';

  profile_array[i++] = 'Gender: ' +  $('#gender').val() + '\n';

  var $old_value = $('#age').find(':selected').attr('old_value');
  if ($old_value) {
    profile_array[i++] = 'Age Range: ' +  $old_value + '\n';
  } else {
    profile_array[i++] = 'Age Range: ' +  $('#age').val() + '\n';
  }

  profile_array[i++] = 'Language: ' +  page_language + '\n';

  profile_array[i++] = 'Native Speaker: ' +  $('#native_speaker').val() + '\n';
  if ($('#native_speaker').val() !== "No") {
    if ($('#dialect').val() !== page_localized_other) {
      profile_array[i++] = 'Pronunciation dialect: ' + $('#dialect').val() + '\n';
      if ( $('#sub_dialect').val() ) {
        profile_array[i++] = '  sub-dialect: ' + $('#sub_dialect').val() + '\n';
      }
    } else {
      profile_array[i++] =  'Pronunciation dialect: Other - ' + Profile.cleanUserInput( $('#dialect_other').val() ) + '\n';
    }
  } else {
    if ( $('#first_language').val() !== page_localized_other) 
    {
      var langId = $('#first_language').val();
      profile_array[i++] = '  first language: ' + languages.getLanguageInfo(langId).name + '\n';
    } else {
      profile_array[i++] = '  first language: ' + Profile.cleanUserInput( $('#first_language_other').val() );
    }
  }

  profile_array[i++] = '\nRecording Information: \n\n';
  if ($('#microphone').val() !== page_localized_other) {
    profile_array[i++] = 'Microphone Type: ' + $('#microphone').val() + '\n';
  } else {
    profile_array[i++] = 'Microphone Type: Other - ' + Profile.cleanUserInput( $('#microphone_other').val() ) + '\n';
  }

  if ($('#recording_location').val() !== page_localized_other) {
    profile_array[i++] = 'Recording Location: ' + $('#recording_location').val() + '\n';
  } else {
    profile_array[i++] = 'Recording Location: Other - ' + Profile.cleanUserInput( $('#recording_location_other').val() ) + '\n';
  }

  profile_array[i++] = 'Background Noise: ' + $('#background_noise').val() + '\n';

  if ($('#background_noise').val() === "Yes") {
    profile_array[i++] = 'Noise Volume: ' + $('#noise_volume').val() + '\n';
    if ($('#noise_type').val() !== page_localized_other) {
      profile_array[i++] = 'Noise Type: ' + $('#noise_type').val() + '\n';
    } else {
      profile_array[i++] = 'Noise Type: Other - ' + Profile.cleanUserInput( $('#noise_type_other').val() ) + '\n';
    }
  }

  profile_array[i++] = 'Audio Recording Software: VoxForge Javascript speech submission application\n';

  profile_array[i++] = 'O/S: ' +  platform.os + '\n';
  profile_array[i++] = 'Browser: ' +  platform.name + ' ' + platform.version + '\n';
  profile_array[i++] = '\nLicense: ' +  $('#license').val() + '\n';

  profile_array[i++] = '\nFile Info: \n\n';

  profile_array[i++] = 'File type: wav\n';

  // see https://www.pmtonline.co.uk/blog/2004/11/04/what-does-the-bit-depth-and-sample-rate-refer-to/
  profile_array[i++] = 'Sample Rate: ' + this.sample_rate + '\n';
  profile_array[i++] = 'Sample Rate Format (bit depth): ' + this.sample_rate_format + '\n';
  profile_array[i++] = 'Number of channels: ' + this.channels + '\n';

  return profile_array;
};


/**
* Convert profile object to Array
*/
Profile.prototype.toArray = function () {
  return this.toTextArray();
}

/**
* add profile information to local storage
*/
Profile.prototype.addProfile2LocalStorage = function () {
  localStorage.setItem(page_language, this.toJsonString());
};

/**
* return cleaned username user entered into input field
*/
Profile.prototype.getUserName = function () {
  return Profile.cleanUserInputRemoveSpaces( $('#username').val() );
}

/**
* submission_filename = language + '-' + username + '-' + date + '-' + random_chars[:3] + '[' + random_chars + '].zip';
* see: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
*/
Profile.prototype.getTempSubmissionName = function () {
  function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }

  // TODO why did you set it to toLowercase???
  // var username = $('#username').val().replace(/[^a-z0-9_\-]/gi, '_').replace(/_{2,}/g, '_').toLowerCase();
  var username = Profile.cleanUserInputRemoveSpaces( $('#username').val() ).toLowerCase();
  var d = new Date();
  var date = d.getFullYear().toString() + (d.getMonth() + 1).toString() + d.getDate().toString();
  var result = page_language + '-' + username + '-' + date + '-' + uuidv4();

  return result;
}
