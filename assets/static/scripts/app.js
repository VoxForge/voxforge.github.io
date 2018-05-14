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
// TODO figure out javascript & GPL licensing....
// see: https://opensource.stackexchange.com/questions/4360/what-are-the-implications-of-licensing-a-javascript-library-under-gpl
// TODO do we need a manifest file???
// http://diveintohtml5.info/offline.html

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

TODO: CSRF - Cross site request forgery; XSS cross site scripting

// for testing with Chrome: requires https; can bypass this with:
// no longer works: google-chrome -user-data-dir=~/temp --ignore-certificate-errors --unsafely-treat-insecure-origin-as-secure=https://jekyll_voxforge.org

// see: https://stackoverflow.com/questions/32042187/chrome-error-you-are-using-an-unsupported-command-line-flag-ignore-certifcat
// Note: if you actually want to ignore invalid certificates there's an option 
// in chrome://flags you can enable: Allow invalid certificates for resources loaded from localhost
// just start the browser at https://127.0.0.1/en/read/ (note: not same as jekyll with port 4000...)


// need Google Chrome version > 58 for wavesurfer to work correctly
*/

// #############################################################################

// see: http://diveintohtml5.info/everything.html
if( ! window.Worker )
{
  window.alert( page_browser_support.no_worker_message );           
}

if( ! window.indexedDB )
{
  window.alert( page_browser_support.no_indexedDB_message );          
}

if( ! window.FormData )
{
  // this does not work in Windows Edge
  // for work around, see: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Submitting_forms_and_uploading_files
  // this check does not actually catch anything...
  window.alert( page_browser_support.no_formDataSupport_message );           
}

// TODO Edge does not yet support FormData, even though it says it does... 

if (platform.os.family === "Windows" && (platform.name === "Microsoft Edge" || platform.name === "IE" ) )
{
  window.alert( page_browser_support.no_edgeSupport_message );         
}

var vad = true;
var low_powered_device = false;
if (platform.os.family === "Android" ) {
  vad = false;
}

// ### GLOBALS #################################################################

//debugging service workers: chrome://serviceworker-internals

// Note: make sure jekyll_voxforge.org and jekyll2_voxforge.org defined in
// /etc/hosts or on local DNS server;
// (passed as a paramter to serviceworker or webworker)
var uploadURL = 'https://upload.voxforge1.org'; // prod
// !!!!!!
var uploadURL = 'https://jekyll_voxforge.org/index.php'; // test basic workings
//var uploadURL = 'https://jekyll2_voxforge.org/index.php'; // test CORS
// !!!!!!

// #############################################################################

// constants
var SPEECHSUBMISSIONAPPVERSION = "0.1";

var RECORDING_TIMEOUT = 20000; // 20 seconds - silence detection should remove leading and trailing silence
var RECORDING_STOP_DELAY = 1000; 

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
var view = new View();
var profile = new Profile(view.update);
var audio = new Audio(vad, low_powered_device);

// finite state machine object
var fsm = setUpFSM();

/**
* ### Finite State Machine #####################################################
*
* see: https://github.com/jakesgordon/javascript-state-machine
*/
function setUpFSM() {
    //  recording timeout object
    var rec_timeout_obj;

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

    fsm = new StateMachine({
      init: 'waveformdisplay',

      //  name: TRANSITION              from: STATE                  to: STATE                                        
      transitions: [
        { name: 'recordclickedltn',     from: 'waveformdisplay',     to: 'recordingltn' },
        { name: 'recordclickedeqn',     from: 'waveformdisplay',     to: 'recordinglastprompt' },
        { name: 'stopclicked',          from: 'recordingltn',        to: 'waveformdisplay'  },
        { name: 'recordingtimeout',     from: 'recordingltn',        to: 'waveformdisplay' },  
        { name: 'stopclicked',          from: 'recordinglastprompt', to: 'displaymessage'  },
        { name: 'recordingtimeout',     from: 'recordinglastprompt', to: 'displaymessage'  },
        { name: 'yesuploadmessage',     from: 'displaymessage',      to: 'uploading' },
        { name: 'canceluploadmessage',  from: 'displaymessage',      to: 'maxprompts' },
        { name: 'uploadclicked',        from: 'maxprompts',          to: 'uploading' },
        { name: 'deleteclicked',        from: 'maxprompts',          to: 'waveformdisplay'  },
        { name: 'deleteclicked',        from: 'waveformdisplay',     to: 'waveformdisplay'  },
        { name: 'maxnumpromptsincreased', from: 'maxprompts',        to: 'waveformdisplay' },
        { name: 'maxnumpromptsincreased', from: 'waveformdisplay',   to: 'waveformdisplay' },
        { name: 'recordedmorethancurrentmaxprompts', from: 'maxprompts', to: 'displaymessage' },
        { name: 'recordedmorethancurrentmaxprompts', from: 'waveformdisplay', to: 'displaymessage' },
        { name: 'uploadclicked',        from: 'waveformdisplay',     to: 'uploading' },
        { name: 'donesubmission',       from: 'uploading',           to: 'waveformdisplay' },
      ],

      // javascript-state-machine does not like underscores in method or state names...
      methods: {
        // #####################################################################
        // Transition Actions: user initiated
        onStopclicked: function() { 
          audio.endRecording();
        },

        onDeleteclicked: function() { 
          view.updateProgress();
        },

        // Transition Actions: system initiated
        onRecordingtimeout: function() { 
          audio.endRecording();
          //console.log("recorder stopped on timeout of " + RECORDING_TIMEOUT + " seconds.");
        },

        // #####################################################################
        // States (Actions to take on entry into given state)
        onWaveformdisplay: function() { 
          view.setRSButtonDisplay(true, false);   
          //console.log('   *** onWaveformdisplay state: ' + this.state + " trans: " + this.transitions() );
        },

        // recording less than total number of prompts to record (less than n)
        // (ltn = less then n, where n = total number of prompts)
        onRecordingltn: function() { 
          view.setRSButtonDisplay(false, true);  
          //console.log('   *** onRecordingltn state: ' + this.state + " trans: " + this.transitions() );
          recordAudio();
        },

        onRecordinglastprompt: function() {
          view.setRSButtonDisplay(false, true);  
          //console.log('   *** onRecordinglastprompt state: ' + this.state + " trans: " + this.transitions() );
          recordAudio();
        },

        onDisplaymessage: function() {
          function messageToUpload () {
              if (confirm(page_upload_message)) {
                fsm.yesuploadmessage();
              } else {
                fsm.canceluploadmessage();
              }
          }

          //console.log('   *** onDisplaymessage state: ' + this.state + " trans: " + this.transitions() );

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
          //console.log('   *** onMaxprompts state: ' + this.state + " trans: " + this.transitions() );
        },

        onUploading: function() { 
          view.setRSUButtonDisplay(false, false, false);
          //console.log('   *** setRSUButtonDisplay state: ' + this.state + " trans: " + this.transitions() );
          
          // TODO convert passing in of anonymous function to promise...
          upload( 
              // anonymous function to be executed after processsing of shadow DOM
              // audio elements completed, otherwise submission package will be
              // missing prompt lines and audio files...
              // basically a blocking wait until audio files get converted into
              // blobs for later processing by zipupload web worker.
              function when_audio_processing_completed_func () {
                profile.addProfile2LocalStorage();
                prompts.resetIndices();
                view.reset();
                fsm.donesubmission();
                // reset random 3 digit characters for submission name
                profile = new Profile(view.update);
              } 
          );
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

    view.stop.onclick = function() { 
          clearTimeout(rec_timeout_obj);
          var start =  Date.now();
          console.log("stop clicked" );
          view.hidePromptDisplay();
          // actual stopping of recording is delayed because some users hit it
          // early and cut off the end of their recording.
          setTimeout( function () {
            var elasped = Date.now() - start;
            fsm.stopclicked(); 
          }, RECORDING_STOP_DELAY);
    }

    view.upload.onclick = function() { 
        fsm.uploadclicked();
    }

    view.maxnumpromptschanged.onclick = function() { 
      // only return to waveform_display state if user _increases_ the maximum 
      // number of prompts
      if (prompts.max_num_prompts > prompts.previous_max_num_prompts) {
        fsm.maxnumpromptsincreased();
      } else  if (prompts.max_num_prompts < prompts.previous_max_num_prompts) {
        fsm.recordedmorethancurrentmaxprompts();
      } // no transition fired if max_num_prompts == previous_max_num_prompts
    }

    return fsm;
}

