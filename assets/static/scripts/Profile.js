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
function Profile (appversion) {
  this.appversion = appversion;
 
  this.debug = {};

  this.suffix = Profile.makeRandString (3, "abcdefghijklmnopqrstuvwxyz");
  this.randomDigits = Profile.makeRandString (10,'1234567890');
}


/**
* make random string of length strlen, can override default characters to use
* in random string
*
* see: https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
*/
Profile.makeRandString = function (strlen, possible)  {
    var text = "";

    for (var i = 0; i < strlen; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
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
*
*/
Profile.prototype.updateRandomStrings = function () {
  this.suffix = Profile.makeRandString (3, "abcdefghijklmnopqrstuvwxyz");
  this.randomDigits = Profile.makeRandString (10,'1234567890');
}

/**
* Read HTML Form Data to convert profile data to hash (associative array)
*/
Profile.prototype.getProfileFromBrowserStorage = function () {
  /**
  * get profile information from local storage and if it exists, return parsed
  * JSON object, otherwise return null.
  */
  function retrieve() {
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
  var parsedLocalStorageObject = retrieve();
  if ( parsedLocalStorageObject ) {
      this.sample_rate = parsedLocalStorageObject.sample_rate;
      this.bit_depth = parsedLocalStorageObject.bit_depth;
      this.channels = parsedLocalStorageObject.channels;
      this.debug = parsedLocalStorageObject.debug;

      return parsedLocalStorageObject;
  } else {
    return null;
  }

}

/**
* Read HTML Form Data to convert profile data to hash (associative array)
*/
//TODO should move this to View class, which should be the sole interaction point
// with HTML... create the HASH in view and just do a straight copy in Profile for
// anything that is in Display
Profile.prototype.toHash = function () {
    var profile_hash = View.getUserProfileInfo();

    profile_hash["language"] = page_language;

    profile_hash["Audio Recording Software:"] = 'VoxForge Javascript speech submission application';
    profile_hash["app_version"] = this.appversion;

    profile_hash["file_type"] = "wav";

    // see https://www.pmtonline.co.uk/blog/2004/11/04/what-does-the-bit-depth-and-sample-rate-refer-to/
    profile_hash["sample_rate"] = this.sample_rate;
    profile_hash["bit_depth"] = this.bit_depth;
    profile_hash["channels"] = this.channels;

    profile_hash["debug"] = this.debug;

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
// TODO all interactions with JQuery should be made in View class
Profile.prototype.toTextArray = function () {
    var profile_hash = View.getUserProfileInfo();

    var profile_array = [];
    var i=0;

    profile_array[i++] = 'User Name: ' + profile_hash["username"] + '\n';

    profile_array[i++] = '\nSpeaker Characteristics: \n\n';

    profile_array[i++] = 'Gender: ' +  profile_hash["gender"] + '\n';

    if (profile_hash["age_old_value"]) {
      profile_array[i++] = 'Age Range: ' + profile_hash["age_old_value"] + '\n';
    } else {
      profile_array[i++] = 'Age Range: ' +  profile_hash["age"] + '\n';
    }

    profile_array[i++] = 'Language: ' +  page_language + '\n';

    profile_array[i++] = 'Native Speaker: ' + profile_hash["native_speaker"] + '\n';
    if (profile_hash["native_speaker"] !== "No") {  // is a native speaker - default
      if (profile_hash["dialect"] !== page_localized_other) {
        profile_array[i++] = 'Pronunciation dialect: ' + profile_hash["dialect"] + '\n';
        if ( profile_hash["sub_dialect"] ) {
          profile_array[i++] = '  sub-dialect: ' + profile_hash["sub_dialect"] + '\n';
        }
      } else {
        profile_array[i++] =  'Pronunciation dialect: Other - ' + profile_hash["dialect_other"] + '\n';
      }
    } else { // Not a native speaker
      if ( profile_hash["first_language"] !== page_localized_other) 
      {
        var langId = profile_hash["first_language"];
        profile_array[i++] = '  first language: ' + languages.getLanguageInfo(langId).name + '\n';
      } else {
        profile_array[i++] = '  first language: ' + profile_hash["first_language_other"];
      }
    }

    profile_array[i++] = '\nRecording Information: \n\n';
    if (profile_hash["microphone"] !== page_localized_other) {
      profile_array[i++] = 'Microphone Type: ' + profile_hash["microphone"] + '\n';
    } else {
      profile_array[i++] = 'Microphone Type: Other - ' + profile_hash["microphone_other"]  + '\n';
    }

    if ( profile_hash["recording_location"] !== page_localized_other) {
      profile_array[i++] = 'Recording Location: ' +  profile_hash["recording_location"] + '\n';
    } else {
      profile_array[i++] = 'Recording Location: Other - ' + profile_hash["recording_location_other"] + '\n';
    }

    profile_array[i++] = 'Background Noise: ' + profile_hash["background_noise"] + '\n';
    if (profile_hash["background_noise"] === "Yes") {
      profile_array[i++] = 'Noise Volume: ' + profile_hash["noise_volume"] + '\n';
      if (profile_hash["noise_type"] !== page_localized_other) {
        profile_array[i++] = 'Noise Type: ' + profile_hash["noise_type"]  + '\n';
      } else {
        profile_array[i++] = 'Noise Type: Other - ' + profile_hash["noise_type_other"] + '\n';
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

    profile_array[i++] = '\nLicense: ' + profile_hash["license"]  + '\n';

    profile_array[i++] = '\nFile Info: \n\n';

    profile_array[i++] = 'File type: wav\n';

    // see https://www.pmtonline.co.uk/blog/2004/11/04/what-does-the-bit-depth-and-sample-rate-refer-to/
    profile_array[i++] = 'Sample Rate: ' + this.sample_rate + '\n';
    profile_array[i++] = 'Sample Rate Format (bit depth): ' + this.bit_depth + '\n';
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
    return Profile.cleanUserInputRemoveSpaces( View.getUserName() ) || page_anonymous || "anonymous";
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
  var result = page_language.toUpperCase() + '-' + this.getUserName() + '-' + date + '-' + this.suffix;

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
* updates:
      this.sample_rate 
      this.bit_depth 
      this.channels
*/
Profile.prototype.setAudioPropertiesAndContraints = function (obj) {
    for (const prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        this[prop] = obj[prop];
      }
    } 
}

/**
* updates:
      this.debug 
*/
Profile.prototype.setDebugValues = function (obj) {
    for (const prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        this.debug[prop] = obj[prop];
      }
    } 
}

/**
* CC0 1.0 license to array
*/
Profile.prototype.CC0toTextArray = function () {
    var license_array = [];
    var i=0;

    if (page_license.full_license.CC0) {
      license_array = this.getLicense("CC0");
    } else {
      var d = new Date();
      var year = d.getFullYear().toString();
      
      license_array[i++] = 'CC0 - Creative Commons Public Domain Dedication\n\n';

      license_array[i++] = year + ' - VoxForge Speech Recording by: ' + this.getUserName() + '\n';
   
      license_array[i++] = '\nTo the extent possible under law, the person who associated CC0 with\n';
      license_array[i++] = 'this Speech Recording has waived all copyright and related or neighboring rights\n';
      license_array[i++] = 'to the Speech Recording\n';

      license_array[i++] = '\nYou should have received a copy of the CC0 legalcode along with this\n';
      license_array[i++] = 'work.  If not, see <https://creativecommons.org/publicdomain/zero/1.0/>.\n';
    }

    return license_array;
}

/**
* CC BY Attribution 3.0 Unported License to array
*/
Profile.prototype.CC_BYtoTextArray = function () {
    var license_array = [];
    var i=0;
    if (page_license.full_license.CC_BY) {
      license_array = this.getLicense("CC_BY");
    } else {
      var d = new Date();
      var year = d.getFullYear().toString();

      license_array[i++] = 'CC BY 4.0 - Creative Commons Attribution license\n\n';

      license_array[i++] = 'VoxForge Speech Recording (c) ' + year + ' by: ' + this.getUserName() + '\n';

      license_array[i++] = '\nThis Speech Recordingis licensed under a\n';
      license_array[i++] = 'Creative Commons Attribution 4.0 Unported License.\n';

      license_array[i++] = '\nYou should have received a copy of the CC BY 4.0 legalcode along with this\n';
      license_array[i++] = 'work.  If not, see <https://creativecommons.org/licenses/by/4.0/>.\n';
    }

    return license_array;
}

/**
* CC BY-SA Attribution-ShareAlike 3.0 Unported Licenseto array
*/
Profile.prototype.CC_BY_SAtoTextArray = function () {
    var license_array = [];
    var i=0;

    if (page_license.full_license.CC_BY_SA) {
      license_array = this.getLicense("CC_BY_SA");
    } else {
      var d = new Date();
      var year = d.getFullYear().toString();

      license_array[i++] = 'CC BY-SA - Creative Commons Attribution-ShareAlike license\n\n';

      license_array[i++] = 'VoxForge Speech Recording (c) ' + year + ' by: ' + this.getUserName() + '\n';

      license_array[i++] = '\nThis Speech Recording is licensed under a\n';
      license_array[i++] = 'Creative Commons Attribution-ShareAlike 4.0 Unported License.\n';
   
      license_array[i++] = '\nYou should have received a copy of the CC0 legalcode along with this\n';
      license_array[i++] = 'work.  If not, see <http://creativecommons.org/licenses/by-sa/4.0/>.\n';
    }

    return license_array;
}

/**
* get license
*/
Profile.prototype.getLicense = function (license) {
    var license_obj = page_license.full_license[license];

    var license_array = [];
    var i=0;
    var d = new Date();
    var year = d.getFullYear().toString();

    if ( license_obj ) {
      license_array[i++] = license_obj.title + '\n\n';

      license_array[i++] = license_obj.attribution.replace("_year_", year) + " " + this.getUserName() + '\n\n';
      for (var j = 0; j < license_obj.text.length; j++) {
        license_array[i++] = license_obj.text[j] + "\n";
      }
      license_array[i++] = license_obj.text_last + " " + license_obj.link;
    } else {
      console.warn("invalid licence ID: " + license + "; using CC0 as default");
     
      license_array[i++] = 'CC0 - Creative Commons Public Domain Dedication\n\n';

      license_array[i++] = year + ' - VoxForge Speech Recording by: ' + this.getUserName() + '\n';
   
      license_array[i++] = '\nThe person who associated a work with this deed has dedicated the work\n';
      license_array[i++] = 'to the public domain by waiving all of his or her rights to the work\n';
      license_array[i++] = 'worldwide under copyright law, including all related and neighboring \n';
      license_array[i++] = 'rights, to the extent allowed by law.\n';

      license_array[i++] = '\nYou can copy, modify, distribute and perform the work, even for\n';
      license_array[i++] = 'commercial purposes, all without asking permission.\n';

      license_array[i++] = '\nYou should have received a copy of the CC0 legalcode along with this\n';
      license_array[i++] = 'work.  If not, see <https://creativecommons.org/publicdomain/zero/1.0/>.\n';
    }

    return license_array;
}

/**
* License to array
*/
Profile.prototype.licensetoArray = function () {
    var licenseID = View.getLicenseID();

    return  this.getLicense(licenseID);
}


