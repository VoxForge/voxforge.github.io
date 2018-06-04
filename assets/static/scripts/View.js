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
               profile)
{
    var self = this; // save context

    this.displayVisualizer = parms.displayVisualizer;
    this.displayWaveform = parms.displayWaveform;

    this.prompts = prompts;

    // buttons
    this.record = document.querySelector('.record');
    this.stop = document.querySelector('.stop');
    this.upload = document.querySelector('.upload');
    // TODO this might work with delete if used class syntax (whcih shuold pick up many elements) instead of id synstax (which only pick up one element)
    this.delete_clicked = document.querySelector('#delete_clicked'); // only picks up first instance of in=delete in DOM

    // where audio files will be displayed in HTML
    this.soundClips = document.querySelector('.sound-clips');
    // where audio visualiser (vue meter) will be displayed in HTML
    this.canvas = document.querySelector('.visualizer');

    // unique id for wavesurfer objects in DOM
    this.clip_id = 0;
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
    //      if (value === page_localized_other) { // trying to clear text in other field if user unselects
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

    showDivBasedonValue('#native_speaker', page_localized_no, '#first_language_display', false);
    showDivBasedonValue('#native_speaker', page_localized_yes, '#dialect_display', false);
    showDivBasedonValue('#first_language', page_localized_other, '#first_language_other_display', false);
    // true means hide if there is something in the username field
    showDivBasedonValue('#username', true, '#anonymous_instructions_display', false); 
    showDivBasedonValue('#microphone', page_localized_other, '#microphone_other_display', false);
    showDivBasedonValue('#dialect', page_localized_other, '#dialect_other_display', false);
    showDivBasedonValue('#recording_location', page_localized_other, '#recording_location_other_display', false);
    showDivBasedonValue('#background_noise', page_localized_yes, '#background_noise_display', false);
    showDivBasedonValue('#noise_type', page_localized_other, '#noise_type_other_display', false);

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
    * see https://stackoverflow.com/questions/10570904/use-jquery-to-change-a-second-select-list-based-on-the-first-select-list-option
    * Store all #subdialect's options in a variable, filter them according 
    * to the value of the chosen option in #dialect, and set them using 
    * .html() in #subdialect:
    */
    var $select1 = $( '#dialect' );
    $( '#sub_dialect select' ).val("Unknown");
    var $select2 = $( '#sub_dialect' );
    var $optgroup = $select2.find( 'optgroup' );
    var $selected = $select2.find( ':selected' );
    var $result = $optgroup.add( $selected );

    $select1.on( 'change', function() {
        var filter =  $result.filter( '[name="' + this.value + '"]' );
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
    var option = '<option value="Unknown">'+ page_please_select + '</option>';
    for (var i=1;i<langscodes.length;i++){
       option += '<option value="'+ langscodes[i] + '">' +
       languages.getLanguageInfo(langscodes[i]).name + " (" +
       languages.getLanguageInfo(langscodes[i]).nativeName + ")" +  
       '</option>';
    }
    option += '<option value="' + page_localized_other + '">' + page_localized_other + '</option>'; 
    $('#first_language').append(option);

    // Prompts

    this.maxnumpromptschanged = document.querySelector('#max_num_prompts');

    // set default (device dependent) max number of prompts the user can record 
    option = ''; // clear previous use of option var
    var startPrompt = 10; // min number of prompts no matter what device
    var incr = 5;
    for (var i=startPrompt; i <= prompts.max_numPrompts_selector; i = i + incr){
       option += '<option value="'+ i + '">' + i +  '</option>';
    }
    $('#max_num_prompts').append(option);

    /**
    * updates the current number of prompts that the user selected from dropdown

    */
    $('#max_num_prompts').click(function () { 
      prompts.userChangedMaxNum( this.value.replace(/[^0-9\.]/g,'') );
      self.updateProgress();
    });

    // ########################################################################

    var p = profile.getProfileFromBrowserStorage();
    if (p) {
      View.update(p);    
    }
}

/**
* update user display from passed json object
*/
View.update = function (json_object) {
    //Speaker Characteristics
    $('#username').val( Profile.cleanUserInputRemoveSpaces(json_object.username) );
    if (json_object.username) {
      $('#anonymous_instructions_display').hide();
    }
    $('#gender').val( json_object.gender );
    $('#age').val( json_object.age );

    // TODO implied by the page the user is on... 
    // $('#page_language').val( json_object.page_language );

    $('#native_speaker').val( json_object.native_speaker );
    if ( $('#native_speaker').val() === page_localized_yes )
    {
      $("#sub_dialect_display").show();
    } else {
      $("#first_language_display").show();
    }
    $('#first_language').val( json_object.first_language );
    $('#first_language_other').val( Profile.cleanUserInput(json_object.first_language_other) );
    $('#dialect').val( json_object.dialect );
    $('#dialect_other').val( Profile.cleanUserInput(json_object.dialect_other) );
    if ( $('#dialect').val() === page_localized_other )
    {
      $("#dialect_other_display").show();
    }
    $('#sub_dialect').val( json_object.dialect_other );
    //Recording Information:
    $('#microphone').val( json_object.microphone );
    $('#microphone_other').val( Profile.cleanUserInput(json_object.microphone_other) );
    if ( $('#microphone').val() === page_localized_other )
    {
      $("#microphone_other_display").show();
    }

    $('#recording_location').val( json_object.recording_location );
    $('#recording_location_other').val( Profile.cleanUserInput(json_object.recording_location_other) );
    if ( $('#recording_location').val() === page_localized_other )
    {
      $("#recording_location_other_display").show();
    }
    $('#background_noise').val( json_object.background_noise );
    if ( $('#background_noise').val() === page_localized_yes )
    {
      $("#background_noise_display").show();
    }
    $('#noise_volume').val( json_object.noise_volume );
    $('#noise_type').val( json_object.noise_type );
    $('#noise_type_other').val( Profile.cleanUserInput(json_object.noise_type_other) );
    if ( $('#noise_type').val() === page_localized_other )
    {
      $("#noise_type_other_display").show();
    }
    $('#license').val( json_object.license );
    $('#ua_string').val( json_object.ua_string );
}

// ### METHODS #################################################################

/** 
* display upload to VoxForge server status to user
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
* toggle to display directions
*/
View.prototype.directionsInfo = function () {
    $("#directions-display").toggle(); 
}

/**
* hide profile info; otherwise recorded audio will not display properly 
* at bottom of page
*/
View.prototype.hideProfileInfo = function () {
    $("#profile-display").hide();
    $("#profile-button-display").show();
    $("#directions-display").hide();
    $("#directions-button-display").show();
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
* hide all  dynamically created play buttons
* disable does not seem to work with WaveSurfer
*/
View.prototype.hidePlayButtons = function () {
    console.log("disablePlayButtons");
    $('.play').hide();;
}

/**
* show all  dynamically created play buttons
* TODO disable does not seem to work with WaveSurfer
*/
View.prototype.showPlayButtons = function () {
    console.log("enablePlayButtons");
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
* display prompt line
*/
View.prototype.displayPrompt = function (getPromptId, getPromptSentence) {
    document.querySelector('.prompt_id').innerText = getPromptId;
    document.querySelector('.info-display').innerText = getPromptSentence;
}

/**
* run after worker completes audio recording; creates a waveform display of 
* recorded audio and displays text of associated prompt line.  User can
* then review and if needed delete an erroneous recording, which can then be
* re-recorded
*/
View.prototype.displayAudioPlayer = function (obj) 
{
    var prompt_id = obj.prompt_id; // TODO not used yet...
    var blob = obj.blob;
    var no_speech = obj.no_speech;
    var no_trailing_silence = obj.no_trailing_silence;
    var clipping = obj.clipping;
    var too_soft = obj.too_soft;

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
      clipLabel.textContent = prompt_id + prompt_sentence;
    
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
    * TODO This creates an additional audio player that may not be really required given
    * that Wavesurfer now works correctly.  Still usefull to let user adjust volume
    */
    function createAudioPlayer() {
      var audioPlayer = document.createElement('audio');
      audioPlayer.setAttribute('controls', '');
      audioPlayer.controls = true;
      audioPlayer.src = audioURL;
      console.log(prompt_id + " recorder stopped; audio: " + audioURL);

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

      // playbutton inside wavesurfer display
      var button_display_id = "button_" + prompt_id;
      var button = document.createElement(button_display_id);
      button.className = "play btn btn-primary";
      button.textContent = 'Play'; 
      button.setAttribute("onclick", "wavesurfer[" + self.clip_id + "].playPause()");
      var i = document.createElement('i');
      i.className = "glyphicon glyphicon-play";
      button.appendChild(i);

      style.appendChild(button);
      waveformElement.appendChild(style);

      if (no_speech) {
        waveformElement.setAttribute("style", "background: #ff4500");
        waveformElement.innerHTML = "<h4>" + page_alert_message.no_speech + "</h4>";
      } else if (no_trailing_silence) {
        waveformElement.setAttribute("style", "background: #ffA500");
        waveformElement.innerHTML = "<h4>" + page_alert_message.no_trailing_silence + "</h4>";
      //TODO need confidence level for clipping
      } else if (clipping) {
        // TODO should not be able to upload if too loud
        waveformElement.setAttribute("style", "background: #ff4500");
        waveformElement.innerHTML = "<h4>" + page_alert_message.audio_too_loud + "</h4>";
      //TODO need confidence level for soft speaker
      } else if (too_soft) {
        // TODO if too low, increase volume of recording and automatically
        //      increase it for subsequent recordings...
        waveformElement.setAttribute("style", "background: #ff4500");
        waveformElement.innerHTML = "<h4>" + page_alert_message.audio_too_soft + "</h4>";
      }

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
      clipContainer.appendChild(createAudioPlayer());

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


