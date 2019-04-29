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

function Controller(
    parms,
    prompts, 
    profile,
    view, 
    audio,
    uploader,
    appversion,
    language,
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
    this.language = language;
    this.alert_message = alert_message;

    this.recording_timeout_obj;
    this.promise_index = 0;
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
// TODO look at converting to State pattern - i.e. use objects for each state
Controller.prototype.start = function () {
    var self = this;

    this.fsm = new StateMachine({
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
        // Transitions: user initiated
        onStopclicked: self._stopclicked.bind(self),
        onDeleteclickedoneleft: self.view.updateProgress.bind(self.view),
        onDeleteclicked: self.view.updateProgress.bind(self.view),

        // Transition Actions: system initiated
        onRecordingtimeout: self._recordingtimeout.bind(self),

        // Static States
        onNopromptsrecorded: self._nopromptsrecorded.bind(self),
        onFirstpromptrecorded: self._firstpromptrecorded.bind(self),
        onMidpromptsrecorded: self._midpromptsrecorded.bind(self),
        onMaxpromptsrecorded: self._maxpromptsrecorded.bind(self),

        // Action States
        onRecordingfirst: self._recordingfirst.bind(self),
        onRecordingmid: self._recordingMidLast.bind(self),
        onRecordinglast: self._recordingMidLast.bind(self),
        onUploading: self._uploading.bind(self),
      }
    });

    this._setUpButtonClicksWithFsmTransitions();
    this._setMaxPromptsEvenTrigger();
}

/*
 * associate user button clicks with fsm transitions
 */
Controller.prototype._setUpButtonClicksWithFsmTransitions = function () {
    this._setUpRecordButtonEventWithFsmTransition();
    this._setUpStopButtonEventWithFsmTransition();
    this._setUpUploadButtonEventWithFsmTransition();
    this._setUpDeleteButtonEventWithFsmTransition();
}

Controller.prototype._setUpRecordButtonEventWithFsmTransition = function () {
    var self = this;
    
    this.view.record.onclick = function() {
        // sets current_promptLine and increment prompt_count; discarding return value
        self.prompts.getNextPrompt();  

        if ( self.prompts.lastone() ) {
            self.fsm.recordclickedlast(); // record last prompt
        } else {
            self.fsm.recordclickedltn(); // ltn = less than n; where n < maxprompts
        }
    }
}

Controller.prototype._setUpStopButtonEventWithFsmTransition = function () {
    var self = this;
    
    this.view.stop.onclick = function() {
        clearTimeout(self.recording_timeout_obj);
        var start =  Date.now();
        self.view.hidePromptDisplay();

        // actual stopping of recording is delayed because some users hit it
        // early and cut off the end of their recording.
        setTimeout( function () {
            self.fsm.stopclicked(); 
        }, self.parms.recording_stop_delay);
    }
}

Controller.prototype._setUpUploadButtonEventWithFsmTransition = function () {
    var self = this;
    
    this.view.upload.onclick = function() {
        self.fsm.uploadclicked();
    }
}

/** 
 * using a dummy 'delete' div that is triggered by clicking 
 * delete button of any one recorded prompt
 *
 * TODO should we be using an event trigger explicitly rather than a click event?
*/
Controller.prototype._setUpDeleteButtonEventWithFsmTransition = function () {
    var self = this;

    this.view.delete_clicked.onclick = function() { 
        // prompt_count has already been decremented in view call to prompts.movePrompt2Stack
        if ( self.prompts.oneleft() ) {
            // at first prompt which means only one prompt left to delete
            self.fsm.deleteclickedoneleft(); 
        } else {
            self.fsm.deleteclicked();
        } 
    }   
}

// #############################################################################

Controller.prototype._stopclicked = function () {
    this._endRecording(); 
}

Controller.prototype._recordingtimeout = function () {
    this.view.hidePromptDisplay();
    this._endRecording();      
}

Controller.prototype._endRecording = function () {
    this.audio.endRecording(
        this.view.audioVisualizerChecked(),
        localStorage.getItem("vad_run") === 'true');   
}

Controller.prototype._nopromptsrecorded = function () {
    this.view.setRSUButtonDisplay(true, false, false);

    if (! this.view.displayRecordingInfoChecked()  && 
        this._maxNumSubmissionsReached() &&
        localStorage.getItem("recording_info_asked_user") !== 'true' )
    {
        this._askUserAboutRecordingInformation();
    }
}

/*
only ask the user once if they want to activate the Recording
Information section
TODO when this gets sent, Recording information section should
display to user rather than being buried under Profile Info
* */
Controller.prototype._askUserAboutRecordingInformation = function () {
    localStorage.setItem("recording_info_asked_user", true); 
    this.view.recordingInformationButtonDisplay();
    window.alert(this.alert_message.rec_info_activated);
}

Controller.prototype._maxNumSubmissionsReached = function () {
    return  (this.uploader.getNumberOfSubmissions() >
            this.parms.numPrompt2SubmittForRecordInfo);
}

/*
if location changed, notify user
if no change in location, check time since last submission,
* if too long notify user
*/
Controller.prototype._firstpromptrecorded = function () {
    this._checkRecordingInformationReminder();
    this._IfTooMuchBackgroundnoiseTurnOffVad();
    this._checkForLowEndDevice();
    this.view.enableDeleteButtons();
    this.view.showPlayButtons();
}

Controller.prototype._checkRecordingInformationReminder = function () {
    if (this.view.displayRecordingInfoChecked() ) {
        this._displayRecordingInfoChecked();
    }
}

Controller.prototype._displayRecordingInfoChecked = function () {
    if (this.view.geolocationReminderChecked() ) {
        this._checkForLocationChange();
    } else  {
        this._checkTimeSinceLastSubmission();
    }
}

Controller.prototype._IfTooMuchBackgroundnoiseTurnOffVad = function () {
    if ( this.view.userSaysTooMuchBackgroundNoise() &&
        localStorage.getItem("vad_run") === 'true')
    {
        window.alert(this.alert_message.noise_Turn_Off_Vad);
    }
}

/*
 * on slower devices, allowing user to record while waveform display is still 
 * working can cause dropout/scratches
 */
Controller.prototype._checkForLowEndDevice = function () {
    var self = this;
    
    if (this.audio.parms.blockDisplayOfRecordButton) {
        //block display of record button - stays off until after recording is done
        Promise.all(promise_list)
        .then(function() {
            self.view.setRSButtonDisplay(true, false);
        })
        .catch( function (err) {
            console.log(err) }
        );
    } else { // allows recording even though waveform display not completed
      this.view.setRSButtonDisplay(true, false); 
    } 
}

Controller.prototype._checkForLocationChange = function () {
    var self = this;
    
    location.getCurrentPosition() // long running function that may or may not return successfully
    .then( function (coords) {
        self._processCoordinates(coords);
    })
    .catch( function (err) {
        console.warn("can't get location: " + err);
        self._checkTimeSinceLastSubmission();               
    });
}

Controller.prototype._processCoordinates = function (coords) {
    if ( location.changed(coords) ) {
        this._locationHasChanged(coords);
    } else {
        this._checkTimeSinceLastSubmission();
    }
}

Controller.prototype._locationHasChanged = function (coords) {
    window.alert(this.alert_message.location_change);
    this.view.profileInfo();
    this.view.recordingInformation();
    
    location.saveToLocalStorage(coords);
}

Controller.prototype._checkTimeSinceLastSubmission = function () {
    if (this.view.timeSinceLastSubmissionChecked() &&
        this.uploader.timeSinceLastSubmission())
    {
        window.alert(this.alert_message.time_limit);
        this.view.profileInfo();
        this.view.recordingInformation();
    }
}

Controller.prototype._midpromptsrecorded = function () {
    this.view.enableDeleteButtons();
    this.view.showAudioPlayer();
    this.view.showPlayButtons();

    if (this.audio.parms.blockDisplayOfRecordButton) {
        this._blockDisplayOfRecordButtonUntilRecDone();
    } else { // allows recording even though waveform display not completed
        this._displayOfRecordButtonWhileRecording();
    }
}

/*
 * allows recording even though waveform display not completed
 */
Controller.prototype._displayOfRecordButtonWhileRecording = function () {
    this.view.setRSButtonDisplay(true, false);
}

/*
 * block display of record button stays off until after recording is done
 */
Controller.prototype._blockDisplayOfRecordButtonUntilRecDone = function () {
    var self = this;
    
    Promise.all(promise_list)
    .then(function() {
        self.view.setRSButtonDisplay(true, false);
    })
    .catch( function (err) {
        console.log(err)
    });
}

/*
 * at maximum selected prompts, cannot record anymore, must upload to 
 * continue, or delete then record
 */
Controller.prototype._maxpromptsrecorded = function () {
    this.view.enableDeleteButtons();
    this.view.showAudioPlayer();
    this.view.showPlayButtons();
    this.view.setRSUButtonDisplay(false, false, true);
}

Controller.prototype._recordingfirst = function () {
    this.view.setRSButtonDisplay(false, true);
    this._recordAudio();
}

Controller.prototype._recordingfirst = function () {
    this.view.setRSButtonDisplay(false, true);
    
    this._recordAudio();
}

Controller.prototype._recordingMidLast = function () {
    this.view.disableDeleteButtons();
    this.view.hideAudioPlayer();
    this.view.hidePlayButtons();
    this.view.setRSButtonDisplay(false, true);
    
    this._recordAudio(); 
}

Controller.prototype._uploading = function () {
    this._setupUploadingButtons();
    this._captureAudioPropertiesForDebugging();
    this._dealWithDebugSettings();
    
    this._waitForAllRecordingsToCompleteThenUpload();
}

Controller.prototype._setupUploadingButtons = function () {
    this.view.disableDeleteButtons();
    this.view.hideAudioPlayer();
    this.view.hidePlayButtons();
    this.view.setRSUButtonDisplay(false, false, false);
}

/*
user may change debug setting just before upload, so only
get audio debug values when uploading after at last recorded
audio prompt
*/
Controller.prototype._dealWithDebugSettings = function () {
    if ( this.view.debugChecked() ) {
      this.debug.setValues( 'audio', this.audio.getDebugValues() );
    } else {
      this.debug.clearValues('audio');
    }
}

/*
* audio.device_event_buffer_size only available after first recording
*/
Controller.prototype._captureAudioPropertiesForDebugging = function () {
    this.profile.setAudioPropertiesAndContraints( 
        this.audio.getAudioPropertiesAndContraints()
    );
}

/*
make sure all promises complete before trying to gather audio
from shadow DOM before upload, otherwise will miss some audio 
recordings...
*/
Controller.prototype._waitForAllRecordingsToCompleteThenUpload = function () {
    var self = this;

    Promise.all(promise_list)
    .then( self._uploadPromiseChain.bind(self) )
    .catch(function (err) {
        console.log(err)
    });
}

Controller.prototype._uploadPromiseChain = function () {
    var self = this;
        
    this.uploader.upload(
        self.prompts,
        self.profile,
        self.debug,
        self.appversion,
        document.querySelectorAll('.clip'), // all clips
        self.language,
        self.view.debugChecked())
    .then( self._saveProfileAndReset.bind(self) )
    .catch(function (err) {
        console.log(err.message);
        console.log(err.stack);
    });
}

Controller.prototype._setMaxPromptsEvenTrigger = function () {
    this.view.maxnumpromptschanged.onChange = function() {
        this._dealWithChangeInMaxNumPrompts();
    }
}

Controller.prototype._dealWithChangeInMaxNumPrompts = function () {
    if ( this.prompts.maxnumpromptsincreased() ) {
        this.fsm.maxnumpromptsincreased();
    } else { 
        if ( this.prompts.recordedmorethancurrentmaxprompts() ) {
            this.fsm.recordedmorethancurrentmaxprompts();
        }
    }
}

/**
* ##############################################################################
*/
Controller.prototype._recordAudio = function () {
    this._updateDisplayForRecording();
    this._setRecordingDurationTimeout()
    this._startRecordingPromiseChain(); 
}

/*
 * only display prompt when user presses record so that they delay the 
 * start of reading the prompt and give the recording a bit of a leading
 * silence...
 */
Controller.prototype._updateDisplayForRecording = function () {
    this.view.hideProfileInfo();
    this.view.updateProgress();

    this.view.displayPrompt(
        this.prompts.getPromptId(),
        this.prompts.getPromptSentence() );

    if ( this.view.audioVisualizerChecked() ) {
        this.view.visualize(this.audio.analyser);          
    }
}

Controller.prototype._setRecordingDurationTimeout = function () {
    var self = this;
    
    self.recording_timeout_obj = setTimeout(function(){
        self.fsm.recordingtimeout();
    }, self.parms.recording_timeout);
}

Controller.prototype._startRecordingPromiseChain = function () {
    var self = this;
        
    var vad_run = localStorage.getItem("vad_run") === 'true';
    promise_list[self.promise_index++] = 
        self.audio.record(
            self.prompts.getPromptId(),
            vad_run,
            self.view.audioVisualizerChecked() )
        .then( self.audio.adjustVolumeIfNeeded.bind(self.audio) )             
        .then( self.view.display.bind(self.view) )        
        .then( self._dealWithRecordingDebugSettings.bind(self) )
        .catch(function (err) {
            console.log(err)
        });
}

Controller.prototype._dealWithRecordingDebugSettings = function (obj) {
    if ( this.view.debugChecked() ) {
        this.prompts.setAudioCharacteristics(obj);
    } else {
        this.prompts.clearAudioCharacteristics(obj);
    }
}

/**
* function to be executed after processsing of shadow DOM
* audio elements completed, otherwise submission package will be
* missing prompt lines and audio files...
* perfom call to this method after audio files get converted into
* blobs for later processing by zipupload web worker.
*/
Controller.prototype._saveProfileAndReset = function (result) {
    this.profile.addProfile2LocalStorage();
    this.prompts.resetIndices();
    this.view.reset();
    this.promise_index=0;

    this.profile.updateRandomStrings();

    this.fsm.donesubmission();
}
