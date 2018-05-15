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

/**
* Class declaration
*/
function Profile (updateView_func, appversion) {
  this.appversion = appversion;

  /**
  * get profile information from local storage and if it exists, return parsed
  * JSON object, otherwise return null.
  */
  var getProfileFromLocalStorage = function () {
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
  if ( parsedLocalStorageObject = getProfileFromLocalStorage() ) {
      updateView_func(parsedLocalStorageObject);
  }

  /**
  * make random string of length strlen, can override default characters to use
  * in random string
  *
  * see: https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
  */
  function makeRandString(strlen, possible) {
    var text = "";

    for (var i = 0; i < strlen; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  this.sample_rate = null;
  this.sample_rate_format = null;
  this.channels = null;
  this.echoCancellation = null;
  this.autoGainSupported = null;
  this.noiseSuppression = null;

  this.suffix = makeRandString (3, "abcdefghijklmnopqrstuvwxyz");
  this.randomDigits = makeRandString (10,'1234567890');
}

/**
* remove unwanted characters from user input
* 
* removes all non-alphanumeric characters
* trim string to max of length 80 characters

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
* Read HTML Form Data to convert profile data to hash (associative array)
*/
Profile.prototype.toHash = function () {
    var profile_hash = {};

    // note, this leaves the contents of Form unchanged, only when user 
    // comes back does content of Other form field get removed
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
    if ($('#first_language').val() !== page_localized_other) {
        profile_hash["first_language_other"] = "";
    } else {
        profile_hash["first_language_other"] = Profile.cleanUserInput( $("#first_language_other").val() );
    }

    profile_hash["dialect"] = $("#dialect").val();
    if ($('#dialect').val() !== page_localized_other) {
        profile_hash["dialect_other"] = "";
    } else {
        profile_hash["dialect_other"] = Profile.cleanUserInput( $("#dialect_other").val() );
    }

    profile_hash["sub_dialect"] = $("#sub_dialect").val();

    profile_hash["microphone"] = $("#microphone").val() ;
    if ($('#microphone').val() !== page_localized_other) {
        profile_hash["microphone_other"] = "";
    } else {
        profile_hash["microphone_other"] = Profile.cleanUserInput( $("#microphone_other").val() );
    }

    profile_hash["recording_location"] = $("#recording_location").val() ;
    if ($('#recording_location').val() !== page_localized_other) {
        profile_hash["recording_location_other"] = "";
    } else {
        profile_hash["recording_location_other"] = Profile.cleanUserInput( $("#recording_location_other").val() );
    }

    profile_hash["background_noise"] = $("#background_noise").val() ;
    profile_hash["noise_volume"] = $("#noise_volume").val() ;

    profile_hash["noise_type"] = $("#noise_type").val();
    if ($('#noise_type').val() !== page_localized_other) {
        profile_hash["noise_type_other"] = "";
    } else {
        profile_hash["noise_type_other"] = Profile.cleanUserInput( $("#noise_type_other").val() );
    }

    profile_hash["Audio Recording Software:"] = 'VoxForge Javascript speech submission application';
    profile_hash["app_version"] = this.appversion;

    profile_hash["ua_string"] = $("#ua_string").val();
    // see http://www.whatsmyua.info/
    // https://developers.whatismybrowser.com/useragents/parse/?analyse-my-user-agent=yes
    if ($('#ua_string').val() === page_localized_yes) {
      profile_hash["user_agent_string"] = platform.ua;
      // attempts to parse the ua string
      profile_hash["os_family"] = platform.os.family;
      profile_hash["os_version"] = platform.os.version;
      profile_hash["browser_name"] = platform.name;
      profile_hash["browser_version"] = platform.version;
      profile_hash["product"] = platform.product || "";
      profile_hash["manufacturer"] = platform.manufacturer || "";
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

    profile_hash["file_type"] = "wav";

    // see https://www.pmtonline.co.uk/blog/2004/11/04/what-does-the-bit-depth-and-sample-rate-refer-to/
    profile_hash["sample_rate"] = this.sample_rate;
    profile_hash["sample_rate_format"] = this.sample_rate_format;
    profile_hash["channels"] = this.channels;

    profile_hash["echoCancellation"] = this.echoCancellation;
    profile_hash["autoGainSupported"] = this.autoGainSupported;
    profile_hash["noiseSuppression"] = this.noiseSuppression;

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
* Read HTML Form Data to convert profile data to array
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

    profile_array[i++] = 'O/S: ' +  platform.os.toString() + '\n';
    profile_array[i++] = 'Browser: ' +  platform.name + ' ' + platform.version + '\n';
    if (platform.product) { // smartphone product name
      profile_array[i++] = 'Product: ' + platform.product + '\n';
    }
    if (platform.manufacturer) { // smartphone manufacturer
      profile_array[i++] = 'Manufacturer: ' + platform.manufacturer + '\n';
    }

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
    return Profile.cleanUserInputRemoveSpaces( $('#username').val() ) || page_anonymous || "anonymous";
}

/**
* submission_filename = language + '-' + username + '-' + date + '-' + random_chars[:3] + '[' + random_chars + '].zip';
* see: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
*/
Profile.prototype.getTempSubmissionName = function () {
  return this.getShortSubmissionName() + '[' + this.randomDigits + ']';
}

/**
* submission_filename = language + '-' + username + '-' + date + '-' + random_chars[:3] + '[' + random_chars + '].zip';
* see: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
*/
Profile.prototype.getShortSubmissionName = function () {
  var d = new Date();
  var month = d.getMonth() + 1;
  month = month < 10 ? '0' + month : '' + month; // add leading zero to one digit month
  var day = d.getDate();
  day = day < 10 ? '0' + day : '' + day; // add leading zero to one digit day
  var date = d.getFullYear().toString() + month.toString() + day.toString();
  var result = page_language + '-' + this.getUserName() + '-' + date + '-' + this.suffix;

  return result;
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
* return suffix used in for submission name
*/
Profile.prototype.getSuffix = function () {
    return this.suffix;
}

/**
* return username to be used in license
*/
Profile.prototype.getLicenseUserName = function () {
    return Profile.prototype.getUserName;
}

/**
* CC0 1.0 license to array
*/
Profile.prototype.CC0toTextArray = function () {
    var license_array = [];
    var i=0;
    var d = new Date();
    var year = d.getFullYear().toString();
    
    // assuming that it makes not sense to mention FSF in a CC0 license since 
    // there is no copyright...
    license_array[i++] = year + ' - VoxForge Speech Recording by: ' + this.getUserName() + '\n';
 
    license_array[i++] = '\nTo the extent possible under law, the person who associated CC0 with\n';
    license_array[i++] = 'this Speech Recording has waived all copyright and related or neighboring rights\n';
    license_array[i++] = 'to the Speech Recording\n';

    license_array[i++] = '\nYou should have received a copy of the CC0 legalcode along with this\n';
    license_array[i++] = 'work.  If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.\n';

    return license_array;
}

/**
* CC BY Attribution 3.0 Unported License to array
*/
Profile.prototype.CC_BYtoTextArray = function () {
    var license_array = [];
    var i=0;
    var d = new Date();
    var year = d.getFullYear().toString();

    license_array[i++] = 'VoxForge Speech Recording (c) ' + year + ' by: ' + this.getUserName() + '\n';

    license_array[i++] = '\nThis Speech Recordingis licensed under a\n';
    license_array[i++] = 'Creative Commons Attribution 3.0 Unported License.\n';

    license_array[i++] = '\nYou should have received a copy of the CC0 legalcode along with this\n';
    license_array[i++] = 'work.  If not, see <http://creativecommons.org/licenses/by/3.0/>.\n';

    return license_array;
}

/**
* CC BY-SA Attribution-ShareAlike 3.0 Unported Licenseto array
*/
Profile.prototype.CC_BY_SAtoTextArray = function () {
    var license_array = [];
    var i=0;
    var d = new Date();
    var year = d.getFullYear().toString();

    license_array[i++] = 'VoxForge Speech Recording (c) ' + year + ' by: ' + this.getUserName() + '\n';

    license_array[i++] = '\nThis Speech Recording is licensed under a\n';
    license_array[i++] = 'Creative Commons Attribution-ShareAlike 3.0 Unported License.\n';
 
    license_array[i++] = '\nYou should have received a copy of the CC0 legalcode along with this\n';
    license_array[i++] = 'work.  If not, see <http://creativecommons.org/licenses/by-sa/3.0/>.\n';

    return license_array;
}

/**
* GPL v3 License to array
*/
Profile.prototype.GPL_V3toTextArray = function () {
    var license_array = [];
    var i=0;
    var d = new Date();
    var year = d.getFullYear().toString();

    license_array[i++] = 'VoxForge Speech Recording Copyright (C) ' + year + ' by: ' + this.getUserName() + '\n';

    license_array[i++] = '\nThis program is free software: you can redistribute it and/or modify\n';
    license_array[i++] = 'it under the terms of the GNU General Public License as published by\n';
    license_array[i++] = 'the Free Software Foundation, either version 3 of the License, or\n';
    license_array[i++] = '(at your option) any later version.\n';

    license_array[i++] = '\nThis program is distributed in the hope that it will be useful,\n';
    license_array[i++] = 'but WITHOUT ANY WARRANTY; without even the implied warranty of\n';
    license_array[i++] = 'MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n';
    license_array[i++] = 'GNU General Public License for more details.\n';

    license_array[i++] = '\nYou should have received a copy of the GNU General Public License\n';
    license_array[i++] = 'along with this program.  If not, see <https://www.gnu.org/licenses/>.\n';

    return license_array;
}

/**
* GPL v3 License to array
*/
Profile.prototype.licensetoArray = function () {
    var licenseID = $("#license").val();
    var result;

    if (licenseID == 'CC0') {
        result = this.CC0toTextArray();
    } else if (licenseID == 'CC_BY') {
        result =  this.CC_BYtoTextArray();
    } else if (licenseID == 'CC_BY-SA') {
        result =  this.CC_BY_SAtoTextArray();
    } else if (licenseID == 'GPLv3') {
        result =  this.GPL_V3toTextArray();
    } else {
        console.error('invalid licence ID: ' + licenseID);
    }

    return result;
}


