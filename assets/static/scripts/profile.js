// TODO what is sample rate when recording with Chrome
// TODO confirm Firefox does not record lossy audio then converts to wav...

function Profile () {}
var profile = new Profile();

function profileInfo() {  $("#profile-display").toggle(); }
function directionInfo() {  $("#directions-display").toggle(); }
if ( $.cookie('all_done') ) 
{
  $("#profile-display").hide();
  $("#profile-button-display").show();
}

function speakerCharacteristics() {  $("#speaker_characteristics_display").toggle(); }
/*
* see https://stackoverflow.com/questions/10570904/use-jquery-to-change-a-second-select-list-based-on-the-first-select-list-option
* Store all #subdialect's options in a variable, filter them according 
* to the value of the chosen option in #dialect, and set them using 
* .html() in #subdialect:
*/
// see https://stackoverflow.com/questions/15566999/how-to-show-form-input-fields-based-on-select-value

Profile.prototype.div_function = function (independent_div, value, dependent_div) {
  var already_executed_once = false;

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

  if ( !already_executed_once ) 
  {
    $(independent_div).change(function () { 
        profile.div_function(independent_div, value, dependent_div); 
    } );
    already_executed_once = false;
  }
}

profile.div_function('#native_speaker', "No", '#first_language_display');
profile.div_function('#native_speaker', "Yes", '#dialect_display');
profile.div_function('#username', true, '#anonymous_instructions_display');
profile.div_function('#microphone', "Other", '#microphone_other_display');
profile.div_function('#dialect', "Other", '#dialect_other_display');
function recordingInformation() {  $("#recording_information_display").toggle(); }
profile.div_function('#microphone', "Other", '#microphone_other_display');
profile.div_function('#recording_location', "Other", '#recording_location_other_display');
profile.div_function('#background_noise', "Yes", '#background_noise_display');
profile.div_function('#noise_type', "Other", '#noise_type_other_display');

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

// get cookie
if (typeof localStorage.username !== 'undefined')
{
  //Speaker Characteristics
  $('#username').val( localStorage.username );
  //$('#username').val( $.cookie('username') );
  $('#gender').val( localStorage.gender );
  $('#age').val( localStorage.age );
  $('#language').val( localStorage.language );
  $('#native_speaker').val( localStorage.native_speaker );
  if ( $('#native_speaker').val()==="Yes" )
  {
    $("#sub_dialect_display").show();
  } else {
    $("#first_language_display").show();
  }
  $('#first_language').val( localStorage.first_language );
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

// languages.getAllLanguageCode() return an array of all ISO 639-1 language code supported
var langscodes = languages.getAllLanguageCode();
var option = '';
for (var i=0;i<langscodes.length;i++){
   option += '<option value="'+ langscodes[i] + '">' +
   languages.getLanguageInfo(langscodes[i]).name + " (" +
   languages.getLanguageInfo(langscodes[i]).nativeName + ")" +  
   '</option>';
}
   option += '<option value="Other">Other</option>'; 
$('#first_language').append(option);

// #############################################################################

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
// !!!!!!
  //readme[i++] = 'Age Range: ' +  $('#age').val() + '\n';
  readme[i++] = 'Age Range: ' +  $('#age').find(':selected').attr('old_value') + '\n';
// !!!!!!
  readme[i++] = 'Language: ' +  $('#language').val() + '\n';
  readme[i++] = 'Native Speaker: ' +  $('#native_speaker').val() + '\n';
  if ($('#native_speaker').val() === "No") {
    var langId = $('#first_language').val();
    readme[i++] = '  first language: ' + languages.getLanguageInfo(langId).name + '\n';
  } else {
    if ($('#dialect').val() !== "Other") {
      readme[i++] = 'Pronunciation dialect: ' + $('#dialect').val() + '\n';
      if ( $('#sub_dialect').val() ) {
        readme[i++] = '  sub-dialect: ' + $('#sub_dialect').val() + '\n';
      }
    } else {
      readme[i++] =  'Pronunciation dialect: Other - ' + $('#dialect_other').val() + '\n';
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
  profile_hash["language"] = $("#language").val();
  profile_hash["native_speaker"] = $("#native_speaker").val();

  if ($("#native_speaker").val() === "No") {
    var langId = $("#first_language").val();
    profile_hash["first_language"] = languages.getLanguageInfo(langId).name;
  } else {
    if ($("#dialect").val() !== "Other") {
      profile_hash["pronunciation_dialect"] = $("#dialect").val();
      if ( $('#sub_dialect').val() ) {
        profile_hash["sub_dialect"] = $("#sub_dialect").val();
      }
    } else {
      profile_hash["pronunciation_dialect"] = $("#dialect_other").val() ;
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

/* 
* see: https://www.electrictoolbox.com/jquery-cookies/ 
*/
Profile.prototype.addProfile2Cookie = function () {
  //Speaker Characteristics:
  $.cookie('username', $('#username').val());
  localStorage.username = $('#username').val();

  localStorage.gender = $('#gender').val();
  localStorage.age = $('#age').val();
  localStorage.language = $('#language').val();
  localStorage.native_speaker = $('#native_speaker').val();
  if ( $('#native_speaker').val() === "Yes") 
  {
    localStorage.first_language = null;
  } else {
    localStorage.first_language = $('#first_language').val();
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
  var language = $('#language').val();
  var d = new Date();
  var date = d.getFullYear().toString() + (d.getMonth() + 1).toString() + d.getDate().toString();
  var result = language + '-' + username + '-' + date + '-' + uuidv4();

  return result;
}
