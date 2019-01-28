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

function ProfileView (
    localized_yes,
    localized_other,
    localized_anonymous,    
    default_value)
{
    this.localized_yes = localized_yes;
    this.localized_other = localized_other;
    this.localized_anonymous = localized_anonymous;
    this.default_value = default_value;    
}

ProfileView.prototype.update = function(json_object)
{
    this._setSpeakerCharacteristics(json_object);
    this._setRecordingInformation(json_object);
}

ProfileView.prototype._setSpeakerCharacteristics = function(json_object)
{
    this._setUserInfo(json_object);
    this._setLanguageCharacteristics(json_object);
    this._displaySpeakerCharacteristicsIfNotAllFilled(json_object);
}

ProfileView.prototype._setUserInfo = function(json_object) {
    $('#username').val( Profile.cleanUserInputRemoveSpaces(json_object.username) );
    if (json_object.username) {
      $('#anonymous_instructions_display').hide();
    }
    $('#gender').val( json_object.gender );
    $('#gender option[text=" + json_object.gender + "]').attr('selected','selected'); 

    $('#age').val( json_object.age );
}

ProfileView.prototype._setLanguageCharacteristics = function(json_object) {
    this._setNativeSpeaker(json_object);
    this._setFirstLanguage(json_object);
    this._setDialect(json_object);
}

ProfileView.prototype._setNativeSpeaker = function(json_object) {
    $('#native_speaker').val( json_object.native_speaker );
    if ( json_object.native_speaker === this.localized_yes )
    {
      $("#dialect_display").show();
    } else {
      $("#first_language_display").show();
    }
}

ProfileView.prototype._setFirstLanguage = function(json_object) {
    $('#first_language').val( json_object.first_language );
    $('#first_language_other').val( Profile.cleanUserInput(json_object.first_language_other) );
}

ProfileView.prototype._setDialect = function(json_object) {
    $('#dialect').val( json_object.dialect );
    $('#sub_dialect').val( json_object.sub_dialect );
    if ( json_object.sub_dialect !== this.default_value ) {
      $("#sub_dialect_display").show();
    }
    $('#dialect_other').val( Profile.cleanUserInput(json_object.dialect_other) );
    if ( json_object.dialect === this.localized_other ) {
      $("#dialect_other_display").show();
    }
}

/*
 * hide filled Speaker Characteristic section
 * 
 * if user has filled in relevant profile information, no need to present
 * Speaker Characteristics section to user 
 */
ProfileView.prototype._displaySpeakerCharacteristicsIfNotAllFilled = function(json_object) {
    if ( this._speakerCharacteristicsFilled(json_object) )  {
       $("#speaker_characteristics_display").hide();
    }
}

ProfileView.prototype._speakerCharacteristicsFilled = function(json_object) {
    return ( json_object.gender !== this.default_value &&
             json_object.age  !== this.default_value &&
             json_object.native_speaker !== this.default_value &&
            (json_object.first_language !== this.default_value ||
                   json_object.dialect  !== this.default_value)
    );
}

// ###

ProfileView.prototype._setRecordingInformation = function(json_object)
{
    this._setMic(json_object);
    this._setLocation(json_object);
    this._setNoise(json_object);
    this._setLicense(json_object);    
}

ProfileView.prototype._setMic = function(json_object) {
    $('#microphone').val( json_object.microphone );
    $('#microphone_other').val( Profile.cleanUserInput(json_object.microphone_other) );
    if ( json_object.microphone === this.localized_other )
    {
      $("#microphone_other_display").show();
    }
}

ProfileView.prototype._setLocation = function(json_object) {
    $('#recording_location').val( json_object.recording_location );
    $('#recording_location_other').val( Profile.cleanUserInput(json_object.recording_location_other) );
    if ( json_object.recording_location === this.localized_other )
    {
      $("#recording_location_other_display").show();
    }
}

ProfileView.prototype._setNoise = function(json_object) {
    $('#background_noise').val( json_object.background_noise );
    if ( json_object.background_noise === this.localized_yes )
    {
      $("#background_noise_display").show();
    }
    $('#noise_volume').val( json_object.noise_volume );
    $('#noise_type').val( json_object.noise_type );
    $('#noise_type_other').val( Profile.cleanUserInput(json_object.noise_type_other) );
    if ( json_object.noise_type === this.localized_other )
    {
      $("#noise_type_other_display").show();
    }
}

ProfileView.prototype._setLicense = function(json_object) {
    $('#license').val( json_object.license );
}

/**
* get user entered DOM data
*/
ProfileView.getUserProfileInfo = function(
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
ProfileView.getLicenseID = function() {
  return $("#license").val();
}

/**
* get user keyed in username
*/
ProfileView.getUserName = function() {
  return $('#username').val();
}

