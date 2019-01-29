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
* get user entered DOM data
*/
ProfileView.getUserProfileInfo = function(localized) {
    var profile_hash = {};

    ProfileView._getSpeakerCharacteristics(localized, profile_hash);
    ProfileView._getRecordingInformation(localized, profile_hash);   

    return profile_hash;
}

ProfileView._getSpeakerCharacteristics = function(localized, profile_hash) {
    ProfileView._getUserInfo(localized, profile_hash);   
    ProfileView._getLanguageCharacteristics(localized, profile_hash);
}

ProfileView._getUserInfo = function(localized, profile_hash) {
    if ( $('#username').val() ) {
        profile_hash["username"] =
            Profile.cleanUserInputRemoveSpaces( $("#username").val() );
    } else {
      profile_hash["username"] = localized.anonymous || "anonymous";
    }
    profile_hash["gender"] = $("#gender").val();
    profile_hash["age"] = $("#age").val();
    profile_hash["age_old_value"] = $('#age').find(':selected').attr('old_value');
}

ProfileView._getLanguageCharacteristics = function(localized, profile_hash) {
    ProfileView._getNativeSpeaker(profile_hash);
    ProfileView._getFirstLanguage(localized, profile_hash);
    ProfileView._getDialect(localized, profile_hash);
}

ProfileView._getNativeSpeaker = function(profile_hash) {
    profile_hash["native_speaker"] = $("#native_speaker").val();
}

ProfileView._getFirstLanguage = function(localized, profile_hash) {
    profile_hash["first_language"] = $('#first_language').val();
    if ( ProfileView._otherFirstLanguage(localized) ) {
        profile_hash["first_language_other"] =
            Profile.cleanUserInput( $("#first_language_other").val() );        
    } else {
        profile_hash["first_language_other"] = "";
    }
}

ProfileView._otherFirstLanguage = function(localized) {
    return ( $('#first_language').val() === localized.other );
}

ProfileView._getDialect = function(localized, profile_hash) {
    profile_hash["dialect"] = $("#dialect").val();
    if ( ProfileView._otheDialect(localized) ) {
        profile_hash["dialect_other"] =
            Profile.cleanUserInput( $("#dialect_other").val() );        
    } else {
        profile_hash["dialect_other"] = "";
    }

    profile_hash["sub_dialect"] = $("#sub_dialect").val();
}

ProfileView._otheDialect = function(localized) {
    return ($('#dialect').val() === localized.other);
}

ProfileView._getRecordingInformation = function(localized, profile_hash) {
    ProfileView._getMic(localized, profile_hash);
    ProfileView._getLocation(localized, profile_hash);
    ProfileView._getNoise(localized, profile_hash);      
    ProfileView._userAgentInfo(profile_hash);
    ProfileView._getLicense(profile_hash);             
}

ProfileView._getMic = function(localized, profile_hash) {
    profile_hash["microphone"] = $("#microphone").val() ;
    if ( ProfileView._otherMic(localized) ) {
        profile_hash["microphone_other"] =
            Profile.cleanUserInput( $("#microphone_other").val() );        
    } else {
        profile_hash["microphone_other"] = "";
    }
}

ProfileView._otherMic = function(localized) {
    return  ($('#microphone').val() === localized.other);
}

ProfileView._getLocation = function(localized, profile_hash) {
    profile_hash["recording_location"] = $("#recording_location").val();
    if ( ProfileView._otherLocation(localized) ) {
        profile_hash["recording_location_other"] =
            Profile.cleanUserInput( $("#recording_location_other").val() );        
    } else {
        profile_hash["recording_location_other"] = "";
    }
}

ProfileView._otherLocation = function(localized) {
    return  ($('#recording_location').val() === localized.other);
}

ProfileView._getNoise = function(localized, profile_hash) {
    profile_hash["background_noise"] = $("#background_noise").val() ;
    if ( ProfileView._hasNoise(localized) ) {    
        ProfileView._noise(localized, profile_hash);
    } else {
        ProfileView._noNoise(localized, profile_hash);
    }
}

ProfileView._hasNoise = function(localized) {
    return  ( $("#background_noise").val() === localized.yes ) ;
}

ProfileView._noise = function(profile_hash) {
    profile_hash["noise_volume"] = $("#noise_volume").val();

    profile_hash["noise_type"] = $("#noise_type").val();
    if ( ProfileView._otherNoiseType(localized) ) {
        profile_hash["noise_type_other"] =
            Profile.cleanUserInput( $("#noise_type_other").val() );        
    } else {
        profile_hash["noise_type_other"] = "";
    }
}

ProfileView._otherNoiseType = function(localized) {
    return  ($('#noise_type').val() === localized.other);
}

ProfileView._noNoise = function(localized, profile_hash) {
    profile_hash["noise_volume"] = localized.default_value;
    profile_hash["noise_type"] = localized.default_value;
    profile_hash["noise_type_other"] = "";
}

// see http://www.whatsmyua.info/
// https://developers.whatismybrowser.com/useragents/parse/?analyse-my-user-agent=yes
ProfileView._userAgentInfo = function(profile_hash) {
    if ( ProfileView._includeUA() ) {
        ProfileView._getUserAgentInfo(profile_hash);
    } else {
        ProfileView._clearUserAgentInfo(profile_hash);
    }
}

ProfileView._includeUA = function() {
    return  $('#ua_string').is(":checked");
}

ProfileView._getUserAgentInfo = function(profile_hash) {
    profile_hash["user_agent_string"] = platform.ua;
    
    // attempts to parse the ua string; use empty string if cannot parse
    profile_hash["os_family"] = platform.os.family || '';
    profile_hash["os_version"] = platform.os.version || '';
    profile_hash["browser_name"] = platform.name || '';
    profile_hash["browser_version"] = platform.version || '';
    profile_hash["product"] = platform.product || '';
    profile_hash["manufacturer"] = platform.manufacturer || '';
}
    
ProfileView._clearUserAgentInfo = function(profile_hash) {
    profile_hash["user_agent_string"] = '';
    profile_hash["os_family"] = '';
    profile_hash["os_version"] = '';
    profile_hash["browser_name"] = '';
    profile_hash["browser_version"] = '';
    profile_hash["product"] = '';
    profile_hash["manufacturer"] = '';
}

ProfileView._getLicense = function(profile_hash) {
    profile_hash["license"] = $("#license").val();
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
 * if user has filled in relevant profile information, no need to present
 * Speaker Characteristics section to user 
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

