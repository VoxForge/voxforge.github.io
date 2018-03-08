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

// display variables
var record = document.querySelector('.record');
var stop = document.querySelector('.stop');
var upload = document.querySelector('.upload');
var soundClips = document.querySelector('.sound-clips');
var canvas = document.querySelector('.visualizer');
// constants
var RECORDING_TIMEOUT = 15000; // 15 seconds
var RECORDING_TIMEOUT = 2000; // 15 seconds

/**
* Instantiate Prompt class
*/
var prompts = new Prompts();

// ### DOM HOOKS ###############################################################

/**
* updates the current number of prompts that the user selected from dropdown
*/
$('#max_num_prompts_disp').click(function () { 
  prompts.max_num_prompts = this.value.replace(/[^0-9\.]/g,'');
  prompts.initPromptStack();
  updateProgress();

  console.log('max_num_prompts:' + prompts.max_num_prompts);
});

// finite state machine object
var fsm;

/**
* ### Finite State Machine #####################################################
*/
function setUpFSM() {
  var timeout_obj;

  fsm = new StateMachine({
    init: 'waveformdisplay',
    transitions: [
      { name: 'recordclicked',       from: 'waveformdisplay',          to: 'recording' },
      { name: 'stopclicked',         from: 'recording',                to: 'waveformdisplay'  },
      { name: 'recordingtimeout',    from: 'recording',                to: 'waveformdisplay' },  
      { name: 'uploadclicked',       from: 'maxpromptwaveformdisplay', to: 'uploading' },
      { name: 'maxpromptsreached',   from: 'waveformdisplay',          to: 'maxpromptwaveformdisplay' }, 
      { name: 'maxpromptsreached',   from: 'maxpromptwaveformdisplay', to: 'messagetoupload' },   
      { name: 'yesuploadmessage',    from: 'messagetoupload',          to: 'uploading' },
      { name: 'canceluploadmessage', from: 'messagetoupload',          to: 'maxpromptwaveformdisplay' },
      { name: 'deleteclicked',       from: 'waveformdisplay',          to: 'waveformdisplay'  },
      { name: 'deleteclicked',       from: 'maxpromptwaveformdisplay', to: 'waveformdisplay'  },
    ],
    methods: {
      // Transition Actions: user initiated
      onStopclicked: function() { 
        stop.disabled = true;
        record.disabled = false;

        $('.info-display').hide();
        record.style.background = "";
        record.style.color = ""; 
        // actual stopping of recording is delayed because some users hit it
        // early and cut off the end of their recording
        setTimeout( function () {
          endRecording();
          if ( prompts.maxPromptsReached() ) {
            fsm.maxpromptsreached();
          }
        }, 400);

        clearTimeout(timeout_obj);
      },
      onUploadclicked: function() { uploading() },
      onDeleteclicked: function() { 
        record.disabled = false;
        updateProgress();
      },
      onYesuploadmessage: function() { console.log('onyesuploadmessage')  },
      onCanceluploadmessage: function() { console.log('oncanceluploadmessage')  },

      // Transition Actions: system initiated
      onRecordingtimeout: function() { 
        endRecording();
        console.log("recorder stopped");
        record.style.background = "";
        record.style.color = "";
      },
      onMaxpromptsreached: function() { console.log('onmaxpromptsreached')  },

      // States Actions: on entry
      onWaveformdisplay: function() { 
        record.disabled = false;
        stop.disabled = true;
        upload.disabled = true;
        console.log('onWaveformdisplay: waiting for user input') 
      },

      onRecording: function() { 
        record.disabled = true;
        var prompt = prompts.getNextPrompt();
        updateProgress();
        if (prompt !== null) {
          stop.disabled = false;
          recording(prompt);

          timeout_obj = setTimeout(function(){
            fsm.recordingtimeout();
          }, RECORDING_TIMEOUT);
        } else {
          stop.disabled = true;
          messageToUpload();
        }
      },

      onMaxpromptsreached:   function() { 
        // to give browser enough time to process the last audio recording
        setTimeout( function () {
          messageToUpload();
          return;
        }, 300); 
      },

      onMaxpromptwaveformdisplay:   function() { console.log('onmaxpromptwaveformdisplay') },

      onMessagetoupload: function() { 
        messageToUpload();
        upload.disabled = false;
        record.disabled = true;
      },

      onUploading: function() { 
        console.log('onUploading');
        upload.disabled = true;
        record.disabled = false;
        uploading();
      }
    }
  });

  record.onclick = function() { fsm.recordclicked() }
  stop.onclick = function() { fsm.stopclicked(); }
  upload.onclick = function() { fsm.upload() }
}


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

