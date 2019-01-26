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

// ### static methods ##########################################################

/**
* update user display from passed json object

Note: need to make sure this is not delayed in execution, otherwise,
the app page will display, and the selects will be set in DOM properties,
but will be too late for it to display to the user correctly... so user will
see "Please Select" after a page refresh, even though the select will have
properties showing that a certain element was selected...
*/
View.updateView = function(
    json_object,
    localized_yes,
    localized_other,
    default_value)
{
    View._displaySpeakerCharacteristics(
        json_object,
        localized_yes,
        localized_other,
        default_value);
    View._displayRecordingInformation(
        json_object,
        localized_yes,
        localized_other);    
}

View._displaySpeakerCharacteristics = function(
    json_object,
    localized_yes,
    localized_other,
    default_value)    
{
    $('#username').val( Profile.cleanUserInputRemoveSpaces(json_object.username) );
    if (json_object.username) {
      $('#anonymous_instructions_display').hide();
    }
    $('#gender').val( json_object.gender );
    $('#gender option[text=" + json_object.gender + "]').attr('selected','selected'); 

    $('#age').val( json_object.age );

    $('#native_speaker').val( json_object.native_speaker );
    if ( json_object.native_speaker === localized_yes )
    {
      $("#dialect_display").show();
    } else {
      $("#first_language_display").show();
    }
    $('#first_language').val( json_object.first_language );
    $('#first_language_other').val( Profile.cleanUserInput(json_object.first_language_other) );

    $('#dialect').val( json_object.dialect );
    $('#sub_dialect').val( json_object.sub_dialect );
    if ( json_object.sub_dialect !== default_value ) {
      $("#sub_dialect_display").show();
    }
    $('#dialect_other').val( Profile.cleanUserInput(json_object.dialect_other) );
    if ( json_object.dialect === localized_other ) {
      $("#dialect_other_display").show();
    }

    // if user has filled in relevant profile information, no need to present
    // Speaker Characteristics section to user
    if ( json_object.gender !== default_value &&
        json_object.age  !== default_value &&
        json_object.native_speaker !== default_value &&
        (json_object.first_language !== default_value ||
               json_object.dialect  !== default_value)
      )
    {
       $("#speaker_characteristics_display").hide();
    }
}

View._displayRecordingInformation = function(
    json_object,
    localized_yes,
    localized_other)
{
    $('#microphone').val( json_object.microphone );
    $('#microphone_other').val( Profile.cleanUserInput(json_object.microphone_other) );
    if ( json_object.microphone === localized_other )
    {
      $("#microphone_other_display").show();
    }

    $('#recording_location').val( json_object.recording_location );
    $('#recording_location_other').val( Profile.cleanUserInput(json_object.recording_location_other) );
    if ( json_object.recording_location === localized_other )
    {
      $("#recording_location_other_display").show();
    }
    $('#background_noise').val( json_object.background_noise );
    if ( json_object.background_noise === localized_yes )
    {
      $("#background_noise_display").show();
    }
    $('#noise_volume').val( json_object.noise_volume );
    $('#noise_type').val( json_object.noise_type );
    $('#noise_type_other').val( Profile.cleanUserInput(json_object.noise_type_other) );
    if ( json_object.noise_type === localized_other )
    {
      $("#noise_type_other_display").show();
    }
    $('#license').val( json_object.license );
}

/**
* get user entered DOM data
*/
View.getUserProfileInfo = function(
    localized_yes,
    localized_other,
    localized_anonymous,
    default_value)
{
    var profile_hash = {};

    // note, this leaves the contents of Form unchanged, only when user 
    // comes back does content of Other form field get removed
    if ( $('#username').val() ) {
      profile_hash["username"] = Profile.cleanUserInputRemoveSpaces( $("#username").val() );
    } else {
      profile_hash["username"] = localized_anonymous || "anonymous";
    }
    profile_hash["gender"] = $("#gender").val();
    profile_hash["age"] = $("#age").val();
    profile_hash["age_old_value"] = $('#age').find(':selected').attr('old_value');

    profile_hash["native_speaker"] = $("#native_speaker").val();

    profile_hash["first_language"] = $('#first_language').val();
    if ($('#first_language').val() !== localized_other) {
        profile_hash["first_language_other"] = "";
    } else {
        profile_hash["first_language_other"] = Profile.cleanUserInput( $("#first_language_other").val() );
    }

    profile_hash["dialect"] = $("#dialect").val();
    if ($('#dialect').val() !== localized_other) {
        profile_hash["dialect_other"] = "";
    } else {
        profile_hash["dialect_other"] = Profile.cleanUserInput( $("#dialect_other").val() );
    }

    profile_hash["sub_dialect"] = $("#sub_dialect").val();

    profile_hash["microphone"] = $("#microphone").val() ;
    if ($('#microphone').val() !== localized_other) {
        profile_hash["microphone_other"] = "";
    } else {
        profile_hash["microphone_other"] = Profile.cleanUserInput( $("#microphone_other").val() );
    }

    profile_hash["recording_location"] = $("#recording_location").val();
    if ($('#recording_location').val() !== localized_other) {
        profile_hash["recording_location_other"] = "";
    } else {
        profile_hash["recording_location_other"] = Profile.cleanUserInput( $("#recording_location_other").val() );
    }

    profile_hash["background_noise"] = $("#background_noise").val() ;
    if (profile_hash["background_noise"] === localized_yes) {    
        profile_hash["noise_volume"] = $("#noise_volume").val();

        profile_hash["noise_type"] = $("#noise_type").val();
        if ($('#noise_type').val() !== localized_other) {
            profile_hash["noise_type_other"] = "";
        } else {
            profile_hash["noise_type_other"] = Profile.cleanUserInput( $("#noise_type_other").val() );
        }
    } else {
        profile_hash["noise_volume"] = default_value;
        profile_hash["noise_type"] = default_value;
        profile_hash["noise_type_other"] = "";
    }
    // see http://www.whatsmyua.info/
    // https://developers.whatismybrowser.com/useragents/parse/?analyse-my-user-agent=yes
    if ( $('#ua_string').is(":checked") ) {
      profile_hash["user_agent_string"] = platform.ua;
      // attempts to parse the ua string; use empty string if cannot parse
      profile_hash["os_family"] = platform.os.family || '';
      profile_hash["os_version"] = platform.os.version || '';
      profile_hash["browser_name"] = platform.name || '';
      profile_hash["browser_version"] = platform.version || '';
      profile_hash["product"] = platform.product || '';
      profile_hash["manufacturer"] = platform.manufacturer || '';
    } else {
      profile_hash["user_agent_string"] = '';
      profile_hash["os_family"] = '';
      profile_hash["os_version"] = '';
      profile_hash["browser_name"] = '';
      profile_hash["browser_version"] = '';
      profile_hash["product"] = '';
      profile_hash["manufacturer"] = '';
    }

    profile_hash["license"] = $("#license").val();

    return profile_hash;
}

/**
* get user selected license
*/
View.getLicenseID = function() {
  return $("#license").val();
}

/**
* get user keyed in username
*/
View.getUserName = function() {
  return $('#username').val();
}

