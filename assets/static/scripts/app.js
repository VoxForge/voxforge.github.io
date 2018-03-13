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
var SPEECHSUBMISSIONAPPVERSION = "0.1";

var RECORDING_TIMEOUT = 15000; // 15 seconds
var RECORDING_STOP_DELAY = 300; 

// TODO need to create a blocking wait before upload message displays
// tried using promises as a kind of semaphore between clickstop on lastprompt 
// and displaymessage... it would still miss a prompt displayed in shadow DOM...

// upload uses shadow DOM entries as database of audio... if browser does not have
// enough time to process the last prompt, it will not be included in upload...
// need to at least wait for RECORDING_STOP_DELAY to complete before displaying
// upload message, because upload() reads from DOM and if not finished 
// recording, it will miss last recording.
var PROCESS_LAST_RECORDING_DELAY = RECORDING_STOP_DELAY + 400; 

/**
* Instantiate classes
*/
var prompts = new Prompts();
var view = new View(); // needs to be before profile object creation
var profile = new Profile();
var audio = new Audio();


// finite state machine object
var fsm = setUpFSM();

/**
* ### Finite State Machine #####################################################
*/
function setUpFSM() {
    /**
    * record audio - used in two states:
    *    1. where less than total number of prompts to record (less than n), or 
    *    2. last prompt
    */
    function recordAudio() {
        view.hideProfileInfo();

        var prompt = prompts.getNextPrompt();
        view.updateProgress();

        // only display prompt when user presses record so that they delay the 
        // start of reading the prompt and give the recording a bit of a leading
        // silence...
        view.displayPrompt(prompts.getPromptId(),prompts.getPromptSentence());

        audio.record();

        rec_timeout_obj = setTimeout(function(){
          fsm.recordingtimeout();
        }, RECORDING_TIMEOUT);
    }

    view.setRSUButtonDisplay(true, false, false); 
  
    //  recording timeout object
    var rec_timeout_obj;

    fsm = new StateMachine({
      init: 'waveformdisplay',

      transitions: [
        { name: 'recordclickedltn',    from: 'waveformdisplay',          to: 'recordingltn' },
        { name: 'recordclickedeqn',    from: 'waveformdisplay',          to: 'recordinglastprompt' },
        { name: 'stopclicked',         from: 'recordingltn',             to: 'waveformdisplay'  },
        { name: 'recordingtimeout',    from: 'recordingltn',             to: 'waveformdisplay' },  
        { name: 'stopclicked',         from: 'recordinglastprompt',      to: 'displaymessage'  },
        { name: 'recordingtimeout',    from: 'recordinglastprompt',      to: 'displaymessage'  },
        { name: 'yesuploadmessage',    from: 'displaymessage',           to: 'uploading' },
        { name: 'canceluploadmessage', from: 'displaymessage',           to: 'maxprompts' },
        { name: 'uploadclicked',       from: 'maxprompts',               to: 'uploading' },
        { name: 'deleteclicked',       from: 'maxprompts',               to: 'waveformdisplay'  },
        { name: 'deleteclicked',       from: 'waveformdisplay',          to: 'waveformdisplay'  },
        { name: 'uploadclicked',       from: 'waveformdisplay',          to: 'uploading' },
        { name: 'donesubmission',      from: 'uploading',                to: 'waveformdisplay' },
      ],

      methods: {
        // Transition Actions: user initiated
        onStopclicked: function() { 
          view.hidePromptDisplay();

          clearTimeout(rec_timeout_obj);

          // actual stopping of recording is delayed because some users hit it
          // early and cut off the end of their recording.
          // unfortunate side-effect is that need to wait for delayed stop of
          // recording to complete before showing upload message, otherwise
          // will not capture last prompt recording...
          setTimeout( function () {
            audio.endRecording();
          }, RECORDING_STOP_DELAY);
        },

        onDeleteclicked: function() { 
          view.updateProgress();
        },

        // Transition Actions: system initiated
        onRecordingtimeout: function() { 
          audio.endRecording();
          console.log("recorder stopped on timeout of " + RECORDING_TIMEOUT + " seconds.");
        },

        // #####################################################################
        // States (Actions to take on entry into given state)
        onWaveformdisplay: function() { 
          view.setRSButtonDisplay(true, false);   
          console.log('   *** onWaveformdisplay state: ' + this.state + " trans: " + this.transitions() );
        },

        // recording less than total number of prompts to record (less than n)
        // (ltn = less then n, where n = total number of prompts)
        onRecordingltn: function() { 
          view.setRSButtonDisplay(false, true);  
          console.log('   *** onRecordingltn state: ' + this.state + " trans: " + this.transitions() );
          recordAudio();
        },

        // n = last prompt
        onRecordinglastprompt: function() {
          view.setRSButtonDisplay(false, true);  
          console.log('   *** onRecordinglastprompt state: ' + this.state + " trans: " + this.transitions() );
          recordAudio();
        },

        onDisplaymessage: function() {
          function messageToUpload () {
              if (confirm('Are you ready to upload your submission?\nIf not, press cancel now,' + 
                    ' and then press Upload once you are ready.')) {
                fsm.yesuploadmessage();
              } else {
                fsm.canceluploadmessage();
              }
          }

          console.log('   *** onDisplaymessage state: ' + this.state + " trans: " + this.transitions() );

          view.setRSUButtonDisplay(false, false, false);
          // to give browser enough time to process the last audio recording
          // TODO this should be blocking until last prompt is displayed in DOM
          setTimeout( function () {
            messageToUpload();
          }, PROCESS_LAST_RECORDING_DELAY); 
        },

        // at maximum selected prompts, cannot record anymore, must upload to 
        // continue, or delete then upload
        onMaxprompts: function() { 
          view.setRSUButtonDisplay(false, false, true);
          console.log('   *** onMaxprompts state: ' + this.state + " trans: " + this.transitions() );
        },

        onUploading: function() { 
          view.setRSUButtonDisplay(false, false, false);
          console.log('   *** setRSUButtonDisplay state: ' + this.state + " trans: " + this.transitions() );

          //upload();
          //profile.addProfile2LocalStorage();
          //prompts.resetIndices();
          //view.reset();
          //fsm.donesubmission();
          // this seems to work OK to cause upload to complete before resetting 
          // everything
          var promise1 =  new Promise(function(resolve, reject) {
            resolve( upload() );
          });
          // need upload() to complete before continuing...
          promise1.then(function(value) {
            console.log('then');
            fsm.donesubmission();
            profile.addProfile2LocalStorage();
            prompts.resetIndices();
            view.reset();
          });
        },
      }
    });

    view.record.onclick = function() { 
        if ( prompts.last() ) {
           fsm.recordclickedeqn(); // eqn = equal n; where n = maxprompts
        } else {
          fsm.recordclickedltn(); // ltn = less than n; where n = maxprompts
        }
    }
    //TODO use actual function reference instead of function calling function
    // but might mess up this context value...
    view.stop.onclick = function() { fsm.stopclicked(); }
    view.upload.onclick = function() { fsm.uploadclicked() }

    return fsm;
}

