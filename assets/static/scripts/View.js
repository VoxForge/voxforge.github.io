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

function View (parms,
               prompts,
               profile,
               location,               
               pageVariables)
{

  
// ######## convert View class from JQUERY to vanilla JS; keep jQuery mobile css

  
    this.parms = parms;
    this.prompts = prompts;
    this.profile = profile;
    this.location = location;

    this.displayVisualizer = parms.displayVisualizer;
    this.displayWaveform = parms.displayWaveform;

    // buttons
    this.record = document.querySelector('.record');
    this.stop = document.querySelector('.stop');
    this.upload = document.querySelector('.upload');

    // TODO this might work with delete if used class syntax (which should pick up many elements) instead of id synstax (which only pick up one element)
    this.delete_clicked = document.querySelector('#delete_clicked'); // only picks up first instance of in=delete in DOM

    // where audio files will be displayed in HTML
    this.soundClips = document.querySelector('.sound-clips');
    // where audio visualiser (vue meter) will be displayed in HTML
    this.canvas = document.querySelector('.visualizer');

    // unique id for wavesurfer objects in DOM
    this.clip_id = 0;

    this.localized_yes = pageVariables.localized_yes;
    this.localized_no = pageVariables.localized_no;
    this.localized_other = pageVariables.localized_other;
    this.please_select = pageVariables.please_select;
    this.default_value = pageVariables.default_value;
    this.alert_message = pageVariables.alert_message;

    this.playbuttontext = pageVariables.playbuttontext;
    this.stopbuttontext = pageVariables.stopbuttontext;

    this.uploadedSubmissions = localforage.createInstance({
      name: "uploadedSubmissions"
    });
    this.submissionCache = localforage.createInstance({
      name: "submissionCache"
    });
}


// ### static methods ##########################################################

/**
* update user display from passed json object

Note: need to make sure this is not delayed in execution, otherwise,
the app page will display, and the selects will be set in DOM properties,
but will be too late for it to display to the user correctly... so user will
see "Please Select" after a page refresh, even though the select will have
properties showing that a certain element was selected...
*/
View.updateView = function(json_object, localized_yes, localized_other) {
    //Speaker Characteristics
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
    $('#dialect_other').val( Profile.cleanUserInput(json_object.dialect_other) );
    if ( json_object.dialect === localized_other )
    {
      $("#dialect_other_display").show();
    }
    $('#sub_dialect').val( json_object.dialect_other );
    //Recording Information:
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
View.getUserProfileInfo = function(localized_yes, localized_other, localized_anonymous) {
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
    profile_hash["noise_volume"] = $("#noise_volume").val();

    profile_hash["noise_type"] = $("#noise_type").val();
    if ($('#noise_type').val() !== localized_other) {
        profile_hash["noise_type_other"] = "";
    } else {
        profile_hash["noise_type_other"] = Profile.cleanUserInput( $("#noise_type_other").val() );
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

// ### METHODS #################################################################

/** 
* Initialize object with async operations (returns a promise)
*/
View.prototype.init = function () {
    var self = this;

    /**
    * The value of contents of the independent_div is compared to the passed in 
    * value, and if they are equal, then the dependent_div is displayed, otherwise
    * it is hidden 
    *
    * showDivBasedonValue makes the view of one div dependent on the value of a select 
    * field in another div, and attaches an event handler to independent div so that
    * any changes in it are reflected in dependent div
    *
    * see https://stackoverflow.com/questions/15566999/how-to-show-form-input-fields-based-on-select-value
    */
    var showDivBasedonValue = function (independent_div, value, dependent_div, handler_already_created) {
      function test ( boolean_result ) {
        if( boolean_result ){
          $(dependent_div).show();
        } else {
          $(dependent_div).hide();
    //      if (value === self.localized_other) { // trying to clear text in other field if user unselects
    //         $(dependent_div).empty();
    //      }
        }
      }

      if ( typeof(value) === "boolean" && value === true ) { 
        // show if false; hide if true
        test( ! $(independent_div).val() );
      } else {
        test( $(independent_div).val()===value );
      }

      // only need to create event handler on first call to this function
      if ( ! handler_already_created ) 
      {
        $(independent_div).change(function () { // creates an event handler
            showDivBasedonValue(independent_div, value, dependent_div, true); 
        } );
      }
    }

    showDivBasedonValue('#native_speaker', self.localized_no, '#first_language_display', false);
    showDivBasedonValue('#native_speaker', self.localized_yes, '#dialect_display', false);
    showDivBasedonValue('#first_language', self.localized_other, '#first_language_other_display', false);
    // true means hide if there is something in the username field
    showDivBasedonValue('#username', true, '#anonymous_instructions_display', false); 
    showDivBasedonValue('#microphone', self.localized_other, '#microphone_other_display', false);
    showDivBasedonValue('#dialect', self.localized_other, '#dialect_other_display', false);
    showDivBasedonValue('#recording_location', self.localized_other, '#recording_location_other_display', false);
    showDivBasedonValue('#background_noise', self.localized_yes, '#background_noise_display', false);
    showDivBasedonValue('#noise_type', self.localized_other, '#noise_type_other_display', false);

    /**
    *
    * see: https://stackoverflow.com/questions/7694501/class-vs-static-method-in-javascript
    */

    /**
    * This function changes the contents of a second select list based on the
    * contents of a first select list.  This is used to set the 
    * contents of the sub-dialect selection list based on the value the dialect
    * selection list.
    *
    * Read.md contains the entire list of possbile subdialects for a language,
    * this function filters those contents based on what is contained in dialect
    * so that user only sees filtered results
    *
    * see https://stackoverflow.com/questions/10570904/use-jquery-to-change-a-second-select-list-based-on-the-first-select-list-option
    * Store all #subdialect's options in a variable, filter them according 
    * to the value of the chosen option in #dialect, and set them using 
    * .html() in #subdialect:
    */
    var $select1 = $( '#dialect' );
    $( '#sub_dialect select' ).val( self.default_value );
    var $select2 = $( '#sub_dialect' );
    var $optgroup = $select2.find( 'optgroup' );
    var $selected = $select2.find( ':selected' );
    var $result = $optgroup.add( $selected );

    $select1.on( 'change', function() {
        var filter =  $result.filter( '[name="' + this.value + '"]' );
        //filter.add ( $result.filter( 'selected value' ) );
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

    /**
    * fill other languages select list with stringified array the names of most 
    * ISO 639-1 language names
    */
    var langscodes = languages.getAllLanguageCode(); // array of language codes
    //var option = ''; // string
    var option = '<option value="' + self.default_value + '">'+ self.please_select + '</option>';
    for (var i=1;i<langscodes.length;i++){
       option += '<option value="'+ langscodes[i] + '">' +
       languages.getLanguageInfo(langscodes[i]).name + " (" +
       languages.getLanguageInfo(langscodes[i]).nativeName + ")" +  
       '</option>';
    }
    option += '<option value="' + self.localized_other + '">' + self.localized_other + '</option>'; 
    $('#first_language').append(option);

    // Prompts

    this.maxnumpromptschanged = document.querySelector('#max_num_prompts');

    // set default (device dependent) max number of prompts the user can record 
    var option = ''; // clear previous use of option var
    if (self.prompts.max_numPrompts_selector > 10) {
        var startPrompt = 10; // min number of prompts no matter what device
        var incr = 5;
        for (var i=startPrompt; i <= self.prompts.max_numPrompts_selector; i = i + incr){
           option += '<option value="'+ i + '">' + i +  '</option>';
        }
        $('#max_num_prompts').append(option);
        $('#max_num_prompts-display').show();
    } else {
        $('#max_num_prompts-display').hide();
    }
    /**
    * updates the current number of prompts that the user selected from dropdown

    */
    //$('#max_num_prompts').click(function () { 
    $('#max_num_prompts').change(function () { 
      self.prompts.userChangedMaxNum( this.value.replace(/[^0-9\.]/g,'') );
      self.updateProgress();
    });

    this.initSettingsPopup();
    this.submissionsLog();

    // leave all buttons off until user accepts permission to use Microphone (getUserMedia request)
    this.setRSUButtonDisplay(false, false, false); 

    // ########################################################################

    return new Promise(function (resolve, reject) {
        var json_object = self.profile.getProfileFromBrowserStorage();
        if (json_object) {
          View.updateView(json_object, self.localized_yes, self.localized_other);  
        } 

        resolve("OK");  // TODO not waiting for updateView
    }); // promise
}

/**
* settings pop up
* Note: localstorage only stores strings
*
* see app.js, line 68, for setting of default values
*
* see: http://jq4you.blogspot.com/2013/04/jquery-attr-vs-prop-difference.html
* Notes: an element’s property can be changed, because it is in the DOM and dynamic.
* But element’s attribute is in HTML text and can not be changed! comes in name=”value” pairs
*/
View.prototype.initSettingsPopup = function (message) {
    var self = this;

    // at startup; get settings from browser storage

    if ( localStorage.getItem("debug") === 'true') { // string
      $('#debug').prop('checked', true);  // boolean
    } else {
      $('#debug').prop('checked', false);
    }

    if ( localStorage.getItem("ua_string") === 'true') {
      $('#ua_string').prop('checked', true); 
    } else {
      $('#ua_string').prop('checked', false);
    }

    if ( localStorage.getItem("vad_run") === 'true') {
      $('#vad_run').prop('checked', true); 
    } else {
      $('#vad_run').prop('checked', false);
    }

    if ( localStorage.getItem("display_record_info") === 'true') {
      $('#display_record_info').prop('checked', true); 
      $('#recording_information_button_display').show();
    } else {
      $('#display_record_info').prop('checked', false);
      $('#recording_information_button_display').hide();
    }

    if ( localStorage.getItem("recording_location_reminder") === 'true') {
      $('#recording_location_reminder').prop('checked', true); 
    } else {
      $('#recording_location_reminder').prop('checked', false);
    }

    // post page load handlers

    $('#debug').change(function () {
      if (this.checked) {
        localStorage.setItem("debug", 'true');
      } else {
        localStorage.setItem("debug", 'false');
      }
    });

    $('#ua_string').change(function () { 
      if (this.checked) {
        localStorage.setItem("ua_string", 'true');
      } else {
        localStorage.setItem("ua_string", 'false');
      }
    });
    
    $('#vad_run').change(function () { 
      if (this.checked) {
        localStorage.setItem("vad_run", 'true');
      } else {
        localStorage.setItem("vad_run", 'false');
      }
    });

    function clearRecordingLocationInfo() {
        // clear certain field entries when user clicks display_record_info off
        $('#recording_location').val($("select option:first").val());
        $('#recording_location').change();
        $('#recording_location_other').val("");
        $('#recording_location_other').change();

        $('#background_noise').val($("select option:first").val());
        $('#background_noise').change(); // triggers event on element

        $('#noise_volume').val($("select option:first").val());
        $('#noise_volume').change();

        $('#noise_type').val($("select option:first").val());
        $('#noise_type').change();
        $('#noise_type_other').val("");
        $('#noise_type_other').change();
    }

    $('#display_record_info').change(function () {
      // https://stackoverflow.com/questions/13675364/checking-unchecking-checkboxes-inside-a-jquery-mobile-dialog
      $('#recording_location_reminder').prop( "disabled", ! this.checked );
      $('#recording_location_reminder').prop('checked', this.checked).checkboxradio("refresh");
      $('#recording_location_reminder').change();
      if (this.checked) {
          $("#recording_information_button_display").show();
          localStorage.setItem("recording_information_button_display", 'true');
      } else {
          $("#recording_information_button_display").hide();
          localStorage.setItem("recording_information_button_display", 'false');
          clearRecordingLocationInfo();
      }
    });

    $('#recording_location_reminder').change(function () {
      $('#recording_location_reminder').prop('checked', this.checked).checkboxradio("refresh"); 
      if (this.checked) {
        self.location.init();
        localStorage.setItem("recording_location_reminder", 'true');
      } else {
        localStorage.setItem("recording_location_reminder", 'false');
      }
    });
}

/**
* display log of uploaded and saved submissions
* 
* TODO how to deal with n>25 submissions... only show 25 most recent submissions?
*/
View.prototype.submissionsLog = function () 
{
    var self = this;
  
    /**
     * returns Array of submissions 
     */
    function getDatabaseKeys(database, message) {
      return new Promise(function (resolve, reject) {
        
        database.length()
        .then(function(numberOfKeys) {
          if (numberOfKeys <= 0) {
            console.log('no ' + message);
            resolve("");
          }
        })
        .catch(function(err) {
            console.log(err);
            resolve("");
        });

        database.keys().then(function(keys) {
            // An array of all the key names.
            if (keys.length > 0) {
              console.log(message + ' ' + keys);
              resolve(keys);
            }
        }).catch(function(err) {
            // This code runs if there were any errors
            console.log(err);
            resolve("");
        });

      });
    }

    /**
     * returns Array containing list of submissions that were uploaded to
     * Voxforge server
     */
    function getUploadedSubmissionList() {
      return new Promise(function (resolve, reject) {
        
          getDatabaseKeys(self.uploadedSubmissions, 'uploaded submissions')
          .then(function (uploadedSubmissionList) {
              if (uploadedSubmissionList) {
                  resolve(uploadedSubmissionList);
              } else {
                  resolve("");
              }
          });
          
      });
    }

    /**
     * get list of submissions stored in browser cache
     */
    function getSavedSubmissionList(uploadedSubmissionList) {
      return new Promise(function (resolve, reject) {
        
          getDatabaseKeys(self.submissionCache, 'saved submissions')
          .then(function (savedSubmissionList) {
              if (savedSubmissionList) {
                  resolve([uploadedSubmissionList, savedSubmissionList]);
              } else {
                  resolve([uploadedSubmissionList, ""]);
              }
          });
      });
    }
   
    /**
    * helper function to wrap array in html
    *
    */
    function makeHTMLlist (array, heading) {
        var count = 1;
        if (array) {
            return '<h3>' + heading + '</h3>' +
                   '<ul>' + 
                   jQuery.map( array, function( element ) {
                      return ( '<li>' + count++ + '. ' + element + '</li>'  );
                   }).join('') + // returns as a string
                   '</ul>';
        } else {
           return "";
        }
    }

    // cannot call one popup from another; therefore open second one
    // after first one closes
    // see: http://api.jquerymobile.com/popup/
    // chaining of popups
    $( document ).on( "pageinit", function() {
        $("#popupSettings").on({
          popupafterclose: function() {
              getUploadedSubmissionList()
              .then(getSavedSubmissionList)
              .then(function (submissionArray) {
                  $('#submission-list').popup(); // initialize popup before open

                  // TODO translate
                  var uploadedHTML = makeHTMLlist(submissionArray[0], 'Uploaded Submissions');
                  var savedHTML = makeHTMLlist(submissionArray[1], 'Saved Submissions');                 

                  $("#submission-list").html(uploadedHTML + savedHTML);
                  setTimeout(function() { $("#submission-list").popup( "open" ) }, 100 );
              })
              .catch(function(err) {
                  console.log(err);
              });
          } // popupafterclose
        });
    });
}

/**
* run after worker completes audio recording; creates a waveform display of 
* recorded audio and displays text of associated prompt line.  User can
* then review and if needed delete an erroneous recording, which can then be
* re-recorded
*/
View.prototype.displayAudioPlayer = function (obj) 
{
    //var prompt_id = obj.prompt_id; // TODO not used yet...
    var blob = obj.blob;

    // 'self' used to save the current context when calling function
    var self = this;

    var clipContainer = document.createElement('article');
    clipContainer.classList.add('clip');
    var prompt_id = document.querySelector('.prompt_id').innerText;

    /**
    * displays the speech recording's transcription
    */
    function createClipLabel() {
      var prompt_sentence = document.querySelector('.info-display').innerText;
      var clipLabel = document.createElement('prompt');
      clipLabel.classList.add('clip-label');
      clipLabel.textContent = prompt_id + " " + prompt_sentence;
    
      return clipLabel;
    }

    /**
    * create button to allow user to delete a prompt line
    */
    function createDeleteButton() {
      var deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete';

      //deleteButton.disabled = 'true';

      /**
      * delete a recorded prompt; which is then saved in prompt_stack so user
      * can re-record
      */
      deleteButton.onclick = function(e) {
        var evtTgt = e.target;
        var prompt_id = evtTgt.parentNode.innerText.split(/(\s+)/).shift();
        
        self.prompts.movePrompt2Stack(evtTgt.parentNode.firstChild.innerText);
        evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
        console.log("prompt deleted: " + prompt_id);

        $('#delete_clicked').click();
      }

      return deleteButton;
    }

    var audioURL = window.URL.createObjectURL(blob);
    /**
    * create easier to access audio links in DOM
    * TODO need to figure out how to get audio links from Wavesurfer...
    * TODO Firefox records audio in 32-bit float, but cannot play it back....
    * this could be used to store 32bit float audio in Firefox, while
    * 16bit wav could be sent to WaveSurfer
    */
    function createAudioContainer() {
      var audioPlayer = document.createElement('audio');
      audioPlayer.src = audioURL;

      return audioPlayer;
    }

    var waveformdisplay_id = "waveformContainer_" + prompt_id;
    /**
    * this creates the container (i.e. element in the shadow DOM) to be used
    * by WaveSurfer to display the audio waveform; Wavesurfer needs the container 
    * to exist before being called, so this creates the it...
    */
    function createWaveformElement() {
      var waveformElement = document.createElement('div');
      // hook for wavesurfer
      waveformElement.setAttribute("id", waveformdisplay_id);
      // TODO move this to css
      waveformElement.setAttribute("style", 
        "border-style: solid; min-width:100px; ");
      var style = document.createElement('div');
      style.setAttribute("style", "text-align: center");

      if (obj.no_speech) {
        waveformElement.setAttribute("style", "background: #ff4500");
        var no_speech_message = obj.app_auto_gain ? self.alert_message.no_speech_autogain : self.alert_message.no_speech;
        waveformElement.innerHTML = "<h4>" + no_speech_message + "</h4>";
      } else if (obj.no_trailing_silence) {
        waveformElement.setAttribute("style", "background: #ffA500");
        waveformElement.innerHTML = "<h4>" + self.alert_message.no_trailing_silence + "</h4>";
      //TODO need confidence level for clipping
      } else if (obj.clipping) {
        // TODO should not be able to upload if too loud
        waveformElement.setAttribute("style", "background: #ff4500");
        var audio_too_loud_message = obj.app_auto_gain ? self.alert_message.audio_too_loud_autogain : self.alert_message.audio_too_loud;
        waveformElement.innerHTML = "<h4>" + audio_too_loud_message + "</h4>";
      //TODO need confidence level for soft speaker
      } else if (obj.too_soft) {
        waveformElement.setAttribute("style", "background: #ff4500");
        var audio_too_soft_message = obj.app_auto_gain ? self.alert_message.audio_too_soft_autogain : self.alert_message.audio_too_soft;
        waveformElement.innerHTML = "<h4>" + audio_too_soft_message + "</h4>";
      }

      // playbutton inside wavesurfer display
      var display_id = "button_" + prompt_id;
      var button = document.createElement(display_id);
      button.className = "play btn btn-primary";
      // not sure how to toggle Play/Pause text
      button.textContent = self.playbuttontext; 
      button.setAttribute("onclick", "wavesurfer[" + self.clip_id + "].playPause()");
      
      style.appendChild(button);
      waveformElement.appendChild(style);

      console.log("clip_id: " + self.clip_id);

      return waveformElement;
    }

    // #########################################################################
    return new Promise(function (resolve, reject) {

      clipContainer.appendChild(createClipLabel());
      clipContainer.appendChild(createDeleteButton());
      if (self.displayWaveform) {
        clipContainer.appendChild(createWaveformElement());
      }
      clipContainer.appendChild(createAudioContainer());

      self.soundClips.insertBefore(clipContainer, self.soundClips.children[0]);

      // might be able to simplify this with: https://github.com/cwilso/Audio-Buffer-Draw
      // add waveform to waveformElement
      // see http://wavesurfer-js.org/docs/
      if (self.displayWaveform) {
        wavesurfer[self.clip_id] = WaveSurfer.create({
          container: '#' + waveformdisplay_id,
          scrollParent: true,
          waveColor : 'OliveDrab',
          minPxPerSec: 200,
        });
        wavesurfer[self.clip_id].load(audioURL);

        wavesurfer[self.clip_id].on('ready', function () {
          resolve(obj); // return value on completion
        });
      }
      self.clip_id++;
      
    });//promise
}

/** 
* display upload to VoxForge server status to user
*
* TODO no longer used
*/
View.prototype.showUploadStatus = function (message) {
    $('#upload_status_display').show();
    $('#upload_status_display').text(message);
    $('#upload_status_display').css({ 'color': 'green', 'font-size': '50%' });
    setTimeout( function () {
      //document.querySelector('.upload_status_display').innerText = "";
      $('#upload_status_display').hide();
      return;
    }, 3000);
}

/**
* Set up toggles for profile and direction buttons
*/
View.prototype.speakerCharacteristics = function () {
    $("#speaker_characteristics_display").toggle(); 
    $("#recording_information_display").hide();
}

/**
* toggle to display profile info
*/
View.prototype.profileInfo = function () {
    $("#profile-display").toggle();
}

/**
* toggle to display recording info
*/
View.prototype.recordingInformation = function () {
    $("#recording_information_display").toggle();
    $("#speaker_characteristics_display").hide();
}

/**
* toggle to display recording info button
*/
View.prototype.recordingInformationButtonDisplay = function () {
    //$("#recording_information_button_display").show(); 
    //$('#display_record_info').attr('checked', true);

    //localStorage.setItem("recording_information_button_display", true);
    //$('#display_record_info').attr('checked', true);
    $('#display_record_info').trigger( "click" );
}

/**
* toggle to display directions
*/
View.prototype.directionsInfo = function () {
    $("#instructions-display").toggle(); 
}

/**
* hide profile info; otherwise recorded audio will not display properly 
* at bottom of page
*/
View.prototype.hideProfileInfo = function () {
    $("#profile-display").hide();
    $("#profile-button-display").show();
    $("#instructions-display").hide();
    $("#instructions-button-display").show();
    $('.info-display').show();

    document.querySelector('.info-display').innerText = "";
    document.querySelector('.prompt_id').innerText = "";
}

/**
* set record, stop button display
*/
View.prototype.setRSButtonDisplay = function (record, stop) {
    this.record.disabled = ! record;
    this.stop.disabled = ! stop;
}

/**
* set upload button display
*/
View.prototype.setUButtonDisplay = function (upload) {
    this.upload.disabled = ! upload;
}

/**
* set record, stop & upload button display
*/
View.prototype.setRSUButtonDisplay = function (record, stop, upload) {
    this.setRSButtonDisplay(record,stop);
    this.setUButtonDisplay(upload);
}

/**
* hide all dynamically created delete buttons
*/
View.prototype.disableDeleteButtons = function () {
    $('.delete').prop('disabled', true);
}

/**
* show all  dynamically created delete buttons
*/
View.prototype.enableDeleteButtons = function () {
    $('.delete').prop('disabled', false);
}

/**
* 
*/
View.prototype.enableVoiceActivityDetection = function () {
    $('#vad_run').prop('checked', true); 
}
      
/**
* 

the following do not work:
$('.audio_player').hide(); 
document.querySelector('.audio_player').hide();
$('.audio_player').prop('hidden', true);

*/
View.prototype.hideAudioPlayer = function () {
    //only hides the first instance of audio_player, even though it is a class
    //document.querySelector('.audio_player').controls = false;
    var object_arr = $('.audio_player');
    for (var i = 0; i < object_arr.length; i++) {
        object_arr[i].controls = false;
    }
}

/**
*
*/
View.prototype.showAudioPlayer = function () {
    //document.querySelector('.audio_player').controls = true;
    var object_arr = $('.audio_player');
    for (var i = 0; i < object_arr.length; i++) {
        object_arr[i].controls = true;
    }
}

/**

*
* can't just disable the play button on the lower audio player, need to hide
* whole thing...
*/
View.prototype.hidePlayButtons = function () {
    $('.play').hide();
}

/**
* show all  dynamically created play buttons
* TODO disable does not seem to work with WaveSurfer
*/
View.prototype.showPlayButtons = function () {
    $('.play').show();
}

/**
* hide prompt display
* TODO enable does not seem to work with WaveSurfer
*/
View.prototype.hidePromptDisplay = function () {
    $('.info-display').hide();
}

/**
* clear sound clips
*/
View.prototype.clearSoundClips = function () {
    $( '.sound-clips' ).empty();
}

/**
* get debug value
*/
View.prototype.debugChecked = function () {
    return $('#debug').is(":checked");
}

/**
* location Selected; need both display record info and recording location
* to be checked in order for system to get geolocation info.
*
* User could have Record Info selected, but not Recording Location
* selected if they do not want their location tracked, even though its only
* withing the browser (never gets sent to server).  Then only time since
* last submission would trigger a reminder to check that Recoridng Information
* is still valid.
* -or-
* User could have Recording Location reminder on and Recording Info off,
* but that would not make much sense because the reminder is for user to
* remember to check that recording information is still valid (did they
* change location...); it would be asking user to update recording information
* even though it is not checked.
*
* TODO maybe if Recording Information checked, then can select or deselect
* Recording location, but if Recording Information no checked, then gray out
* Recording Location change reminder (if it gets annoying...
* TODO Maybe set timer for 30 minuts and then it goes back on automatically...
*/
View.prototype.locationSelected = function () {
    return $('#display_record_info').is(":checked") &&
           $('#recording_location_reminder').is(":checked");
}

/**
* get recording Reminder value; assumption being that if they
* have not recorded in a while, then they may have changed locations...
*
* TODO use chrome geolocation api... should be ok since not saving info
* and only using to check for changes in location
*/
View.prototype.checkRelocationReminder = function () {
    return $('#recording_location_reminder').is(":checked");
}


/**
* get recording information value
*/
View.prototype.displayRecordingInfoChecked = function () {
    return $('#display_record_info').is(":checked");
}


/**
* if noise volume is low, still do VAD - user has option to disable themselves
* if noise moderateor higher, need to disable VAD, because it will not work
* 
* TODO create user override for this
*/
View.prototype.noiseTurnOffVad = function () {
    if (  $('#background_noise').val() === this.localized_yes ) {
      var options = document.getElementById('noise_volume').options;
      var values = [];
      var i = 0, len = options.length;

      while (i < len)
      {
        values.push(options[i++].value);
      }

      // assumes first two values are always low background noise
      if ( $('#noise_volume').val() !== values[1] &&
           $('#noise_volume').val() !== values[2] )
      {
        return true;
      }
    }
}

/**
* display prompt line
*/
View.prototype.displayPrompt = function (promptId, promptSentence) {
    document.querySelector('.prompt_id').innerText = promptId;
    document.querySelector('.info-display').innerText = promptSentence;
}

/**
* reset DOM variables for another submission
*/
View.prototype.reset = function () {
    this.clip_id = 0;
    this.clearSoundClips();
    this.hideProfileInfo();

    this.updateProgress();
}

/**
* update number of prompts recorded and total number of prompts to record
*/
View.prototype.updateProgress = function () {
    var progress = this.prompts.getProgressDescription();
    document.querySelector('.progress-display').innerText = progress;
}


