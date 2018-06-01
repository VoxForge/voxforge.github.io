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

function Controller(prompts, 
                    profile,
                    view, 
                    audio,
                    recording_timeout,
                    recording_stop_delay,
//                   process_last_recording_delay,
                    appversion,)
{

    var updatedDeviceEventBufferSize = false;

    //  recording timeout object
    var rec_timeout_obj;
    var promise_list = [];
    var promise_index = 0;

    /**
    * 
    */
    function recordAudio() {
        view.hideProfileInfo();

        view.updateProgress();

        // only display prompt when user presses record so that they delay the 
        // start of reading the prompt and give the recording a bit of a leading
        // silence...
        view.displayPrompt(prompts.getPromptId(), prompts.getPromptSentence());

        if (view.displayVisualizer) {
          visualize(view, audio.analyser);
        }

        rec_timeout_obj = setTimeout(function(){
          fsm.recordingtimeout();
        }, recording_timeout);

        promise_list[promise_index++] = 
              audio.record( prompts.getPromptId() )
              .then( view.displayAudioPlayer.bind(view) )
              .then( prompts.setAudioCharacteristics.bind(prompts) );
    }

    /**
    * function to be executed after processsing of shadow DOM
    * audio elements completed, otherwise submission package will be
    * missing prompt lines and audio files...
    * basically a blocking wait until audio files get converted into
    * blobs for later processing by zipupload web worker.
    */
    function saveProfileAndReset () {
      profile.addProfile2LocalStorage();
      prompts.resetIndices();
      view.reset();
      promise_index=0;

      // reset random 3 digit characters for submission name
      profile = new Profile(view, appversion);

      fsm.donesubmission();
    }

    view.setRSUButtonDisplay(true, false, false); 

    /**
    * ### Finite State Machine #####################################################
    *
    * see: https://github.com/jakesgordon/javascript-state-machine

     on<TRANSITION> - convenience shorthand for onAfter<TRANSITION>
     onAfter<TRANSITION> - fired after a specific TRANSITION completes

     on<STATE> - convenience shorthand for onEnter<STATE>
     onEnter<STATE> - fired when entering a specific STATE

    */
    var fsm = new StateMachine({
      init: 'nopromptsrecorded',

      //  name: TRANSITION              from: STATE                  to: STATE                                        
      transitions: [
        { name: 'recordclickedltn',     from: 'nopromptsrecorded',   to: 'recordingfirst' },
        { name: 'stopclicked',          from: 'recordingfirst',      to: 'firstpromptrecorded'  },
        { name: 'recordingtimeout',     from: 'recordingfirst',      to: 'firstpromptrecorded' }, 

        { name: 'recordclickedltn',     from: 'firstpromptrecorded', to: 'recordingmid' },
        { name: 'stopclicked',          from: 'recordingmid',        to: 'midpromptsrecorded'  },
        { name: 'recordingtimeout',     from: 'recordingmid',        to: 'midpromptsrecorded' }, 
        { name: 'recordclickedltn',     from: 'midpromptsrecorded',  to: 'recordingmid' },

        { name: 'recordclickedlast',    from: 'midpromptsrecorded',  to: 'recordinglast' },
        { name: 'stopclicked',          from: 'recordinglast',       to: 'maxpromptsrecorded'  },
        { name: 'recordingtimeout',     from: 'recordinglast',       to: 'maxpromptsrecorded'  },
        { name: 'uploadclicked',        from: 'maxpromptsrecorded',  to: 'uploading' },

        { name: 'deleteclicked',        from: 'firstpromptrecorded', to: 'nopromptsrecorded'  },
        { name: 'deleteclicked',        from: 'midpromptsrecorded',  to: 'midpromptsrecorded'  },
        { name: 'deleteclickedoneleft', from: 'midpromptsrecorded',  to: 'firstpromptrecorded'  },
        { name: 'deleteclicked',        from: 'maxpromptsrecorded',  to: 'midpromptsrecorded'  },

        { name: 'maxnumpromptsincreased', from: 'nopromptsrecorded',   to: 'nopromptsrecorded' },
        { name: 'maxnumpromptsincreased', from: 'firstpromptrecorded', to: 'firstpromptrecorded' },
        { name: 'maxnumpromptsincreased', from: 'midpromptsrecorded',  to: 'midpromptsrecorded' },
        { name: 'maxnumpromptsincreased', from: 'maxpromptsrecorded',  to: 'midpromptsrecorded' },

        { name: 'recordedmorethancurrentmaxprompts', from: 'maxpromptsrecorded', to: 'maxpromptsrecorded' },
        { name: 'recordedmorethancurrentmaxprompts', from: 'midpromptsrecorded', to: 'midpromptsrecorded' },

        { name: 'uploadclicked',        from: 'midpromptsrecorded',    to: 'uploading' },
        { name: 'donesubmission',       from: 'uploading',             to: 'nopromptsrecorded' },
      ],

      // javascript-state-machine does not like underscores in method or state names...
      methods: {
        // #####################################################################
        // Transitions: user initiated
        onStopclicked: function() { 
          audio.endRecording();
        },

        onDeleteclickedoneleft: function() { 
          view.updateProgress();
        },

        onDeleteclicked: function() { 
          view.updateProgress();
        },

        // Transition Actions: system initiated
        onRecordingtimeout: function() { 
          audio.endRecording();
        },

        // #####################################################################
        // Static States
        onNopromptsrecorded: function() { 
          view.setRSUButtonDisplay(true, false, false);
          //console.log('   *** onNopromptsrecorded state: ' + this.state + " trans: " + this.transitions() );
        },

        onFirstpromptrecorded: function() {
          view.enableDeleteButtons();
          view.setRSButtonDisplay(true, false);

          // deviceEventBufferSize only available after first recording
          if ( ! updatedDeviceEventBufferSize ) {
            profile.setAudioPropertiesAndContraints( 
                audio.getAudioPropertiesAndContraints()
            );
            profile.setDebugValues( audio.getDebugValues() );
            updatedDeviceEventBufferSize = true;
          }

          //console.log('   *** onFirstpromptrecorded state: ' + this.state + " trans: " + this.transitions() );
        },

        onMidpromptsrecorded: function() { 
          view.enableDeleteButtons();
          view.setRSButtonDisplay(true, false);   
          //console.log('   *** onMidpromptsrecorded state: ' + this.state + " trans: " + this.transitions() );
        },

        // at maximum selected prompts, cannot record anymore, must upload to 
        // continue, or delete then upload
        onMaxpromptsrecorded: function() { 
          view.enableDeleteButtons();
          view.setRSUButtonDisplay(false, false, true);
          //console.log('   *** onMaxprompts state: ' + this.state + " trans: " + this.transitions() );
        },

        // #####################################################################
        // Action States
        onRecordingfirst: function() { 
          view.setRSButtonDisplay(false, true);  
          //console.log('   *** onRecordingltn state: ' + this.state + " trans: " + this.transitions() );
          recordAudio();
        },

        onRecordingmid: function() { 
          view.disableDeleteButtons();
          view.setRSButtonDisplay(false, true);  
          //console.log('   *** onRecordingltn state: ' + this.state + " trans: " + this.transitions() );
          recordAudio(); 
        },

        onRecordinglast: async function() {
          view.disableDeleteButtons();
          view.setRSButtonDisplay(false, true);  
          recordAudio(); // should be blocking
          console.log('   *** onRecordinglast state: ' + this.state + " trans: " + this.transitions() );
        },

        onUploading: function() { 
          view.disableDeleteButtons();
          view.setRSUButtonDisplay(false, false, false);
          //console.log('   *** setRSUButtonDisplay state: ' + this.state + " trans: " + this.transitions() );
          
          // make sure all promises complete before trying to gather audio
          // from shadow DOM before upload, otherwise will miss some stragglers...
          Promise.all(promise_list)
          .then(function() {
            var allClips = document.querySelectorAll('.clip');
            upload(prompts, profile, appversion, allClips)
            .then(saveProfileAndReset);
          });
        },
      }
    });

    view.record.onclick = function() { 
      prompts.getNextPrompt();  // sets current_promptLine and increment prompt_count; discarding return value

      if ( prompts.lastone() ) {
        fsm.recordclickedlast(); // record last prompt
      } else {
        fsm.recordclickedltn(); // ltn = less than n; where n < maxprompts
      }
    }

    view.stop.onclick = function() {
      clearTimeout(rec_timeout_obj);
      var start =  Date.now();
      //console.log("stop clicked" );
      view.hidePromptDisplay();

      // actual stopping of recording is delayed because some users hit it
      // early and cut off the end of their recording.
      setTimeout( function () {
        fsm.stopclicked(); 
      }, recording_stop_delay);
    }

    view.upload.onclick = function() {
      fsm.uploadclicked();
    }

    view.maxnumpromptschanged.onclick = function() {
      if ( prompts.maxnumpromptsincreased() ) {
        fsm.maxnumpromptsincreased();
      } else { 
        if ( prompts.recordedmorethancurrentmaxprompts() ) {
          fsm.recordedmorethancurrentmaxprompts();
        }
      } 
    }

    /** 
     * using a dummy 'delete' div that is triggered by clicking 
     * delete button of any one recorded prompt
    */
    // TODO should we be using an event trigger explicitly rather than a click event?
    view.delete_clicked.onclick = function() { 
      // prompt_count has already been decremented in view call to prompts.movePrompt2Stack
      if ( prompts.oneleft() ) {
         fsm.deleteclickedoneleft(); // at first prompt which means only one prompt left to delete
      } else {
         fsm.deleteclicked();
      } 
    }

    // ###

    return fsm;
}

