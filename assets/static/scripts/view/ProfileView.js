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

/*
 * Constructor
 */
function ProfileView (
    localized_yes,
    localized_other,
    localized_anonymous,    
    default_value,
    json_object)
{
    this.localized_yes = localized_yes;
    this.localized_other = localized_other;
    this.localized_anonymous = localized_anonymous;
    this.default_value = default_value;
    this.json_object = json_object;      
}

/*
 * #### static Methods #########################################################
 */

/**
* get user keyed in username
*/
ProfileView.getUserName = function() {
  return $('#username').val();
}

/**
* get user selected license
*/
ProfileView.getLicenseID = function() {
  return $("#license").val();
}

/*
 *  * #### Methods #############################################################
 */

/*
 * Update DOM with saved profile data in json_object
 */
ProfileView.prototype.update = function()
{
    this._setSpeakerCharacteristics();
    this._setRecordingInformation();
}

ProfileView.prototype._setSpeakerCharacteristics = function()
{
    this._setUserInfo();
    this._setLanguageCharacteristics();
    this._displaySpeakerCharacteristicsIfNotAllFilled();
}

ProfileView.prototype._setUserInfo = function() {
    $('#username').val(
        Profile.cleanUserInputRemoveSpaces(this.json_object.username) );
    if (this.json_object.username) {
      $('#anonymous_instructions_display').hide();
    }
    $('#gender').val( this.json_object.gender );
    $('#gender option[text=" + this.json_object.gender + "]').attr('selected','selected'); 

    $('#age').val( this.json_object.age );
}

ProfileView.prototype._setLanguageCharacteristics = function() {
    this._setNativeSpeaker();
    this._setFirstLanguage();
    this._setDialect();
}

ProfileView.prototype._setNativeSpeaker = function() {
    $('#native_speaker').val( this.json_object.native_speaker );
    if ( this._isNativeSpeaker() ) {
        $("#dialect_display").show();
    } else {
        $("#first_language_display").show();
    }
}

ProfileView.prototype._isNativeSpeaker = function() {
    return (this.json_object.native_speaker === this.localized_yes);
}

ProfileView.prototype._setFirstLanguage = function() {
    $('#first_language').val( this.json_object.first_language );
    $('#first_language_other').val(
        Profile.cleanUserInput(this.json_object.first_language_other) );
}

ProfileView.prototype._setDialect = function() {
    $('#dialect').val( this.json_object.dialect );
    $('#sub_dialect').val( this.json_object.sub_dialect );
    if ( this._subdialectSelected() ) {
        $("#sub_dialect_display").show();
    }
    $('#dialect_other').val( Profile.cleanUserInput(this.json_object.dialect_other) );
    if ( this._otherDialectSelected() ) {
        $("#dialect_other_display").show();
    }
}

ProfileView.prototype._subdialectSelected = function() {
    return ( this.json_object.sub_dialect !== this.default_value );
}

ProfileView.prototype._otherDialectSelected = function() {
    return ( this.json_object.dialect === this.localized_other ) ;
}

/*
 * hide filled Speaker Characteristic section
 * 
 * (if user has filled in relevant profile information, no need to present
 * Speaker Characteristics section to user)
 */
ProfileView.prototype._displaySpeakerCharacteristicsIfNotAllFilled = function() {
    if ( this._speakerCharacteristicsFilled() )  {
       $("#speaker_characteristics_display").hide();
    }
}

ProfileView.prototype._speakerCharacteristicsFilled = function() {
    return ( this.json_object.gender !== this.default_value &&
             this.json_object.age  !== this.default_value &&
             this.json_object.native_speaker !== this.default_value &&
            (this.json_object.first_language !== this.default_value ||
                   this.json_object.dialect  !== this.default_value)
    );
}

// ###

ProfileView.prototype._setRecordingInformation = function()
{
    this._setMic();
    this._setLocation();
    this._setNoise();
    this._setLicense();    
}

ProfileView.prototype._setMic = function() {
    $('#microphone').val( this.json_object.microphone );
    $('#microphone_other').val(
        Profile.cleanUserInput(this.json_object.microphone_other) );
    if ( this._otherMicrophone() ) {
        $("#microphone_other_display").show();
    }
}

ProfileView.prototype._otherMicrophone = function() {
    return ( this.json_object.microphone === this.localized_other );
}

ProfileView.prototype._setLocation = function() {
    $('#recording_location').val( this.json_object.recording_location );
    $('#recording_location_other').val(
        Profile.cleanUserInput( this.json_object.recording_location_other) );
    if ( this._otherRecordingLocation() ) {
        $("#recording_location_other_display").show();
    }
}

ProfileView.prototype._otherRecordingLocation = function() {
    return ( this.json_object.recording_location === this.localized_other );
}

ProfileView.prototype._setNoise = function() {
    $('#background_noise').val( this.json_object.background_noise );
    if ( this._backgroudNoise() ) {
      $("#background_noise_display").show();
    }
    $('#noise_volume').val( this.json_object.noise_volume );
    $('#noise_type').val( this.json_object.noise_type );
    $('#noise_type_other').val(
        Profile.cleanUserInput( this.json_object.noise_type_other ) );
    if ( this._otherNoiseType() ) {
      $("#noise_type_other_display").show();
    }
}

ProfileView.prototype._backgroudNoise = function() {
    return ( this.json_object.background_noise === this.localized_yes );
}

ProfileView.prototype._otherNoiseType= function() {
    return ( this.json_object.noise_type === this.localized_other );
}

ProfileView.prototype._setLicense = function() {
    $('#license').val( this.json_object.license );
}

/*
 * #############################################################################
 */
/**
* get user entered DOM data
*/
ProfileView.prototype.getUserProfileInfo = function() {
    this.profile_hash = {};

    this._getSpeakerCharacteristics();
    this._getRecordingInformation();   

    return this.profile_hash;
}

ProfileView.prototype._getSpeakerCharacteristics = function() {
    this._getUserInfo();   
    this._getLanguageCharacteristics();
}

ProfileView.prototype._getUserInfo = function() {
    if ( $('#username').val() ) {
        this.profile_hash["username"] =
            Profile.cleanUserInputRemoveSpaces( $("#username").val() );
    } else {
        this.profile_hash["username"] = this.localized_anonymous || "anonymous";
    }
    this.profile_hash["gender"] = $("#gender").val();
    this.profile_hash["age"] = $("#age").val();
    this.profile_hash["age_old_value"] = $('#age').find(':selected').attr('old_value');
}

ProfileView.prototype._getLanguageCharacteristics = function() {
    this._getNativeSpeaker();
    this._getFirstLanguage();
    this._getDialect();
}

ProfileView.prototype._getNativeSpeaker = function() {
    this.profile_hash["native_speaker"] = $("#native_speaker").val();
}

ProfileView.prototype._getFirstLanguage = function() {
    this.profile_hash["first_language"] = $('#first_language').val();
    if ( this._otherFirstLanguage() ) {
        this.profile_hash["first_language_other"] =
            Profile.cleanUserInput( $("#first_language_other").val() );        
    } else {
        this.profile_hash["first_language_other"] = "";
    }
}

ProfileView.prototype._otherFirstLanguage = function() {
    return ( $('#first_language').val() === this.localized_other );
}

ProfileView.prototype._getDialect = function() {
    this.profile_hash["dialect"] = $("#dialect").val();
    if ( this._otheDialect() ) {
        this.profile_hash["dialect_other"] =
            Profile.cleanUserInput( $("#dialect_other").val() );        
    } else {
        this.profile_hash["dialect_other"] = "";
    }

    this.profile_hash["sub_dialect"] = $("#sub_dialect").val();
}

ProfileView.prototype._otheDialect = function() {
    return ($('#dialect').val() === this.localized_other);
}

ProfileView.prototype._getRecordingInformation = function() {
    this._getMic();
    this._getLocation();
    this._getNoise();      
    this._userAgentInfo();
    this._getLicense();             
}

ProfileView.prototype._getMic = function() {
    this.profile_hash["microphone"] = $("#microphone").val() ;
    if ( this._otherMic() ) {
        this.profile_hash["microphone_other"] =
            Profile.cleanUserInput( $("#microphone_other").val() );        
    } else {
        this.profile_hash["microphone_other"] = "";
    }
}

ProfileView.prototype._otherMic = function() {
    return  ($('#microphone').val() === this.localized_other);
}

ProfileView.prototype._getLocation = function() {
    this.profile_hash["recording_location"] = $("#recording_location").val();
    if ( this._otherLocation() ) {
        this.profile_hash["recording_location_other"] =
            Profile.cleanUserInput( $("#recording_location_other").val() );        
    } else {
        this.profile_hash["recording_location_other"] = "";
    }
}

ProfileView.prototype._otherLocation = function() {
    return  ($('#recording_location').val() === this.localized_other);
}

ProfileView.prototype._getNoise = function() {
    this.profile_hash["background_noise"] = $("#background_noise").val() ;
    if ( this._hasNoise() ) {    
        this._noise();
    } else {
        this._noNoise();
    }
}

ProfileView.prototype._hasNoise = function() {
    return  ( $("#background_noise").val() === this.localized_yes ) ;
}

ProfileView.prototype._noise = function() {
    this.profile_hash["noise_volume"] = $("#noise_volume").val();

    this.profile_hash["noise_type"] = $("#noise_type").val();
    if ( this._otherNoiseType() ) {
        this.profile_hash["noise_type_other"] =
            Profile.cleanUserInput( $("#noise_type_other").val() );        
    } else {
        this.profile_hash["noise_type_other"] = "";
    }
}

ProfileView.prototype._otherNoiseType = function() {
    return  ($('#noise_type').val() === this.localized_other);
}

ProfileView.prototype._noNoise = function() {
    this.profile_hash["noise_volume"] = this.default_value;
    this.profile_hash["noise_type"] = this.default_value;
    this.profile_hash["noise_type_other"] = "";
}

// see http://www.whatsmyua.info/
// https://developers.whatismybrowser.com/useragents/parse/?analyse-my-user-agent=yes
ProfileView.prototype._userAgentInfo = function() {
    if ( this._includeUA() ) {
        this._getUserAgentInfo();
    } else {
        this._clearUserAgentInfo();
    }
}

ProfileView.prototype._includeUA = function() {
    return  $('#ua_string').is(":checked");
}

ProfileView.prototype._getUserAgentInfo = function() {
    this.profile_hash["user_agent_string"] = platform.ua;
    
    // attempts to parse the ua string; use empty string if cannot parse
    this.profile_hash["os_family"] = platform.os.family || '';
    this.profile_hash["os_version"] = platform.os.version || '';
    this.profile_hash["browser_name"] = platform.name || '';
    this.profile_hash["browser_version"] = platform.version || '';
    this.profile_hash["product"] = platform.product || '';
    this.profile_hash["manufacturer"] = platform.manufacturer || '';
}
    
ProfileView.prototype._clearUserAgentInfo = function() {
    this.profile_hash["user_agent_string"] = '';
    this.profile_hash["os_family"] = '';
    this.profile_hash["os_version"] = '';
    this.profile_hash["browser_name"] = '';
    this.profile_hash["browser_version"] = '';
    this.profile_hash["product"] = '';
    this.profile_hash["manufacturer"] = '';
}

ProfileView.prototype._getLicense = function() {
    this.profile_hash["license"] = $("#license").val();
}
