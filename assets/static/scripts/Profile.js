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

var Profile = (function() { // code to keep helper classes inside Uploader namespace //

function Profile (appversion, pageVariables) {
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
* refresh displayed user information with info stored in offline storage.
* Note: not using cookies... no need to pass this info back to the server
* with each call (which is what cookies are for...)
*/
Profile.prototype.getProfileFromBrowserStorage = function () {
    var object = this._getParsedLocalStorageObject();

    if (object) {
        this._extractFields(object);
        return object;
    } else {
        return null;
    }
}

Profile.prototype._extractFields = function (parsedLocalStorageObject) {
    this.sample_rate = parsedLocalStorageObject.sample_rate;
    this.bit_depth = parsedLocalStorageObject.bit_depth;
    this.channels = parsedLocalStorageObject.channels;
}

/**
* get profile information from local storage and if it exists, return parsed
* JSON object, otherwise return null.
*
* Note: localStorage is a synchronous API... no need for async promise cruft
*
* boolean expression. Second part is evaluated only if left one is true. 
* therefore if retrievedObject is null, that gets returned
*/
Profile.prototype._getParsedLocalStorageObject = function () {
    var retrievedObject = localStorage.getItem(this.language);

    return retrievedObject && JSON.parse(retrievedObject);
}

// TODO gets called twice to get same info
// everytime a user uploads...
Profile.prototype.toHash = function () {
    var profile_hash = this._getProfileAttributesFromViewClass();
    this._addProfileSpecificAttributes(profile_hash);

    return profile_hash;
};

Profile.prototype._getProfileAttributesFromViewClass = function () {
    var profile_hash = View.getUserProfileInfo(
        this.localized_yes,
        this.localized_other,
        this.localized_anonymous,      
        this.default_value,
    );

    return profile_hash;
}

Profile.prototype._addProfileSpecificAttributes = function (profile_hash) {
    profile_hash["language"] = this.language;

    profile_hash["Audio Recording Software:"] = 'VoxForge Javascript speech submission application';
    profile_hash["app_version"] = this.appversion;

    profile_hash["file_type"] = "wav";

    profile_hash["sample_rate"] = this.sample_rate;
    profile_hash["bit_depth"] = this.bit_depth;
    profile_hash["channels"] = this.channels;
}

/**
* Convert profile object to JSON string, with line feeds after every key 
* value line
*
* used to create profile.json file, and saving state between submissions.
*/
Profile.prototype.toJsonString = function () {
    return JSON.stringify(this.toHash(), null, "  ");
}


/**
* Convert profile object to Array
*/
Profile.prototype.toArray = function () {
    var profile_hash = this._getProfileAttributesFromViewClass();     
    var profileArray = new ProfileArray(
        profile_hash,
        this.localized_other,
        this.localized_yes,
        this.sample_rate,
        this.bit_depth,
        this.channels,
        this.language,);
    return profileArray.toTextArray();
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
    var shortSubmissionName = this.language.toUpperCase() + '-' +
        this.getUserName() + '-' +
        this._getDate() + '-' +
        this.getSuffix();

  return shortSubmissionName;
}

Profile.prototype._getDate = function () {
  var d = new Date();
  
  var month = d.getMonth() + 1;
  month = month < 10 ? '0' + month : '' + month; // add leading zero to one digit month
  
  var day = d.getDate();
  day = day < 10 ? '0' + day : '' + day; // add leading zero to one digit day
  
  var date = d.getFullYear().toString() + month.toString() + day.toString();

  return date;
}

/**
* return suffix used in for submission name
*/
Profile.prototype.getSuffix = function () {
    return this.suffix;
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
    var license_array;

    var license_obj = this.license.full_license[license];
    if (license_obj) {
        license_array = this._licenseObj2Array(license_obj);
    } else {
        console.warn("invalid licence ID: " +
            license +
            "; using CC0 as default");
        license_array = this._defaultLicense();
    }

    return license_array;
}

Profile.prototype._getYear = function () {
    var d = new Date();
    var year = d.getFullYear().toString();

    return year;
}

Profile.prototype._licenseObj2Array = function (license_obj) {
    var license_array = [];
    var year = this._getYear();   
    var i = 0;
            
    license_array[i++] = license_obj.title + '\n\n';

    license_array[i++] = license_obj.attribution.replace("_year_", year) +
        " " +
        this.getUserName() + '\n\n';
        
    for (var j = 0; j < license_obj.text.length; j++) {
        license_array[i++] = license_obj.text[j] + "\n";
    }
    
    license_array[i++] = license_obj.text_last + " " +
        license_obj.link;

    return license_array;
}

/*
 * CC0 is default license
 */
Profile.prototype._defaultLicense = function () {
    var license_array = [];
    var year = this._getYear();    
    var i = 0;
        
    license_array[i++] = 'CC0 1.0 - Creative Commons CC0 1.0 Universal Public Domain Dedication\n\n';

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

    return license_array;
}

/**
* License to array
*/
Profile.prototype.licensetoArray = function () {
    var licenseID = View.getLicenseID();

    return  this.getLicense(licenseID);
}

// #############################################################################

/**
* convert profile hash data to array
*
* TODO View.getUserProfileInfo gets called twice to get same info
* everytime a user uploads... cache info somehow...
*/
function ProfileArray(
    profile_hash,
    localized_other,
    localized_yes,
    sample_rate,
    bit_depth,
    channels,
    language)
{
    this.profile_hash = profile_hash;
    this.localized_other = localized_other;
    this.localized_yes = localized_yes;
    this.sample_rate = sample_rate;
    this.bit_depth = bit_depth;
    this.channels = channels;
    this.language = language;
    
    this.profile_array = [];    
}

ProfileArray.prototype.toTextArray = function () {
    this._setUserInformation();
    this._setLanguageInfo();
    this._setRecordingInformation();

    return this.profile_array;
};

ProfileArray.prototype._setUserInformation = function () {
    this.profile_array.push('User Name: ' + this.profile_hash["username"] + '\n');

    this.profile_array.push('\nSpeaker Characteristics: \n\n');

    this.profile_array.push('Gender: ' +  this.profile_hash["gender"] + '\n');

    if (this.profile_hash["age_old_value"]) {
        this.profile_array.push('Age Range: ' +
            this.profile_hash["age_old_value"] + '\n');
    } else {
        this.profile_array.push('Age Range: ' +  this.profile_hash["age"] + '\n');
    }
}

ProfileArray.prototype._setLanguageInfo = function () {
    this.profile_array.push('Language: ' +  this.language + '\n');

    this.profile_array.push('Native Speaker: ' +
        this.profile_hash["native_speaker"] + '\n');
    if (this.profile_hash["native_speaker"] !== "No") {  // is a native speaker - default
        this._nativeSpeaker();
    } else { 
        this._nonNativeSpeaker();        
    }
}

ProfileArray.prototype._nativeSpeaker = function () {
    if (this.profile_hash["dialect"] !== this.localized_other) {
        this.profile_array.push('Pronunciation dialect: ' +
            this.profile_hash["dialect"] + '\n');
        if ( this.profile_hash["sub_dialect"] ) {
            this.profile_array.push('  sub-dialect: ' +
                this.profile_hash["sub_dialect"] + '\n');
        }
    } else {
        this.profile_array.push('Pronunciation dialect: Other - ' +
            this.profile_hash["dialect_other"] + '\n');
    }
}

ProfileArray.prototype._nonNativeSpeaker = function () {
    if ( this.profile_hash["first_language"] !== this.localized_other) {
        var langId = this.profile_hash["first_language"];
        this.profile_array.push('  first language: ' +
            languages.getLanguageInfo(langId).name + '\n');
    } else {
        this.profile_array.push('  first language: ' +
            this.profile_hash["first_language_other"]);
    }
}

ProfileArray.prototype._setRecordingInformation = function () {
    this.profile_array.push('\nRecording Information: \n\n');

    this._setMic();
    this._setLocation();
    this._setNoise();
    this._setBrowserInfo();
    this._setAudioInfo();
    this._setLicense();
}

ProfileArray.prototype._setMic = function () {
    if (this.profile_hash["microphone"] !== this.localized_other) {
        this.profile_array.push('Microphone Type: ' +
            this.profile_hash["microphone"] + '\n');
    } else {
        this.profile_array.push('Microphone Type: Other - ' +
            this.profile_hash["microphone_other"]  + '\n');
    }
}

ProfileArray.prototype._setLocation = function () {
    if ( this.profile_hash["recording_location"] !== this.localized_other) {
      this.profile_array.push('Recording Location: ' +
        this.profile_hash["recording_location"] + '\n');
    } else {
      this.profile_array.push('Recording Location: Other - ' +
        this.profile_hash["recording_location_other"] + '\n');
    }
}

ProfileArray.prototype._setNoise = function () {
    this.profile_array.push('Background Noise: ' +
        this.profile_hash["background_noise"] + '\n');
    if (this.profile_hash["background_noise"] === this.localized_yes) {
        this.profile_array.push('Noise Volume: ' +
            this.profile_hash["noise_volume"] + '\n');
        this._setNoiseType();
    }
}

ProfileArray.prototype._setNoiseType = function () {
    if (this.profile_hash["noise_type"] !== this.localized_other) {
        this.profile_array.push('Noise Type: ' +
            this.profile_hash["noise_type"]  + '\n');
    } else {
        this.profile_array.push('Noise Type: Other - ' +
            this.profile_hash["noise_type_other"] + '\n');
    }
}

ProfileArray.prototype._setBrowserInfo = function () {
    this.profile_array.push(
        'Audio Recording Software: VoxForge Javascript speech submission application\n');
        
    this.profile_array.push('O/S: ' +  platform.os.toString() + '\n');
    this.profile_array.push('Browser: ' +
        platform.name + ' ' +
        platform.version + '\n');
    if (platform.product) { // smartphone product name
        profile_array.push('Product: ' + platform.product + '\n');
    }
    if (platform.manufacturer) { // smartphone manufacturer
        this.profile_array.push('Manufacturer: ' +
            platform.manufacturer + '\n');
    }
}

ProfileArray.prototype._setAudioInfo = function () {
    this.profile_array.push('\nFile Info: \n\n');
    this.profile_array.push('File type: wav\n');
    this.profile_array.push('Sample Rate: ' + this.sample_rate + '\n');
    this.profile_array.push('Sample Rate Format (bit depth): ' +
        this.bit_depth + '\n');
    this.profile_array.push('Number of channels: ' + this.channels + '\n');
}

ProfileArray.prototype._setLicense = function () {
    this.profile_array.push('\nLicense: ' +
        this.profile_hash["license"]  + '\n');        
}

// code to keep helper classes inside PromptFile namespace /////////////////////
return Profile;
}());
