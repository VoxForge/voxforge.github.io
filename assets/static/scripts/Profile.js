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
function Profile (appversion, 
                  pageVariables) 
{
    this.appversion = appversion;

    this.suffix = Profile.makeRandString (3, "abcdefghijklmnopqrstuvwxyz");
    this.randomDigits = Profile.makeRandString (10,'1234567890');

    this.localized_yes = pageVariables.localized_yes;
    this.localized_other = pageVariables.localized_other;
    this.language = pageVariables.language;
    this.localized_anonymous = pageVariables.anonymous;
    this.license = pageVariables.license;
    this.default_value = pageVariables.default_value;
}

/**
* ### Static methods ##############################################
*/

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
* remove unwanted characters from user input
*/
Profile.cleanUserInputRemoveSpaces = function (user_input) {
    var user_input = user_input.replace(/\s+/, '_').replace(/[^a-z0-9_\-]/gi,'').replace(/_+/g, '_');

    return user_input.substring(0, 40);
}

/**
* ### METHODS ##############################################
*/

/**
* create 3 lower case character suffix and random 10 digit id for submission
*/
Profile.prototype.updateRandomStrings = function () {
  this.suffix = Profile.makeRandString (3, "abcdefghijklmnopqrstuvwxyz");
  this.randomDigits = Profile.makeRandString (10,'1234567890');
}

/**
*
*/
Profile.prototype.getProfileFromBrowserStorage = function () {
  var self = this;
  /**
  * get profile information from local storage and if it exists, return parsed
  * JSON object, otherwise return null.
  *
  * Note: localStorage is a synchronous API... no need for async promise cruft
  */
  function retrieve() {
      var retrievedObject = localStorage.getItem(self.language);
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

      return parsedLocalStorageObject;
  } else {
    return null;
  }
}

/**
* 
*/
Profile.prototype.toHash = function () {
    // TODO View.getUserProfileInfo gets called twice to get same info
    // everytime a user uploads...
   
    var profile_hash = View.getUserProfileInfo(
        this.localized_yes,
        this.localized_other,
        this.localized_anonymous,      
        this.default_value,
    );

    profile_hash["language"] = this.language;

    profile_hash["Audio Recording Software:"] = 'VoxForge Javascript speech submission application';
    profile_hash["app_version"] = this.appversion;

    profile_hash["file_type"] = "wav";

    profile_hash["sample_rate"] = this.sample_rate;
    profile_hash["bit_depth"] = this.bit_depth;
    profile_hash["channels"] = this.channels;

    return profile_hash;
};

/**
* Convert profile object to JSON string, with line feeds after every key 
* value line
*
* used to create profile.json file, and saving state between submissions.
*/
Profile.prototype.toJsonString = function () {
    return JSON.stringify(this.toHash() ,null ,"  ");
}

/**
* Read HTML Form Data to convert profile data to array
*/
Profile.prototype.toTextArray = function () {
    // TODO View.getUserProfileInfo gets called twice to get same info
    // everytime a user uploads... cache info somehow...
    // TODO this method assumes that toHash was called before it... 
    var profile_hash = View.getUserProfileInfo(
        this.localized_yes,
        this.localized_other,
        this.localized_anonymous,      
        this.default_value,
    );
                                                
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

    profile_array[i++] = 'Language: ' +  this.language + '\n';

    profile_array[i++] = 'Native Speaker: ' + profile_hash["native_speaker"] + '\n';
    if (profile_hash["native_speaker"] !== "No") {  // is a native speaker - default
      if (profile_hash["dialect"] !== this.localized_other) {
        profile_array[i++] = 'Pronunciation dialect: ' + profile_hash["dialect"] + '\n';
        if ( profile_hash["sub_dialect"] ) {
          profile_array[i++] = '  sub-dialect: ' + profile_hash["sub_dialect"] + '\n';
        }
      } else {
        profile_array[i++] =  'Pronunciation dialect: Other - ' + profile_hash["dialect_other"] + '\n';
      }
    } else { // Not a native speaker
      if ( profile_hash["first_language"] !== this.localized_other) 
      {
        var langId = profile_hash["first_language"];
        profile_array[i++] = '  first language: ' + languages.getLanguageInfo(langId).name + '\n';
      } else {
        profile_array[i++] = '  first language: ' + profile_hash["first_language_other"];
      }
    }

    profile_array[i++] = '\nRecording Information: \n\n';
    if (profile_hash["microphone"] !== this.localized_other) {
      profile_array[i++] = 'Microphone Type: ' + profile_hash["microphone"] + '\n';
    } else {
      profile_array[i++] = 'Microphone Type: Other - ' + profile_hash["microphone_other"]  + '\n';
    }

    if ( profile_hash["recording_location"] !== this.localized_other) {
      profile_array[i++] = 'Recording Location: ' +  profile_hash["recording_location"] + '\n';
    } else {
      profile_array[i++] = 'Recording Location: Other - ' + profile_hash["recording_location_other"] + '\n';
    }

    profile_array[i++] = 'Background Noise: ' + profile_hash["background_noise"] + '\n';
    if (profile_hash["background_noise"] === this.localized_yes) {
      profile_array[i++] = 'Noise Volume: ' + profile_hash["noise_volume"] + '\n';
      if (profile_hash["noise_type"] !== this.localized_other) {
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
   localStorage.setItem(this.language, this.toJsonString());
};


/**
* return cleaned username user entered into input field
*/
Profile.prototype.getUserName = function () {
    return Profile.cleanUserInputRemoveSpaces(
        View.getUserName() ) ||
        this.anonymous ||
        "anonymous";
}

/**
* return submission name with random digits appended
*/
Profile.prototype.getTempSubmissionName = function () {
  return this.getShortSubmissionName() + '[' + this.randomDigits + ']';
}

/**
* return submission name in lang-username-date format
*/
Profile.prototype.getShortSubmissionName = function () {
  var d = new Date();
  var month = d.getMonth() + 1;
  month = month < 10 ? '0' + month : '' + month; // add leading zero to one digit month
  var day = d.getDate();
  day = day < 10 ? '0' + day : '' + day; // add leading zero to one digit day
  var date = d.getFullYear().toString() + month.toString() + day.toString();
  var result = this.language.toUpperCase() + '-' +
               this.getUserName() + '-' +
               date + '-' +
               this.suffix;

  return result;
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
* get translated license text from language specific Read.md file, or default
* contained in _data/read/default.yaml
*
* if none present, then set CC0 as default.
*/
Profile.prototype.getLicense = function (license) {
    var license_obj = this.license.full_license[license];

    var license_array = [];
    var i=0;
    var d = new Date();
    var year = d.getFullYear().toString();

    if ( license_obj ) {
      license_array[i++] = license_obj.title + '\n\n';

      license_array[i++] = license_obj.attribution.replace("_year_", year) + " " +
                           this.getUserName() + '\n\n';
      for (var j = 0; j < license_obj.text.length; j++) {
        license_array[i++] = license_obj.text[j] + "\n";
      }
      license_array[i++] = license_obj.text_last + " " + license_obj.link;
    } else {
      console.warn("invalid licence ID: " + license + "; using CC0 as default");
     
      license_array[i++] = 'CC0 - Creative Commons Public Domain Dedication\n\n';

      license_array[i++] = year +
                           ' - VoxForge Speech Recording by: ' +
                           this.getUserName() + '\n';
   
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


