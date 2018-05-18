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
                    view, 
                    profile, 
                    audio,
                    recording_timeout,
                    recording_stop_delay,
                    process_last_recording_delay,
                    appversion,)
{
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

        audio.record( prompts.getPromptId() );

        rec_timeout_obj = setTimeout(function(){
          fsm.recordingtimeout();
        }, recording_timeout);
    }

    /**
    * function to be executed after processsing of shadow DOM
    * audio elements completed, otherwise submission package will be
    * missing prompt lines and audio files...
    * basically a blocking wait until audio files get converted into
    * blobs for later processing by zipupload web worker.
    */
    function when_audio_processing_completed () {
      profile.addProfile2LocalStorage();
      prompts.resetIndices();
      view.reset();
      fsm.donesubmission();
      // reset random 3 digit characters for submission name
      profile = new Profile(view);
    }

    view.setRSUButtonDisplay(true, false, false); 

    /**
    * ### Finite State Machine #####################################################
    *
    * see: https://github.com/jakesgordon/javascript-state-machine
    */
    var fsm = new StateMachine({
      init: 'nopromptsrecorded',

      //  name: TRANSITION              from: STATE                  to: STATE                                        
      transitions: [
        { name: 'recordclickedltn',     from: 'nopromptsrecorded',   to: 'recordingltn' },
        { name: 'recordclickedltn',     from: 'promptsrecorded',     to: 'recordingltn' },
        { name: 'recordclickedeqn',     from: 'promptsrecorded',     to: 'recordinglastprompt' },
        { name: 'stopclicked',          from: 'recordingltn',        to: 'promptsrecorded'  },
        { name: 'recordingtimeout',     from: 'recordingltn',        to: 'promptsrecorded' },  
        { name: 'stopclicked',          from: 'recordinglastprompt', to: 'displaymessage'  },
        { name: 'recordingtimeout',     from: 'recordinglastprompt', to: 'displaymessage'  },
        { name: 'yesuploadmessage',     from: 'displaymessage',      to: 'uploading' },
        { name: 'canceluploadmessage',  from: 'displaymessage',      to: 'maxpromptsrecorded' },
        { name: 'uploadclicked',        from: 'maxpromptsrecorded',  to: 'uploading' },
        { name: 'deleteclickedgt1',     from: 'maxpromptsrecorded',  to: 'promptsrecorded'  },
        { name: 'deleteclickedgt1',     from: 'promptsrecorded',     to: 'promptsrecorded'  },
        { name: 'deleteclickedlast',    from: 'promptsrecorded',     to: 'nopromptsrecorded'  },
        { name: 'maxnumpromptsincreased', from: 'maxpromptsrecorded',to: 'promptsrecorded' },
        { name: 'maxnumpromptsincreased', from: 'promptsrecorded',   to: 'promptsrecorded' },
        { name: 'maxnumpromptsincreased', from: 'nopromptsrecorded', to: 'nopromptsrecorded' },
        { name: 'recordedmorethancurrentmaxprompts', from: 'maxpromptsrecorded', to: 'displaymessage' },
        { name: 'recordedmorethancurrentmaxprompts', from: 'promptsrecorded', to: 'displaymessage' },
        { name: 'uploadclicked',        from: 'promptsrecorded',     to: 'uploading' },
        { name: 'donesubmission',       from: 'uploading',           to: 'nopromptsrecorded' },
      ],

      // javascript-state-machine does not like underscores in method or state names...
      methods: {
        // #####################################################################
        // Transition Actions: user initiated
        onStopclicked: function() { 
          audio.endRecording();
        },

        onDeleteclickedgt1: function() { 
          view.updateProgress();
        },

        onDeleteclickedlast: function() { 
          view.updateProgress();
        },

        // Transition Actions: system initiated
        onRecordingtimeout: function() { 
          audio.endRecording();
          //console.log("recorder stopped on timeout of " + recording_timeout + " seconds.");
        },

        // #####################################################################
        // States (Actions to take on entry into given state)
        onPromptsrecorded: function() { 
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
          }, process_last_recording_delay); 
        },

        // at maximum selected prompts, cannot record anymore, must upload to 
        // continue, or delete then upload
        onMaxpromptsrecorded: function() { 
          view.setRSUButtonDisplay(false, false, true);
          //console.log('   *** onMaxprompts state: ' + this.state + " trans: " + this.transitions() );
        },

        // hide upload button when no prompts have been recorded
        onNopromptsrecorded: function() { 
          view.setRSUButtonDisplay(true, false, false);
          //console.log('   *** onNopromptsrecorded state: ' + this.state + " trans: " + this.transitions() );
        },

        onUploading: function() { 
          view.setRSUButtonDisplay(false, false, false);
          //console.log('   *** setRSUButtonDisplay state: ' + this.state + " trans: " + this.transitions() );
          
          // TODO convert passing in of anonymous function to promise...
          // uploadZippedSubmission needs to be converted to promise
          var allClips = document.querySelectorAll('.clip');
          upload( prompts, 
                  profile, 
                  appversion, 
                  allClips,
                  when_audio_processing_completed,
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
      }, recording_stop_delay);
    }

    view.upload.onclick = function() { 
      fsm.uploadclicked();
    }

    view.maxnumpromptschanged.onclick = function() { 
      var p = prompts;

      if (p.max_num_prompts >= p.previous_max_num_prompts) {
        fsm.maxnumpromptsincreased();
      } else { // p.max_num_prompts < p.previous_max_num_prompts
        if (p.prompt_count >= p.max_num_prompts) {
          fsm.recordedmorethancurrentmaxprompts();
        }
      } 
    }

    /** 
     * using a dummy 'delete' div that is triggered by clicking any one
     * delete buttons of a recorded prompt
    */
    view.delete_clicked.onclick = function() { 
      if (prompts.prompt_count > 0) {
         //console.log('deleteclickedgt1: ');
         fsm.deleteclickedgt1();
      } else {
         //console.log('deleteclickedlast: ');
         fsm.deleteclickedlast();
      }
    }

    return fsm;
}


