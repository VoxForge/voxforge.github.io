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
    this.speechCharacteristics = pageVariables.speechCharacteristics;

    this.playbuttontext = pageVariables.playbuttontext;
    this.stopbuttontext = pageVariables.stopbuttontext;

    // where audio files will be displayed in HTML
    this.soundClips = document.querySelector('.sound-clips');
    // unique id for wavesurfer objects in DOM
    this.clip_id = 0;    
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

// TODO create subclass of AudioPlayer which allows display of waveform
// why? because to many embedded if to create waveformdisplay
View.AudioPlayer.prototype._displayAudioBasedOnUserSelection = function(clipContainer) {
    var waveformElement = new View.WaveformElement(
        this.waveformDisplayChecked(),
        this.obj,
        this.waveformdisplay_id,
        this.clip_id,
        this.playbuttontext,
        this.stopbuttontext,        
        this.speechCharacteristics);

    if ( this.waveformDisplayChecked() ) { 
        clipContainer.appendChild( waveformElement.create() );
    } else {
        var waveformElement = waveformElement.create();
        waveformElement.appendChild( this._createAudioPlayer() );
        clipContainer.appendChild( waveformElement );
    }
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

View.AudioPlayer.prototype.reset = function() {
    this.clip_id = 0;
    this.clearSoundClips();    
}

View.AudioPlayer.prototype.clearSoundClips = function() {
    $('.sound-clips').empty();
}

View.AudioPlayer.prototype.waveformDisplayChecked = function() {
    return $('#waveform_display').is(":checked");  
}

// #############################################################################

/**
* this creates the container (i.e. element in the shadow DOM) to be used
* by WaveSurfer to display the audio waveform; Wavesurfer needs the container 
* to exist before being called, so this creates it...
*/
View.WaveformElement = function(
    waveformDisplayChecked,
    obj,
    waveformdisplay_id,
    clip_id,
    playbuttontext,
    stopbuttontext,
    speechCharacteristics)
{
    this.waveformDisplayChecked = waveformDisplayChecked;
    this.obj = obj;
    this.waveformdisplay_id = waveformdisplay_id;
    this.clip_id = clip_id;

    this.playbuttontext = playbuttontext;
    this.stopbuttontext = stopbuttontext;
           
    this.speechCharacteristics = speechCharacteristics;
    this._setspeechCharacteristicsMessages();

    this.errorColor = "#ff7500";
    this.warningColor = "#ffdd00";
    
    this.waveformElement = document.createElement('div');    
}

View.WaveformElement.prototype._setspeechCharacteristicsMessages = function()
{
    this.no_speech_short = this.speechCharacteristics.no_speech_short;    
    this.no_speech_text = this.speechCharacteristics.no_speech_text;

    this.no_trailing_silence_short = this.speechCharacteristics.no_trailing_silence_short;           
    this.no_trailing_silence_text = this.speechCharacteristics.no_trailing_silence_text;

    this.audio_too_soft_short = this.speechCharacteristics.audio_too_soft_short;    
    this.audio_too_soft_text = this.speechCharacteristics.audio_too_soft_text;

    this.audio_too_loud_short = this.speechCharacteristics.audio_too_loud_short;    
    this.audio_too_loud_text = this.speechCharacteristics.audio_too_loud_text;
}

//View.AudioPlayer.prototype._createWaveformElement = function() {
View.WaveformElement.prototype.create = function() { 
    this._setHeader();
    this._setSpeechCharacteristics();
    if ( this.waveformDisplayChecked ) {       
        this._createWaveSurferPlayButton();   
    }
    console.log("clip_id: " + this.clip_id);

    return this.waveformElement;
}

View.WaveformElement.prototype._setHeader = function() {
    // hook for wavesurfer
    this.waveformElement.setAttribute("id", this.waveformdisplay_id);
    // TODO move this to css
    this.waveformElement.setAttribute("style", 
        "border-style: solid; min-width:100px; ");
}

// TODO confirm order of speech characteristic
View.WaveformElement.prototype._setSpeechCharacteristics = function() {
    if (this.obj.no_speech) {
        this._noSpeech();
    } else if (this.obj.no_trailing_silence) {
        this._noTrailingSilence();
    } else if (this.obj.clipping) {
        this._clipping();
    } else if (this.obj.too_soft) {
        this._tooSoft();
    }
}

//TODO need confidence level for clipping
// TODO should not be able to upload if too loud
View.WaveformElement.prototype._clipping = function() {
    this.waveformElement.setAttribute("style", "background: " + this.errorColor);
    this.waveformElement.innerHTML = 
        this._speechCharacteristic2Html(
            "audio_too_loud",
            this.audio_too_loud_short,
            this.audio_too_loud_text, );    
}

//TODO need confidence level for soft speaker
View.WaveformElement.prototype._tooSoft = function() {
    this.waveformElement.setAttribute("style", "background: " + this.warningColor);
    this.waveformElement.innerHTML = 
        this._speechCharacteristic2Html(
            "audio_too_soft",
            this.audio_too_soft_short,
            this.audio_too_soft_text, );    
}

// TODO how to deal with leading silence?
// should be OK since user cannot start reading until after the record button
// has been pressed
View.WaveformElement.prototype._noTrailingSilence = function() {
    this.waveformElement.setAttribute("style", "background: " + this.warningColor);
    this.waveformElement.innerHTML = 
        this._speechCharacteristic2Html(
            "no_trailing_silence",
            this.no_trailing_silence_short,
            this.no_trailing_silence_text, );
}

View.WaveformElement.prototype._noSpeech = function() {
    this.waveformElement.setAttribute("style", "background: " + this.errorColor);
    this.waveformElement.innerHTML =
        this._speechCharacteristic2Html(
            "no_speech",
            this.no_speech_short,
            this.no_speech_text, );
}

/*
 * See settings.html for clickable popup text
 */
View.WaveformElement.prototype._speechCharacteristic2Html = function(
    speechCharacteristicLabel,
    short_text,
    long_text,)
{
    var div_id = '#' + speechCharacteristicLabel + '_popupInfo';
    
    return '<label style="display: inline;" ' +
            'for="' + speechCharacteristicLabel + '">' +
            short_text +
        '</label>' +
        '<a href="' + div_id + '" data-rel="popup" ' +
            'data-transition="pop" ' +
            'class="my-tooltip-btn ui-btn ui-alt-icon ui-nodisc-icon ' +
                'ui-btn-inline ui-icon-info ui-btn-icon-notext" ' +
            'title="'  + long_text + '">' +
        '</a>';
}

View.WaveformElement.prototype._createWaveSurferPlayButton = function() {
    var buttonDiv = document.createElement('div');
    buttonDiv.setAttribute("style", "text-align: center");
    buttonDiv.appendChild( this._createButton() );

    this.waveformElement.appendChild(buttonDiv);
}

/*
 * wavesurfer is a global array containing wavesurfer audio waveform display
 * objects
 */
View.WaveformElement.prototype._createButton = function() {
    var self = this;

    var display_id = "button_" + this.obj.prompt_id;
    var button = document.createElement(display_id);
    button.className = "play btn btn-primary";
    button.textContent = this.playbuttontext; 
 
    button.onclick = function() {
        var buttonContext = this;
        
        if (this.textContent == self.playbuttontext) {
            this.textContent = self.stopbuttontext;
        } else {
            this.textContent = self.playbuttontext;
        };
        wavesurfer[self.clip_id].playPause();
        wavesurfer[self.clip_id].on('finish', function() {
            buttonContext.textContent = self.playbuttontext;
        } );
    };
    
    return button;
}
