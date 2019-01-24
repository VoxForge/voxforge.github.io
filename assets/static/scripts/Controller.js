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

// needs to be global so that upload event process can check if user is 
// currently recording, and wait for stop in recording before displaying
// submission upload message; used in upload function
var promise_list = [];

function Controller(parms,
                    prompts, 
                    profile,
                    view, 
                    audio,
                    uploader,
                    appversion,
                    pageVariables,
                    alert_message,
                    debug)
{
    this.prompts = prompts; 
    this.profile = profile; 
    this.view = view; 
    this.audio = audio; 
    this.uploader = uploader;
    this.debug = debug;
    this.parms = parms; 
    this.appversion = appversion; 
    this.pageVariables = pageVariables;
    this.alert_message = alert_message;

    //  recording timeout object
    this.rec_timeout_obj;

    this.promise_index = 0;
}

/**
* 
*/
Controller.prototype.start = function () {
    var self = this;

    /**
    * 
    */
    function recordAudio() {
        self.view.hideProfileInfo();

        self.view.updateProgress();

        // only display prompt when user presses record so that they delay the 
        // start of reading the prompt and give the recording a bit of a leading
        // silence...
        self.view.displayPrompt(self.prompts.getPromptId(), self.prompts.getPromptSentence());

        if ( self.view.audioVisualizerChecked() ) {
          //visualize(view, self.audio.analyser); // don't use global view
          self.view.visualize(self.audio.analyser);          
        } 

        self.rec_timeout_obj = setTimeout(function(){
          fsm.recordingtimeout();
        }, self.parms.recording_timeout);

        var vad_run = localStorage.getItem("vad_run") === 'true';
        if ( view.debugChecked() ) {
          promise_list[self.promise_index++] = 
                self.audio.record( self.prompts.getPromptId(), vad_run, self.view.audioVisualizerChecked() )
                .then( self.view.audioPlayer.display.bind(self.view) )
                .then( self.prompts.setAudioCharacteristics.bind(self.prompts) )
                .catch((err) => { console.log(err) });
        } else {
          promise_list[self.promise_index++] = 
                self.audio.record( self.prompts.getPromptId(), vad_run, self.view.audioVisualizerChecked()  )
                .then( self.view.audioPlayer.display.bind(self.view) )
                .catch((err) => { console.log(err) });

          self.prompts.clearAudioCharacteristics.bind(self.prompts);
        }
    }

    /**
    * function to be executed after processsing of shadow DOM
    * audio elements completed, otherwise submission package will be
    * missing prompt lines and audio files...
    * basically a blocking wait until audio files get converted into
    * blobs for later processing by zipupload web worker.
    */
    function saveProfileAndReset (result) {
      self.profile.addProfile2LocalStorage();
      self.prompts.resetIndices();
      self.view.reset();
      self.promise_index=0;

      self.profile.updateRandomStrings();
      
      fsm.donesubmission();
    }

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
        { name: 'uploadclicked',        from: 'recordingfirst',      to: 'recordingfirst' }, // nothing happens if user click upload when recording

        { name: 'recordclickedltn',     from: 'firstpromptrecorded', to: 'recordingmid' },
        { name: 'stopclicked',          from: 'recordingmid',        to: 'midpromptsrecorded'  },
        { name: 'recordingtimeout',     from: 'recordingmid',        to: 'midpromptsrecorded' }, 
        { name: 'uploadclicked',        from: 'recordingmid',        to: 'recordingmid' }, // nothing happens if user click upload when recording
        { name: 'recordclickedltn',     from: 'midpromptsrecorded',  to: 'recordingmid' },

        { name: 'recordclickedlast',    from: 'midpromptsrecorded',  to: 'recordinglast' },
        { name: 'stopclicked',          from: 'recordinglast',       to: 'maxpromptsrecorded'  },
        { name: 'recordingtimeout',     from: 'recordinglast',       to: 'maxpromptsrecorded'  },
        { name: 'uploadclicked',        from: 'recordinglast',       to: 'recordinglast' }, // nothing happens if user click upload when recording
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
          self.audio.endRecording( self.view.audioVisualizerChecked(),
                                   localStorage.getItem("vad_run") === 'true');
        },

        onDeleteclickedoneleft: function() {
          self.view.updateProgress();
        },

        onDeleteclicked: function() {
          self.view.updateProgress();
        },

        // Transition Actions: system initiated
        onRecordingtimeout: function() {
          self.view.hidePromptDisplay(); // !!!!!!
          //self.audio.endRecording( self.view.audioVisualizerChecked() );
          self.audio.endRecording( self.view.audioVisualizerChecked(),
                                   localStorage.getItem("vad_run") === 'true');          
        },

        // #####################################################################
        // Static States
        onNopromptsrecorded: function() {
          self.view.setRSUButtonDisplay(true, false, false);

          if (! self.view.displayRecordingInfoChecked()  && 
              self.uploader.getNumberOfSubmissions() > self.parms.numPrompt2SubmittForRecordInfo &&
              localStorage.getItem("recording_info_asked_user") !== 'true'
              )
          {
              // only ask the user once if they want to activate the Recording Information section
              localStorage.setItem("recording_info_asked_user", true); 
              self.view.recordingInformationButtonDisplay();
              // TODO when this gets sent, Recording information section should display to user rather
              // than being buried under Profile Info
              window.alert(self.alert_message.rec_info_activated);
          }
        },

        // if location changed, notify user
        // if no change in location, check time since last submission, if too long notify user
        onFirstpromptrecorded: function() {
          // inner function
          function checkTimeSinceLastSubmission() {
              if (self.view.timeSinceLastSubmissionChecked() &&
                  self.uploader.timeSinceLastSubmission())
              {
                  window.alert(self.alert_message.time_limit);
                  self.view.profileInfo();
                  self.view.recordingInformation();
              }
          }

          // ###
          if (self.view.displayRecordingInfoChecked() ) {
            if (self.view.geolocationReminderChecked() ) {
              location.getCurrentPosition() // long running function that may or may not return successfully
              .then( function (coords) {
                  if (location.changed(coords) ) {
                      window.alert(self.alert_message.location_change);
                      self.view.profileInfo();
                      self.view.recordingInformation();
                      location.saveToLocalStorage(coords);
                  } else {
                      checkTimeSinceLastSubmission();
                  }
              })
              .catch( function (err) {
                  console.warn("can't get location: " + err);
                  checkTimeSinceLastSubmission();               
              });
            } else  {
                checkTimeSinceLastSubmission();
            }
          }

          if ( self.view.userSaysBackgroundNoise() &&
               localStorage.getItem("vad_run") === 'true')
          {
              window.alert(self.alert_message.noise_Turn_Off_Vad);
          }

          self.view.enableDeleteButtons();
          self.view.showPlayButtons();
          if (self.audio.parms.blockDisplayOfRecordButton) {
              //block display of record button - stays off until after recording is done
              Promise.all(promise_list)
              .then(function() {
                 self.view.setRSButtonDisplay(true, false);
              })
              .catch((err) => { console.log(err) });
          } else { // allows recording even though waveform display not completed
              self.view.setRSButtonDisplay(true, false); 
          }
        },

        onMidpromptsrecorded: function() {
          self.view.enableDeleteButtons();
          self.view.showAudioPlayer();
          self.view.showPlayButtons();
          if (self.audio.parms.blockDisplayOfRecordButton) {
              //block display of record button stays off until after recording is done
              Promise.all(promise_list)
              .then(function() {
                 self.view.setRSButtonDisplay(true, false);
              })
              .catch((err) => { console.log(err) });
          } else { // allows recording even though waveform display not completed
             self.view.setRSButtonDisplay(true, false);
          }
        },

        // at maximum selected prompts, cannot record anymore, must upload to 
        // continue, or delete then record
        onMaxpromptsrecorded: function() { 
          self.view.enableDeleteButtons();
          self.view.showAudioPlayer();
          self.view.showPlayButtons();
          self.view.setRSUButtonDisplay(false, false, true);
        },

        // #####################################################################
        // Action States
        onRecordingfirst: function() {
          self.view.setRSButtonDisplay(false, true);
          recordAudio();
        },

        onRecordingmid: function() { 
          self.view.disableDeleteButtons();
          self.view.hideAudioPlayer();
          self.view.hidePlayButtons();
          self.view.setRSButtonDisplay(false, true);  
          recordAudio(); 
        },

        onRecordinglast: function() {
          self.view.disableDeleteButtons();
          self.view.hideAudioPlayer();
          self.view.hidePlayButtons();
          self.view.setRSButtonDisplay(false, true);  
          recordAudio(); // should be blocking
        },

        onUploading: function() { 
          self.view.disableDeleteButtons();
          self.view.hideAudioPlayer();
          self.view.hidePlayButtons();
          self.view.setRSUButtonDisplay(false, false, false);

          // audio.device_event_buffer_size only available after first recording
          self.profile.setAudioPropertiesAndContraints( 
              self.audio.getAudioPropertiesAndContraints()
          );

          // user may change debug setting just before upload, so only
          // get audio debug values when uploading after at last recorded
          // audio prompt
          if ( self.view.debugChecked() ) {
              self.debug.setValues( 'audio', self.audio.getDebugValues() );
          } else {
              self.debug.clearValues('audio');
          }

          // make sure all promises complete before trying to gather audio
          // from shadow DOM before upload, otherwise will miss some audio 
          // recordings...
          Promise.all(promise_list)
          .then( function() {
              // start of promise chain with multiple parameters needs to be
              // within function; cannot be passed as function reference after
              // Promise.all.
              self.uploader.upload(self.prompts,
                                   self.profile,
                                   self.debug,
                                   self.appversion,
                                   document.querySelectorAll('.clip'), // all clips
                                   self.pageVariables.language,
                                   view.debugChecked())
              .then(saveProfileAndReset)
              .catch(function (err) {
                  console.log(err.message);
                  console.log(err.stack);
              });
          })
          .catch((err) => { console.log(err) });
        },
      }
    });

    // ### associate user button clicks with fsm transitions ###################

    self.view.record.onclick = function() { 
      self.prompts.getNextPrompt();  // sets current_promptLine and increment prompt_count; discarding return value

      if ( self.prompts.lastone() ) {
        fsm.recordclickedlast(); // record last prompt
      } else {
        fsm.recordclickedltn(); // ltn = less than n; where n < maxprompts
      }
    }

    self.view.stop.onclick = function() {
      clearTimeout(self.rec_timeout_obj);
      var start =  Date.now();
      self.view.hidePromptDisplay();

      // actual stopping of recording is delayed because some users hit it
      // early and cut off the end of their recording.
      setTimeout( function () {
        fsm.stopclicked(); 
      }, self.parms.recording_stop_delay);
    }

    self.view.upload.onclick = function() {
      fsm.uploadclicked();
    }

    self.view.maxnumpromptschanged.onChange = function() {
      if ( self.prompts.maxnumpromptsincreased() ) {
        fsm.maxnumpromptsincreased();
      } else { 
        if ( self.prompts.recordedmorethancurrentmaxprompts() ) {
          fsm.recordedmorethancurrentmaxprompts();
        }
      } 
    }

    /** 
     * using a dummy 'delete' div that is triggered by clicking 
     * delete button of any one recorded prompt
    */
    // TODO should we be using an event trigger explicitly rather than a click event?
    self.view.delete_clicked.onclick = function() { 
      // prompt_count has already been decremented in view call to prompts.movePrompt2Stack
      if ( self.prompts.oneleft() ) {
         fsm.deleteclickedoneleft(); // at first prompt which means only one prompt left to delete
      } else {
         fsm.deleteclicked();
      } 
    }
}
