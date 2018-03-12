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

/*
https://www.acunetix.com/websitesecurity/cross-site-scripting/
XSS - How Cross-site Scripting works
In order to run malicious JavaScript code in a victim’s browser, 
an attacker must first find a way to inject a payload into a web page that 
the victim visits. 
In order for an XSS attack to take place the vulnerable website needs 
to ***directly include user input in its pages***. An attacker can then 
insert a string that will be used within the web page and treated as
code by the victim’s browser.
This app does not display other users' input in its pages, so no obvious XSS 
vulnerability...

TODO: CSRF - Cross site request forgery

// for testing with Chrome: requires https; can bypass this with:
// google-chrome --user-data-dir=~/temp --unsafely-treat-insecure-origin-as-secure="http://flask.voxforge1.org"
// need Google Chrome version > 58 for wavesurfer to work correctly
*/

// #############################################################################

// constants
var RECORDING_TIMEOUT = 15000; // 15 seconds
var speechSubmissionAppVersion = "0.1";

/**
* Instantiate classes
*/
var prompts = new Prompts();
var profile = new Profile();
var audio = new Audio();
var view = new View();

// finite state machine object
var fsm = setUpFSM();

/**
* ### Finite State Machine #####################################################
*/
function setUpFSM() {
    /**
    * update number of prompts recorded and total number of prompts to record
    */
    function updateProgress() {
      var progress = prompts.getProgressDescription();
      document.querySelector('.progress-display').innerText = progress;
    }

    /**
    * display window to ask user if they want to upload their recordings to 
    * VoxForge server
    */
    function messageToUpload() {
      if (confirm('Are you ready to upload your submission?\nIf not, press cancel now,' + 
	          ' and then press Upload once you are ready.')) {
        fsm.yesuploadmessage();
      } 
      fsm.canceluploadmessage();
    }

  var rec_timeout_obj;
  view.setRSButtonDisplay(false, false); 
  view.setUButtonDisplay(false); 
  fsm = new StateMachine({
    init: 'waveformdisplay',

    transitions: [
      { name: 'recordclickedltn',    from: 'waveformdisplay',          to: 'recordingltn' },
      { name: 'recordclickedeqn',    from: 'waveformdisplay',          to: 'recordinglastprompt' },
      { name: 'stopclicked',         from: 'recordingltn',             to: 'waveformdisplay'  },
      { name: 'recordingtimeout',    from: 'recordingltn',             to: 'waveformdisplay' },  
      { name: 'stopclicked',         from: 'recordinglastprompt',      to: 'maxprompts'  },
      { name: 'recordingtimeout',    from: 'recordinglastprompt',      to: 'maxprompts'  },
      { name: 'yesuploadmessage',    from: 'maxprompts',               to: 'uploading' },
      { name: 'canceluploadmessage', from: 'maxprompts',               to: 'maxprompts' },
      { name: 'uploadclicked',       from: 'maxprompts',               to: 'uploading' },
      { name: 'uploadclicked',       from: 'waveformdisplay',          to: 'uploading' },
      { name: 'deleteclicked',       from: 'waveformdisplay',          to: 'waveformdisplay'  },
      { name: 'deleteclicked',       from: 'maxprompts',               to: 'waveformdisplay'  },
    ],

    methods: {
      // Transition Actions: user initiated
      onStopclicked: function() { 
        view.setRSButtonDisplay(true, false);
        view.hidePromptDisplay();

        // actual stopping of recording is delayed because some users hit it
        // early and cut off the end of their recording
        setTimeout( function () {
          audio.endRecording();
        }, 400);

        clearTimeout(rec_timeout_obj);
      },

      onDeleteclicked: function() { 
        view.setRSButtonDisplay(true, false);
        updateProgress();
      },

      onYesuploadmessage: function() { 
        console.log('onYesuploadmessage')  
      },

      onCanceluploadmessage: function() { 
        console.log('onCanceluploadmessage')  
      },

      onUploadclicked: function() { 
        view.setRSButtonDisplay(true, false);
        uploading() 
      },

      // Transition Actions: system initiated
      onRecordingtimeout: function() { 
        audio.endRecording();
        console.log("recorder stopped");
      },

      onMaxpromptsreached: function() { console.log('onmaxpromptsreached')  },

      // States Actions: on entry
      onWaveformdisplay: function() { 
        view.setRSButtonDisplay(true, false);        
        console.log('onWaveformdisplay: waiting for user input') 
      },

      onRecordingltn: function() { 
        view.setRSButtonDisplay(false, true); 
        view.hideProfileInfo();
        updateProgress();

        var prompt = prompts.getNextPrompt();
        audio.record(prompt);

        rec_timeout_obj = setTimeout(function(){
          fsm.recordingtimeout();
        }, RECORDING_TIMEOUT);
      },

      onRecordinglastprompt: function() { 
        view.setRSButtonDisplay(false, true); 
        view.hideProfileInfo();
        updateProgress();

        var prompt = prompts.getNextPrompt();
        audio.record(prompt);

        rec_timeout_obj = setTimeout(function(){
          fsm.recordingtimeout();
        }, RECORDING_TIMEOUT);
      },

      maxprompts: function() { 
        // to give browser enough time to process the last audio recording
        setTimeout( function () {
          messageToUpload();
          return;
        }, 300); 
      },

      onUploading: function() { 
        console.log('onUploading');
        view.setUButtonDisplay(true); 
        upload();

        document.cookie = 'all_done=true; path=/'; // todo is this require anymore???
        profile.addProfile2LocalStorage();
        prompts.resetIndices();
        audio.clip_id = 0;
        view.clearSoundClips();
      }
    }
  });

  view.record.onclick = function() { 
      if ( prompts.last() ) {
         fsm.recordclickedeqn(); // eqn = equal n; where n = maxprompts
      } else {
        fsm.recordclickedltn(); // ltn = less than n; where n = maxprompts
      }
  }
  view.stop.onclick = function() { fsm.stopclicked(); }
  view.upload.onclick = function() { fsm.upload() }

  return fsm;
}



