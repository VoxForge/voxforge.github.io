/*
Copyright 2019 VoxForge

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

/**
* setup app settings Popup for user to modify
*/
View.AudioPlayer = function (
    movePrompt2Stack,
    pageVariables,)
{
    this.movePrompt2Stack = movePrompt2Stack;
    this._setAlertMessages(pageVariables.alert_message);

    this.playbuttontext = pageVariables.playbuttontext;
    this.stopbuttontext = pageVariables.stopbuttontext;

    // where audio files will be displayed in HTML
    this.soundClips = document.querySelector('.sound-clips');
    // unique id for wavesurfer objects in DOM
    this.clip_id = 0;    
}

View.AudioPlayer.prototype._setAlertMessages = function(alert) {
    this.no_speech = alert.no_speech;  
    this.no_trailing_silence = alert.no_trailing_silence;
    this.audio_too_soft = alert.audio_too_soft;
    this.audio_too_loud = alert.audio_too_loud;
}

/**
* run after worker completes audio recording; creates a waveform display of 
* recorded audio and displays text of associated prompt line.  User can
* then review and if needed delete an erroneous recording, which can then be
* re-recorded
*/
View.AudioPlayer.prototype.display = function(obj) {
    this.obj = obj;
    this.audioURL = window.URL.createObjectURL(obj.blob);
    this.waveformdisplay_id = "waveformContainer_" + obj.prompt_id;

    this._insertAudioIntoDom();
    return this._displayUserPlayableAudio();
}

View.AudioPlayer.prototype._insertAudioIntoDom = function() {
    this.soundClips.insertBefore(
        this._setUpClipContainer(),
        this.soundClips.children[0]);
}

View.AudioPlayer.prototype._setUpClipContainer = function() {
    var clipContainer = document.createElement('article');
    clipContainer.classList.add('clip');
    
    clipContainer.appendChild( this._createClipLabel() );
    clipContainer.appendChild( this._createDeleteButton() );

    this._displayAudioBasedOnUserSelection(clipContainer);
    
    clipContainer.appendChild( this._createAudioContainer() );

    return clipContainer;
}

/**
* displays the speech recording's transcription
*/
View.AudioPlayer.prototype._createClipLabel = function() {
    // TODO should this should use obj.promptId
    var prompt_id = document.querySelector('.prompt_id').innerText;    
    var prompt_sentence = document.querySelector('.info-display').innerText;
    
    var clipLabel = document.createElement('prompt');
    clipLabel.classList.add('clip-label');
    clipLabel.textContent = prompt_id + " " + prompt_sentence;

    return clipLabel;
}

/**
* create button to allow user to delete a prompt line
*/
View.AudioPlayer.prototype._createDeleteButton = function() {
    var deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete';
    deleteButton.onclick = this._deleteButtonFunc.bind(this);

    return deleteButton;
}

/**
* delete a recorded prompt; which is then saved in prompt_stack so user
* can re-record
*/
View.AudioPlayer.prototype._deleteButtonFunc = function(e) {
    var evtTgt = e.target;
    var prompt_id = evtTgt.parentNode.innerText.split(/(\s+)/).shift();

    this.movePrompt2Stack(evtTgt.parentNode.firstChild.innerText);
    evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
    console.log("prompt deleted: " + prompt_id);

    $('#delete_clicked').click();
}

// TODO create subclass of AudioPlayer which allows display of waveform
// why? because to many embedded if to create waveformdisplay
View.AudioPlayer.prototype._displayAudioBasedOnUserSelection = function(clipContainer) {
    if ( this.waveformDisplayChecked() ) {        
        clipContainer.appendChild( this._createWaveformElement() );
    } else {
        var waveformElement = this._createWaveformElement();
        waveformElement.appendChild( this._createAudioPlayer() );
        clipContainer.appendChild( waveformElement );
    }
}

/**
* this creates the container (i.e. element in the shadow DOM) to be used
* by WaveSurfer to display the audio waveform; Wavesurfer needs the container 
* to exist before being called, so this creates it...
*/
View.AudioPlayer.prototype._createWaveformElement = function() {    
    var waveformElement = document.createElement('div');
    
    this._setHeader(waveformElement);
    this._setSpeechCharacteristics(waveformElement);
    if ( this.waveformDisplayChecked() ) {       
        this._createWaveSurferPlayButton(waveformElement)    
    }
    console.log("clip_id: " + this.clip_id);

    return waveformElement;
}

/**
 * display browser based audio player only; not visualizer
 */
View.AudioPlayer.prototype._createAudioPlayer = function() {
    // TODO this should use obj.promptId
    var prompt_id = document.querySelector('.prompt_id').innerText;
        
    var audioPlayer = document.createElement('audio');
    audioPlayer.classList.add('audio_player');
    audioPlayer.setAttribute('controls', '');
    audioPlayer.controls = true;
    audioPlayer.src = this.audioURL;
    
    console.log(prompt_id + " recorder stopped; audio: " + this.audioURL);

    return audioPlayer;
}

/**
* create easier to access audio links in DOM
* TODO need to figure out how to get audio links from Wavesurfer...
* TODO Firefox records audio in 32-bit float, but cannot play it back....
* this could be used to store 32bit float audio in Firefox, while
* 16bit wav could be sent to WaveSurfer
*/
View.AudioPlayer.prototype._createAudioContainer = function() {
    var audioPlayer = document.createElement('audio');
    audioPlayer.src = this.audioURL;

    return audioPlayer;
}

View.AudioPlayer.prototype._displayUserPlayableAudio = function() {
    var self = this;
    return new Promise(function(resolve, reject) {

        if ( self.waveformDisplayChecked() ) {  
            self._setUpWaveSurfer.call(self, resolve);
        } else {
            resolve(self.obj);
        }

        self.clip_id++;

    });
}

/*
// might be able to simplify this with: https://github.com/cwilso/Audio-Buffer-Draw
// add waveform to waveformElement
// see http://wavesurfer-js.org/docs/
*/
View.AudioPlayer.prototype._setUpWaveSurfer = function(display_resolve) {
    wavesurfer[this.clip_id] = WaveSurfer.create({
        container: '#' + this.waveformdisplay_id,
        scrollParent: true,
        waveColor : 'OliveDrab',
        minPxPerSec: 200,
    });
    wavesurfer[this.clip_id].load(this.audioURL);

    var self = this;
    wavesurfer[this.clip_id].on('ready', function() {
      display_resolve(self.obj);
    });
}

View.AudioPlayer.prototype._setHeader = function(waveformElement) {
    // hook for wavesurfer
    waveformElement.setAttribute("id", this.waveformdisplay_id);
    // TODO move this to css
    waveformElement.setAttribute("style", 
        "border-style: solid; min-width:100px; ");

    return waveformElement;
}

View.AudioPlayer.prototype._setSpeechCharacteristics = function(waveformElement) {
    if (this.obj.no_speech) {
        this._noSpeech(waveformElement);
    } else if (this.obj.no_trailing_silence) {
        this._noTrailingSilence(waveformElement);
    } else if (this.obj.clipping) {
        this._clipping(waveformElement);
    } else if (this.obj.too_soft) {
        this._tooSoft(waveformElement);
    }
}

View.AudioPlayer.prototype._noSpeech = function(waveformElement) {
    waveformElement.setAttribute("style", "background: #ff4500");
    waveformElement.innerHTML = "<h4>" + this.no_speech + "</h4>";
}

View.AudioPlayer.prototype._noTrailingSilence = function(waveformElement) {
    waveformElement.setAttribute("style", "background: #ffA500");
    waveformElement.innerHTML = "<h4>" + this.no_trailing_silence + "</h4>";
}

//TODO need confidence level for clipping
// TODO should not be able to upload if too loud
View.AudioPlayer.prototype._clipping = function(waveformElement) {
    waveformElement.setAttribute("style", "background: #ff4500");
    waveformElement.innerHTML = "<h4>" + this.audio_too_loud + "</h4>";
}

//TODO need confidence level for soft speaker
View.AudioPlayer.prototype._tooSoft = function(waveformElement) {
    waveformElement.setAttribute("style", "background: #ff4500");
    waveformElement.innerHTML = "<h4>" + this.audio_too_soft + "</h4>";
}

View.AudioPlayer.prototype._createWaveSurferPlayButton = function(waveformElement) {
    var buttonDiv = document.createElement('div');
    buttonDiv.setAttribute("style", "text-align: center");
    buttonDiv.appendChild( this._createButton() );

    waveformElement.appendChild(buttonDiv);
}

View.AudioPlayer.prototype._createButton = function() {
    var display_id = "button_" + this.obj.prompt_id;
    var button = document.createElement(display_id);
    button.className = "play btn btn-primary";
    // TODO not sure how to toggle Play/Pause text
    button.textContent = this.playbuttontext; 
    button.setAttribute("onclick", "wavesurfer[" + this.clip_id + "].playPause()");

    return button;
}

View.AudioPlayer.prototype.reset = function() {
    this.clip_id = 0;
    this.clearSoundClips();    
}

View.AudioPlayer.prototype.clearSoundClips = function() {
    $( '.sound-clips' ).empty();
}

View.AudioPlayer.prototype.waveformDisplayChecked = function() {
    return $('#waveform_display').is(":checked");  
}
