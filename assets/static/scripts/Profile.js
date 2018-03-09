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
  this.sample_rate = null;
  this.sample_rate_format = null;
  this.channels = null;

  /**
  * get profile information from local storage and if it exists, return parsed
  * JSON object, otherwise return null.
  */
  getProfileFromLocalStorage = function () {
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
      view.update(parsedLocalStorageObject);
  }
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
* Read HTML Form Data to convert profile data to hash (associative array)
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
